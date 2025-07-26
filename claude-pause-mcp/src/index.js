#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PreferenceManager from './preference-manager.js';
import shouldAskHelper from './should-ask-helper.js';
import WorkflowGuidanceGenerator from './workflow-guidance.js';
import WebSocketClient from './websocket-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLANNER_TOOL_NAME = 'planner';
const TEXT_INPUT_TOOL_NAME = 'text_input';
const SINGLE_CHOICE_TOOL_NAME = 'single_choice';
const MULTI_CHOICE_TOOL_NAME = 'multi_choice';
const SCREENSHOT_REQUEST_TOOL_NAME = 'screenshot_request';
const CONFIRM_TOOL_NAME = 'confirm';

const isWindows = process.platform === 'win32';
const DIALOG_SCRIPT = isWindows 
  ? join(__dirname, '..', 'dialog.bat')
  : join(__dirname, '..', 'dialog.sh');

class ClaudePauseMCPServer {
  constructor() {
    this.decisionHistory = [];
    this.preferenceManager = new PreferenceManager();
    this.guidanceGenerator = new WorkflowGuidanceGenerator();
    this.wsClient = new WebSocketClient();
    
    this.server = new Server(
      {
        name: 'claude-pause-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  // Helper function to extract category from question
  extractCategory(question) {
    const lowercaseQ = question.toLowerCase();
    
    // Common categories based on keywords
    if (lowercaseQ.includes('database') || lowercaseQ.includes('sql')) return 'database';
    if (lowercaseQ.includes('api') || lowercaseQ.includes('rest') || lowercaseQ.includes('graphql')) return 'api';
    if (lowercaseQ.includes('auth') || lowercaseQ.includes('login') || lowercaseQ.includes('security')) return 'auth';
    if (lowercaseQ.includes('style') || lowercaseQ.includes('css') || lowercaseQ.includes('ui')) return 'styling';
    if (lowercaseQ.includes('test') || lowercaseQ.includes('jest') || lowercaseQ.includes('mocha')) return 'testing';
    if (lowercaseQ.includes('framework') || lowercaseQ.includes('library')) return 'framework';
    if (lowercaseQ.includes('deploy') || lowercaseQ.includes('build')) return 'deployment';
    
    // Default category
    return 'general';
  }

  // Helper function to generate smart options based on context
  generateSmartOptions(decision_context) {
    const options = [];
    const contextLower = decision_context.toLowerCase();
    
    // Detect context type
    const isTaskComplete = contextLower.includes('complete') || contextLower.includes('finished') || 
                          contextLower.includes('done') || contextLower.includes('✅');
    const isError = contextLower.includes('error') || contextLower.includes('issue') || 
                   contextLower.includes('problem') || contextLower.includes('⚠️');
    const isProgress = contextLower.includes('progress') || contextLower.includes('update') || 
                      contextLower.includes('📊');
    const isStarting = contextLower.includes('ready') || contextLower.includes('help') || 
                      contextLower.includes('what would you like');
    const needsDecision = contextLower.includes('?') || contextLower.includes('how') || 
                         contextLower.includes('which') || contextLower.includes('should');
    
    // Starting session options
    if (isStarting) {
      options.push({
        label: 'Start a new task',
        value: 'new_task',
        description: 'Describe what you need help with'
      });
      options.push({
        label: 'Review recent work',
        value: 'review_recent',
        description: 'See what we\'ve been working on'
      });
      options.push({
        label: 'Custom request',
        value: 'custom',
        description: 'I have something specific in mind'
      });
    }
    
    // Task completion options
    else if (isTaskComplete) {
      options.push({
        label: 'Start related task',
        value: 'related_task',
        description: 'Continue with something similar'
      });
      options.push({
        label: 'New unrelated task',
        value: 'new_task',
        description: 'Work on something different'
      });
      options.push({
        label: 'Review the changes',
        value: 'review_changes',
        description: 'Look at what was modified'
      });
      options.push({
        label: 'Test the implementation',
        value: 'test',
        description: 'Run tests or verify functionality'
      });
    }
    
    // Error/issue options
    else if (isError) {
      options.push({
        label: 'Try suggested fix',
        value: 'try_fix',
        description: 'Attempt the recommended solution'
      });
      options.push({
        label: 'Show full error details',
        value: 'show_error',
        description: 'I\'ll provide more error information'
      });
      options.push({
        label: 'Try different approach',
        value: 'alternative',
        description: 'Let\'s solve this another way'
      });
      options.push({
        label: 'Skip and continue',
        value: 'skip_error',
        description: 'Move on without fixing this'
      });
    }
    
    // Progress update options
    else if (isProgress) {
      options.push({
        label: 'Continue current approach',
        value: 'continue',
        description: 'Keep going with the plan'
      });
      options.push({
        label: 'Pause and review',
        value: 'pause_review',
        description: 'Let me check the progress'
      });
      options.push({
        label: 'Change approach',
        value: 'change_approach',
        description: 'Try a different strategy'
      });
    }
    
    // General decision options
    else if (needsDecision) {
      options.push({
        label: 'Go with your recommendation',
        value: 'use_recommendation',
        description: 'Use the suggested approach'
      });
      options.push({
        label: 'Show me alternatives',
        value: 'show_alternatives',
        description: 'What are other options?'
      });
      options.push({
        label: 'Let me provide input',
        value: 'custom_input',
        description: 'I have specific requirements'
      });
    }
    
    // Default options for other contexts
    else {
      options.push({
        label: 'Continue',
        value: 'continue',
        description: 'Proceed with the task'
      });
      options.push({
        label: 'Provide more details',
        value: 'more_details',
        description: 'I need to clarify something'
      });
      options.push({
        label: 'Change direction',
        value: 'change_direction',
        description: 'Let\'s try something different'
      });
    }
    
    // Always add session control option at the end
    options.push({
      label: 'End session',
      value: 'end_session',
      description: 'I\'m done for now'
    });
    
    return options;
  }

  // Helper function to generate visual output
  generateVisualOutput(context, options, isMinimalFallback = false) {
    const contextLower = context.toLowerCase();
    
    // Detect context type and use appropriate template
    const isTaskComplete = contextLower.includes('complete') || contextLower.includes('finished') || 
                          contextLower.includes('done') || contextLower.includes('✅');
    const isError = contextLower.includes('error') || contextLower.includes('issue') || 
                   contextLower.includes('problem') || contextLower.includes('⚠️');
    const isProgress = contextLower.includes('progress') || contextLower.includes('update') || 
                      contextLower.includes('📊');
    
    let template = '';
    
    if (isTaskComplete) {
      // Extract task name if possible
      const taskMatch = context.match(/(?:complete|finished|done)[:.]?\s*(.+?)(?:\.|!|$)/i);
      const taskName = taskMatch ? taskMatch[1].trim() : 'Current Task';
      
      template = `# ✅ Task Complete: ${taskName}

${context}

## What would you like to do next?`;
    }
    else if (isError) {
      template = `# ⚠️ Issue Encountered

## What Happened:
${context}

## How would you like to proceed?`;
    }
    else if (isProgress) {
      template = `# 📊 Progress Update

${context}

## Continue with current approach?`;
    }
    else {
      template = `# Decision Required

${context}`;
    }
    
    // Add options
    const optionsMarkdown = options.map((opt, index) => 
      `${index + 1}. **${opt.label}**${opt.description ? `\n   - ${opt.description}` : ''}`
    ).join('\n');
    
    template += `\n\n## Available Options:\n\n${optionsMarkdown}`;
    
    // Add warning if using minimal fallback
    if (isMinimalFallback) {
      template += `\n\n⚠️ **Note**: Using minimal options. For better interaction, agents should provide custom contextual options.`;
    }
    
    // Add dialog features reminder
    template += `\n\n## Dialog Features:
- **Text Input**: Provide detailed custom response
- **Thinking Mode**: Select [Q]uick, [N]ormal, [D]eep, or [U]ltra
- **Attachments**: Paste images (Ctrl+V) or attach files
- **Screenshot**: Capture screen (may not work in WSL)

---
*Select an option or provide custom input below.*`;
    
    return template;
  }

  // Tool usage guide constant
  getToolUsageGuide() {
    return {
      dialog_features: {
        text_input: {
          purpose: 'Collect detailed text responses from users',
          when_to_use: 'Need clarification, additional requirements, or user decisions',
          tip: 'Ask clear, specific questions'
        },
        thinking_mode: {
          options: ['quick', 'normal', 'deep', 'ultra'],
          purpose: 'Control Claude\'s reasoning depth',
          recommendations: {
            quick: 'Simple questions, basic clarifications',
            normal: 'Standard development tasks',
            deep: 'Complex problem-solving, architecture decisions',
            ultra: 'Critical decisions, security-sensitive code'
          }
        },
        image_attachment: {
          methods: ['paste_from_clipboard', 'attach_file'],
          purpose: 'Share screenshots, diagrams, mockups',
          when_to_request: 'UI/UX feedback, error screenshots, design references',
          supported_formats: ['png', 'jpg', 'jpeg', 'gif', 'webp']
        },
        screenshot_tool: {
          purpose: 'Capture current screen state',
          limitations: 'May not work properly in WSL environments',
          when_to_suggest: 'Debugging UI issues, showing current state'
        },
        visual_output: {
          purpose: 'Display formatted content, code snippets, diagrams',
          supports: 'Markdown formatting, code blocks, lists, tables',
          best_practices: 'Use clear headings and structured content'
        }
      },
      auto_generation: {
        visual_output: 'If not provided, generates formatted markdown with context and options',
        options: 'If not provided, generates 3-6 contextual multiple choice options',
        behavior: 'Always includes base options plus context-specific choices'
      },
      best_practices: [
        'Always provide visual_output for better user experience',
        'Include 3-6 relevant options for quick selection',
        'Use markdown formatting in visual_output',
        'Ask one clear question at a time',
        'Provide context about why the decision is needed'
      ]
    };
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: PLANNER_TOOL_NAME,
          description: `Interactive dialog with visual output and multiple choice options.

## 🎯 USAGE PHILOSOPHY:
Balance getting features exactly right with avoiding dialog fatigue. See DIALOG_USAGE_GUIDE.md for complete guidelines.

### MUST ASK:
- First implementation of major features
- Multiple valid approaches (REST vs GraphQL)
- Breaking changes or destructive operations
- Security-sensitive implementations
- User explicitly requests input

### SHOULD ASK:
- UI/UX with no existing pattern
- Performance optimization strategies
- Third-party service selection
- Complex business logic

### DON'T ASK:
- Following established patterns
- Standard CRUD operations
- Obvious bug fixes
- Code formatting/style

IMPORTANT: This tool ALWAYS provides:
1. A comprehensive tool usage guide in the response
2. Visual output with formatted content (auto-generated if not provided)
3. Multiple choice options for quick responses (auto-generated if not provided)

## DIALOG FEATURES:

### 1. Text Input Area
- Purpose: Collect detailed text responses from users
- When to use: Need clarification, additional requirements, or user decisions
- Tip: Ask clear, specific questions

### 2. Thinking Mode Selector
- Options: [Q]uick, [N]ormal, [D]eep, [U]ltra
- Purpose: Control Claude's reasoning depth
- Recommendations:
  - Quick: Simple questions, basic clarifications
  - Normal: Standard development tasks
  - Deep: Complex problem-solving, architecture decisions
  - Ultra: Critical decisions, security-sensitive code

### 3. Image Attachment
- Methods: Paste from clipboard OR attach file
- Purpose: Share screenshots, diagrams, mockups
- When to request: UI/UX feedback, error screenshots, design references
- Supported: PNG, JPG, JPEG, GIF, WebP

### 4. Screenshot Tool
- Purpose: Capture current screen state
- Limitations: May not work properly in WSL environments
- When to suggest: Debugging UI issues, showing current state

### 5. Visual Output Display
- Purpose: Display formatted content, code snippets, diagrams
- Supports: Markdown formatting, code blocks, lists, tables
- Best practice: Use clear headings and structured content

### 6. Multiple Choice Options
- Purpose: Quick selection from predefined choices
- Optimal count: 3-6 options
- Include: Label, value, and optional description

## AUTO-GENERATION BEHAVIOR:
- Visual Output: If not provided, generates formatted markdown with context
- Options: If not provided, shows ONLY basic Continue/Cancel (minimal fallback)
- WARNING: Not providing options severely limits user interaction
- Always provide custom options for the best user experience

## REQUIRED: CUSTOM OPTIONS
**CRITICAL**: You MUST provide 3-6 custom options for EVERY pause_for_input call.
- Options must be specific to the current context
- Never omit options - they are REQUIRED, not optional
- Craft options that directly address the user's situation
- If you don't provide options, only basic Continue/Cancel will be shown

### Crafting Effective Options:
1. **Analyze the context**: What decision is the user actually making?
2. **Provide meaningful paths**: Include expected and alternative approaches
3. **Be specific**: "Fix the error" is better than "Continue"
4. **Include escape routes**: Always have a "try different approach" option
5. **Add a custom option**: "Something else..." for flexibility

### Option Examples by Context:

**Starting a session:**
- "Create a new feature" / "Fix a bug" / "Refactor code" / "Review documentation"

**Task completed:**
- "Test the changes" / "Add more features" / "Create documentation" / "Start new task"

**Error encountered:**
- "See full error details" / "Try suggested fix" / "Debug step-by-step" / "Skip this issue"

**Decision needed:**
- "Use recommended approach" / "See alternatives" / "Let me explain requirements" / "Research more"

## BEST PRACTICES:
1. ALWAYS provide visual_output for better user experience
2. ALWAYS include 3-6 custom, contextual options (REQUIRED!)
3. Use markdown formatting in visual_output for clarity
4. Ask one clear question at a time
5. Provide context about why the decision is needed
6. Consider the user's thinking mode preference
7. Suggest image attachment when visual feedback would help
8. 🎨 USE EMOJIS liberally for a vibrant, engaging experience!

## 🌈 EMOJI USAGE GUIDE:

### Why Use Emojis:
- ✨ Creates visual hierarchy and improves readability
- 🎯 Helps users quickly identify different types of content
- 💡 Makes the interface more friendly and approachable
- 🚀 Adds energy and personality to interactions

### Where to Use Emojis:
1. **Headers & Titles**: Start with relevant emoji (e.g., "🔧 Configuration Options")
2. **Status Indicators**: ✅ Success, ⚠️ Warning, ❌ Error, ⏳ In Progress
3. **Option Labels**: Add emoji before each option for visual distinction
4. **Section Markers**: Use emojis to separate different content areas

### Recommended Emojis by Context:

**Status & Results:**
- ✅ Complete/Success - 🎉 Celebration - 🏆 Achievement
- ⚠️ Warning/Caution - 🔴 Critical - 🟡 Attention
- ❌ Error/Failed - 🐛 Bug - 💥 Crash
- ⏳ Waiting - 🔄 Processing - 📊 Progress

**Actions & Tasks:**
- 🚀 Start/Launch - 🛑 Stop - ⏸️ Pause
- 🔧 Fix/Configure - 🔨 Build - 🧪 Test
- 📝 Write/Document - 📋 List - 📌 Pin
- 🔍 Search/Find - 👀 Review - 🔎 Inspect

**Communication:**
- 💬 Chat/Discuss - 💡 Idea - 🤔 Think
- ❓ Question - ❗ Important - 📢 Announce
- 👍 Approve - 👎 Reject - 🤝 Agree

**Development:**
- 💻 Code - 🌐 Web - 📱 Mobile
- 🗄️ Database - 🔐 Security - 🔑 Auth
- 📦 Package - 🚢 Deploy - 🎯 Target

### Example Visual Output:
\`\`\`markdown
# 🚀 Ready to Start Development!

## 📋 Available Tasks:
- 🆕 Create a new feature
- 🐛 Fix existing bugs
- 🔧 Refactor code
- 📝 Update documentation

## 💡 Quick Tips:
- Use [D]eep thinking for complex problems
- Attach 📸 screenshots for UI issues
- Select 🎯 specific options for faster workflow
\`\`\`

## SESSION LIFECYCLE:

### Starting a Session:
ALWAYS begin with pause_for_input to understand the user's initial request:
- decision_context: "Ready to help! What would you like to work on today?"
- Provide options for common tasks or "Custom request"

### During Tasks:
Call pause_for_input whenever you need:
- ❓ **Clarification**: Missing information or ambiguous requirements
- 🎯 **Major Decisions**: Architecture, approach, or tool choices
- ⚠️ **Errors/Issues**: Problems encountered, need user guidance
- 📊 **Progress Updates**: For long-running or multi-step tasks
- ✅ **Task Complete**: Show results and ask what's next

### Ending a Session:
Only stop calling pause_for_input when:
- User explicitly says "done", "exit", or "stop"
- User cancels the dialog
- User selects a "finish session" option

## VISUAL OUTPUT TEMPLATES:

### Task Completion Template:
\`\`\`markdown
# ✅ Task Complete: [Task Name]

## What I Did:
- [Specific action 1]
- [Specific action 2]

## Results:
[Show output, changes, or created files]

## What would you like to do next?
\`\`\`

### Error/Issue Template:
\`\`\`markdown
# ⚠️ Issue Encountered

## What Happened:
[Clear explanation of the problem]

## Possible Solutions:
1. [Option 1 with explanation]
2. [Option 2 with explanation]

## How would you like to proceed?
\`\`\`

### Progress Update Template:
\`\`\`markdown
# 📊 Progress Update

## Completed:
- ✅ [Completed step 1]
- ✅ [Completed step 2]

## In Progress:
- 🔄 [Current step]

## Remaining:
- ⏳ [Future step 1]
- ⏳ [Future step 2]

## Continue with current approach?
\`\`\`

## CRITICAL USAGE PATTERN:
**IMPORTANT**: After completing ANY task or providing ANY response, you MUST call pause_for_input again to:
- Show the results using the appropriate template
- Ask the user what they'd like to do next
- Provide relevant options based on context

This creates a continuous interactive session. Never end without calling pause_for_input for the next user decision.

## RESPONSE STRUCTURE:
Every response includes:
- user_input: The user's response or decision
- timestamp: When the response was provided
- original_context: The decision context you provided
- tool_usage_guide: Complete guide for all features
- features_used: What was auto-generated vs provided

The tool maintains decision history for context across the session.`,
          inputSchema: {
            type: 'object',
            properties: {
              decision_context: {
                type: 'string',
                description: 'Detailed description of the decision to be made and why user input is needed',
              },
              visual_output: {
                type: 'string',
                description: 'RECOMMENDED: Formatted markdown content providing context, options, or information. Auto-generated if not provided.',
              },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'Short, clear action text' },
                    value: { type: 'string', description: 'Machine-readable identifier' },
                    description: { type: 'string', description: 'Optional helpful context' }
                  },
                  required: ['label', 'value']
                },
                description: 'RECOMMENDED: Multiple choice options (3-6) for quick responses. Auto-generated if not provided.',
              },
              default_action: {
                type: 'string',
                description: 'Optional default action if user provides no input',
              },
            },
            required: ['decision_context'],
          },
        },
        {
          name: TEXT_INPUT_TOOL_NAME,
          description: `Collect free-form text input from the user.

## PURPOSE:
Get detailed text responses, explanations, code snippets, or multi-line input from the user.

## WHEN TO USE:
- Need detailed explanation or clarification
- Collecting code snippets or configuration
- Getting multi-line responses
- User needs to provide extensive context
- First implementation of complex features
- Custom business logic requirements
- API endpoint specifications
- Validation rules or error messages

## WHEN NOT TO USE:
- Simple yes/no questions (use confirm instead)
- Choosing from predefined options (use single_choice)
- Following existing patterns in codebase
- Standard implementations

## FEATURES:
- Large text area with auto-resize
- Character count display
- Tab key support for indentation
- Syntax highlighting hints for code

## AGENT INSTRUCTIONS:
Use this tool when you need more than a simple yes/no or choice selection. Perfect for gathering detailed requirements, code examples, or complex explanations.`,
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The question or prompt to display',
              },
              description: {
                type: 'string',
                description: 'Additional context or instructions (optional)',
              },
              placeholder: {
                type: 'string',
                description: 'Placeholder text for the input field',
              },
              defaultText: {
                type: 'string',
                description: 'Pre-filled text in the input field',
              },
              maxLength: {
                type: 'number',
                description: 'Maximum character length allowed',
              },
              expectsCode: {
                type: 'boolean',
                description: 'Whether the input is expected to be code',
              },
              required: {
                type: 'boolean',
                description: 'Whether input is required (default: true)',
              },
            },
            required: ['question'],
          },
        },
        {
          name: SINGLE_CHOICE_TOOL_NAME,
          description: `Present mutually exclusive options for the user to choose from.

## PURPOSE:
Get the user to select exactly one option from a list of choices.

## WHEN TO USE:
- Decision between 2-8 alternatives
- Selecting a strategy or approach
- Choosing between different implementations
- Any single-selection scenario
- Framework/library selection (React vs Vue vs Angular)
- API design (REST vs GraphQL)
- Database choice (PostgreSQL vs MongoDB)
- Authentication method (JWT vs Session)

## WHEN NOT TO USE:
- Open-ended questions (use text_input)
- Multiple selections needed (use multi_choice)
- Simple yes/no (use confirm)
- When existing pattern is clear

## FEATURES:
- Radio button interface
- Keyboard shortcuts (number keys)
- Optional descriptions for each option
- Compact mode for many options
- Disabled option support

## AGENT INSTRUCTIONS:
Use this when you need the user to make a clear choice between alternatives. Each option should be distinct and mutually exclusive. Include descriptions when the choice requires explanation. Check for existing patterns before asking.`,
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The question to ask',
              },
              description: {
                type: 'string',
                description: 'Additional context (optional)',
              },
              options: {
                type: 'array',
                description: 'Array of options to choose from',
                items: {
                  type: 'object',
                  properties: {
                    value: {
                      type: 'string',
                      description: 'Internal value for the option',
                    },
                    label: {
                      type: 'string',
                      description: 'Display text for the option',
                    },
                    description: {
                      type: 'string',
                      description: 'Optional description',
                    },
                    disabled: {
                      type: 'boolean',
                      description: 'Whether option is disabled',
                    },
                  },
                  required: ['value', 'label'],
                },
              },
              defaultValue: {
                type: 'string',
                description: 'Pre-selected option value',
              },
            },
            required: ['question', 'options'],
          },
        },
        {
          name: MULTI_CHOICE_TOOL_NAME,
          description: `Allow selection of multiple options from a list.

## PURPOSE:
Let the user select zero or more options from a list of choices.

## WHEN TO USE:
- Feature selection
- Selecting multiple files or items
- Configuration options
- Any multi-selection scenario

## FEATURES:
- Checkbox interface
- Select all capability (Ctrl+A)
- Min/max selection constraints
- Option grouping support
- Tag support for categorization
- Clear all button

## AGENT INSTRUCTIONS:
Use when users can select multiple non-exclusive options. You can set minimum and maximum selection constraints. Consider grouping related options together for better organization.`,
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The question to ask',
              },
              description: {
                type: 'string',
                description: 'Additional context (optional)',
              },
              options: {
                type: 'array',
                description: 'Array of options to choose from',
                items: {
                  type: 'object',
                  properties: {
                    value: {
                      type: 'string',
                      description: 'Internal value for the option',
                    },
                    label: {
                      type: 'string',
                      description: 'Display text for the option',
                    },
                    description: {
                      type: 'string',
                      description: 'Optional description',
                    },
                    checked: {
                      type: 'boolean',
                      description: 'Pre-selected state',
                    },
                    disabled: {
                      type: 'boolean',
                      description: 'Whether option is disabled',
                    },
                    group: {
                      type: 'string',
                      description: 'Group name for categorization',
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Tags for additional categorization',
                    },
                  },
                  required: ['value', 'label'],
                },
              },
              minSelections: {
                type: 'number',
                description: 'Minimum number of selections required',
              },
              maxSelections: {
                type: 'number',
                description: 'Maximum number of selections allowed',
              },
              allowEmpty: {
                type: 'boolean',
                description: 'Whether no selection is valid',
              },
            },
            required: ['question', 'options'],
          },
        },
        {
          name: SCREENSHOT_REQUEST_TOOL_NAME,
          description: `Request a screenshot or image from the user.

## PURPOSE:
Get visual information from the user through screenshots or images.

## WHEN TO USE:
- Debugging UI issues
- Getting visual feedback
- Error screenshots
- Design verification
- Visual bug reports

## FEATURES:
- Paste from clipboard (Win+Shift+S)
- Drag and drop support
- Image preview
- Additional text notes
- File type detection

## AGENT INSTRUCTIONS:
Use when you need visual context. Always explain what specific part of the screen you need captured. The user can use Windows Snipping Tool (Win+Shift+S) to capture and paste directly.`,
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'What screenshot is needed',
              },
              description: {
                type: 'string',
                description: 'Specific instructions on what to capture',
              },
            },
            required: ['question'],
          },
        },
        {
          name: CONFIRM_TOOL_NAME,
          description: `Simple yes/no confirmation dialog.

## PURPOSE:
Get a clear yes/no confirmation from the user.

## WHEN TO USE:
- Confirming destructive actions (delete, drop, remove)
- Proceeding with risky operations
- Simple yes/no questions
- Final confirmations before executing
- Before breaking changes
- Production deployments
- Overwriting existing files
- Modifying critical configuration

## WHEN NOT TO USE:
- Multiple options available (use single_choice)
- Need detailed input (use text_input)
- Obvious bug fixes
- Following established patterns

## FEATURES:
- Large, clear Yes/No buttons
- Keyboard shortcuts (Y/N)
- Danger mode for destructive actions
- Warning messages
- Custom button labels

## AGENT INSTRUCTIONS:
Use for binary decisions that need clear user confirmation. Use isDangerous=true for destructive operations. Keep questions concise and clear about consequences. Always use before any destructive action.`,
          inputSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The yes/no question to ask',
              },
              description: {
                type: 'string',
                description: 'Additional context (optional)',
              },
              warning: {
                type: 'string',
                description: 'Warning message to display',
              },
              isDangerous: {
                type: 'boolean',
                description: 'Whether this is a dangerous action',
              },
              defaultToNo: {
                type: 'boolean',
                description: 'Whether to focus No by default',
              },
              yesLabel: {
                type: 'string',
                description: 'Custom label for Yes button',
              },
              noLabel: {
                type: 'string',
                description: 'Custom label for No button',
              },
              title: {
                type: 'string',
                description: 'Window title (default: "Confirm")',
              },
            },
            required: ['question'],
          },
        },
        {
          name: 'initialize_project',
          description: 'Initialize MCP documentation for a project. Creates a comprehensive guide explaining how the planner and ask tools work and updates the project\'s claude.md file. Use this once per project to set up MCP usage instructions.',
          inputSchema: {
            type: 'object',
            properties: {
              project_path: {
                type: 'string',
                description: 'Path to the project root directory. If not provided, uses the current working directory',
              },
              overwrite: {
                type: 'boolean',
                description: 'Whether to overwrite existing MCP_GUIDE.md file if it exists',
              },
            },
            required: [],
          },
        },
        {
          name: 'set_dialog_frequency',
          description: 'Adjust how often dialogs appear. Use this to make Claude more or less autonomous based on user preference.',
          inputSchema: {
            type: 'object',
            properties: {
              frequency: {
                type: 'string',
                enum: ['minimal', 'low', 'normal', 'high'],
                description: 'Dialog frequency level. Minimal: only critical decisions, Low: important decisions, Normal: balanced (default), High: most decisions',
              },
            },
            required: ['frequency'],
          },
        },
        {
          name: 'remember_preference',
          description: 'Store a decision or pattern for future reuse. Reduces dialog fatigue by applying stored preferences.',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Category of the decision (e.g., "api", "database", "styling")',
              },
              decision: {
                type: 'string',
                description: 'Specific decision type (e.g., "framework", "auth_method")',
              },
              value: {
                type: 'string',
                description: 'The chosen value to remember',
              },
              applyToSimilar: {
                type: 'boolean',
                description: 'Whether to apply this choice to similar future decisions',
              },
            },
            required: ['category', 'decision', 'value'],
          },
        },
        {
          name: 'check_preference',
          description: 'Check if there\'s a stored preference for a specific decision. Helps determine whether to ask the user.',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Category of the decision',
              },
              decision: {
                type: 'string',
                description: 'Specific decision type',
              },
              importance: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Importance level of the decision',
              },
            },
            required: ['category', 'decision'],
          },
        },
        {
          name: 'reset_preferences',
          description: 'Reset all stored preferences to defaults. Useful when starting fresh or changing project direction.',
          inputSchema: {
            type: 'object',
            properties: {
              confirm: {
                type: 'boolean',
                description: 'Confirmation to reset (must be true)',
              },
            },
            required: ['confirm'],
          },
        },
        {
          name: 'should_ask_user',
          description: 'Check if you should use a dialog tool for a specific decision. Use this BEFORE using dialog tools to respect user preferences and reduce dialog fatigue.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'Type of decision (e.g., "framework", "api_design", "styling", "security")',
              },
              category: {
                type: 'string',
                enum: ['architecture', 'implementation', 'style', 'configuration'],
                description: 'Category of the decision',
              },
              importance: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Importance level of the decision',
              },
              hasExistingPattern: {
                type: 'boolean',
                description: 'Whether there is an existing pattern in the codebase to follow',
              },
              isFirstImplementation: {
                type: 'boolean',
                description: 'Whether this is the first time implementing this feature',
              },
              isBreakingChange: {
                type: 'boolean',
                description: 'Whether this could break existing functionality',
              },
            },
            required: ['type', 'category', 'importance'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === PLANNER_TOOL_NAME) {
        return await this.handlePlanner(request.params.arguments);
      } else if (request.params.name === TEXT_INPUT_TOOL_NAME) {
        return await this.handleTextInput(request.params.arguments);
      } else if (request.params.name === SINGLE_CHOICE_TOOL_NAME) {
        return await this.handleSingleChoice(request.params.arguments);
      } else if (request.params.name === MULTI_CHOICE_TOOL_NAME) {
        return await this.handleMultiChoice(request.params.arguments);
      } else if (request.params.name === SCREENSHOT_REQUEST_TOOL_NAME) {
        return await this.handleScreenshotRequest(request.params.arguments);
      } else if (request.params.name === CONFIRM_TOOL_NAME) {
        return await this.handleConfirm(request.params.arguments);
      } else if (request.params.name === 'initialize_project') {
        return await this.handleInitializeProject(request.params.arguments);
      } else if (request.params.name === 'set_dialog_frequency') {
        return await this.handleSetDialogFrequency(request.params.arguments);
      } else if (request.params.name === 'remember_preference') {
        return await this.handleRememberPreference(request.params.arguments);
      } else if (request.params.name === 'check_preference') {
        return await this.handleCheckPreference(request.params.arguments);
      } else if (request.params.name === 'reset_preferences') {
        return await this.handleResetPreferences(request.params.arguments);
      } else if (request.params.name === 'should_ask_user') {
        return await this.handleShouldAskUser(request.params.arguments);
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async handlePlanner(args) {
    try {
      // Use minimal fallback if options not provided
      if (!args.options || args.options.length === 0) {
        args.options = [
          {
            label: 'Continue',
            value: 'continue',
            description: 'Proceed with text input'
          },
          {
            label: 'Cancel',
            value: 'cancel',
            description: 'Cancel this dialog'
          }
        ];
      }
      
      // Check if using minimal fallback
      const isMinimalFallback = args.options.length === 2 && 
        args.options[0].value === 'continue' && 
        args.options[1].value === 'cancel';
      
      // Auto-generate visual output if not provided
      if (!args.visual_output) {
        args.visual_output = this.generateVisualOutput(args.decision_context, args.options, isMinimalFallback);
      }
      
      // Log to stderr for debugging
      
      const userInput = await this.executeDialogScript(args);
      
      if (userInput === 'CANCELLED') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                user_input: 'CANCELLED',
                cancelled: true,
                timestamp: new Date().toISOString(),
                original_context: args.decision_context,
                tool_usage_guide: this.getToolUsageGuide(),
                features_used: {
                  visual_output_generated: !args.visual_output,
                  options_generated: !args.options || args.options.length === 0,
                  options_count: args.options.length
                }
              }),
            },
          ],
        };
      }
      
      
      let responseContent = [];
      let decisionText = userInput;
      
      // Check if response is JSON (contains images)
      if (userInput.startsWith('{')) {
        try {
          const jsonResponse = JSON.parse(userInput);
          decisionText = jsonResponse.text;
          
          // Add text response
          responseContent.push({
            type: 'text',
            text: JSON.stringify({
              user_input: decisionText,
              has_images: true,
              image_count: jsonResponse.images.length,
              timestamp: new Date().toISOString(),
              original_context: args.decision_context,
              decision_history_count: this.decisionHistory.length + 1,
              tool_usage_guide: this.getToolUsageGuide(),
              features_used: {
                visual_output_generated: !args.visual_output,
                options_generated: !args.options || args.options.length === 0,
                options_count: args.options.length
              }
            }),
          });
          
          // Add images as separate content items
          jsonResponse.images.forEach((img, index) => {
            
            // Extract base64 data from data URL
            let base64Data = img.data;
            if (base64Data.startsWith('data:')) {
              // Remove data URL prefix (e.g., "data:image/png;base64,")
              const base64Index = base64Data.indexOf('base64,');
              if (base64Index !== -1) {
                base64Data = base64Data.substring(base64Index + 7);
              }
            }
            
            responseContent.push({
              type: 'image',
              data: base64Data,
              mimeType: img.type
            });
          });
        } catch (e) {
          // Fall back to text-only
          responseContent.push({
            type: 'text',
            text: JSON.stringify({
              user_input: userInput,
              timestamp: new Date().toISOString(),
              original_context: args.decision_context,
              decision_history_count: this.decisionHistory.length + 1,
              tool_usage_guide: this.getToolUsageGuide(),
              features_used: {
                visual_output_generated: !args.visual_output,
                options_generated: !args.options || args.options.length === 0,
                options_count: args.options.length
              }
            }),
          });
        }
      } else {
        // Original text-only response
        responseContent.push({
          type: 'text',
          text: JSON.stringify({
            user_input: userInput,
            timestamp: new Date().toISOString(),
            original_context: args.decision_context,
            decision_history_count: this.decisionHistory.length + 1,
            tool_usage_guide: this.getToolUsageGuide(),
            features_used: {
              visual_output_generated: !args.visual_output,
              options_generated: !args.options || args.options.length === 0,
              options_count: args.options.length
            }
          }),
        });
      }
      
      // Record decision
      this.decisionHistory.push({
        timestamp: new Date().toISOString(),
        context: args.decision_context,
        decision: decisionText
      });
      
      // Generate workflow guidance
      const guidance = this.guidanceGenerator.generateGuidance('planner', {
        value: decisionText,
        context: args.decision_context
      }, {
        question: args.decision_context,
        visual_output: args.visual_output
      });
      
      // Add guidance to response
      if (responseContent.length > 0 && responseContent[0].type === 'text') {
        const existingData = JSON.parse(responseContent[0].text);
        existingData.workflow_guidance = guidance;
        responseContent[0].text = JSON.stringify(existingData) + '\n' + guidance;
      }
      
      return {
        content: responseContent,
      };
    } catch (error) {
      
      // Fallback response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              user_input: args.default_action || 'Error occurred',
              timestamp: new Date().toISOString(),
              original_context: args.decision_context,
              tool_usage_guide: this.getToolUsageGuide(),
              features_used: {
                visual_output_generated: !args.visual_output,
                options_generated: !args.options || args.options.length === 0,
                options_count: args.options.length
              }
            }),
          },
        ],
      };
    }
  }


  async executeDialogScript(args) {
    // Extract dialog type from args
    let dialogType;
    let parameters;
    
    if (args.toolType) {
      dialogType = args.toolType;
      parameters = args;
    } else {
      // Legacy planner format
      dialogType = 'planner';
      parameters = {
        toolType: 'planner',
        decision_context: args.decision_context,
        options: args.options || [],
        default_action: args.default_action || '',
        visual_output: args.visual_output || ''
      };
    }
    
    // Try WebSocket first if connected
    if (this.wsClient.isConnected()) {
      try {
        const response = await this.wsClient.sendDialogRequest(dialogType, parameters);
        
        if (response) {
          // Convert WebSocket response to expected format
          if (response.cancelled) {
            return 'CANCELLED';
          }
          
          // Format response based on dialog type
          if (dialogType === 'planner' && response.choice) {
            return JSON.stringify({
              user_input: response.choice,
              timestamp: response.timestamp || new Date().toISOString()
            });
          } else if (dialogType === 'text_input' && response.text !== undefined) {
            return JSON.stringify({
              text: response.text,
              timestamp: response.timestamp || new Date().toISOString()
            });
          } else if (dialogType === 'single_choice' && response.choice) {
            return JSON.stringify({
              choice: response.choice,
              timestamp: response.timestamp || new Date().toISOString()
            });
          } else if (dialogType === 'multi_choice' && response.choices) {
            return JSON.stringify({
              choices: response.choices,
              timestamp: response.timestamp || new Date().toISOString()
            });
          } else if (dialogType === 'screenshot_request' && response.images) {
            return JSON.stringify({
              images: response.images,
              timestamp: response.timestamp || new Date().toISOString()
            });
          } else if (dialogType === 'confirm' && response.confirmed !== undefined) {
            return JSON.stringify({
              confirmed: response.confirmed,
              timestamp: response.timestamp || new Date().toISOString()
            });
          }
          
          // Default response format
          return JSON.stringify(response);
        }
      } catch (error) {
        // Fall through to Electron dialog
      }
    }
    
    // Fall back to Electron dialog
    return this.executeElectronDialog(parameters);
  }
  
  async executeElectronDialog(args) {
    return new Promise((resolve, reject) => {
      // Prepare JSON input for the script
      const jsonData = args;
      
      // For Windows, encode JSON as Base64 to avoid command line parsing issues
      const jsonInput = JSON.stringify(jsonData);
      const dialogArg = isWindows 
        ? Buffer.from(jsonInput).toString('base64')
        : jsonInput;

      // Spawn the dialog script
      const proc = isWindows 
        ? spawn('cmd.exe', ['/c', DIALOG_SCRIPT, dialogArg], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: false
          })
        : spawn(DIALOG_SCRIPT, [jsonInput], {
            stdio: ['ignore', 'pipe', 'pipe']
          });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (stderr) {
        }
        
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Dialog script exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to execute dialog script: ${err.message}`));
      });
    });
  }

  async handleTextInput(args) {
    try {
      const dialogData = {
        toolType: 'text_input',
        ...args
      };

      const result = await this.executeDialogScript(dialogData);
      
      if (result === 'CANCELLED') {
        return { content: [{ type: 'text', text: 'Text input cancelled by user.' }] };
      }
      
      // Try to parse the response
      let response;
      try {
        response = JSON.parse(result);
      } catch (parseError) {
        // If parsing fails, treat it as raw text response
        return { 
          content: [{ 
            type: 'text', 
            text: `User response: ${result}` 
          }] 
        };
      }
      
      // Handle different response types
      if (response.type === 'cancel_to_planner') {
        // User wants to return to planner
        return { 
          content: [{ 
            type: 'text', 
            text: 'User requested to return to planner. Use the planner tool to continue.' 
          }] 
        };
      } else if (response.type === 'text_response') {
        // User switched to text response mode
        return { 
          content: [{ 
            type: 'text', 
            text: 'User switched to text response mode. Use the text_input tool again.' 
          }] 
        };
      } else if (response.type === 'submit') {
        // Normal submission
        const guidance = this.guidanceGenerator.generateGuidance('text_input', response.data, {
          question: args.question
        });
        
        return { 
          content: [{ 
            type: 'text', 
            text: response.data.text + guidance
          }] 
        };
      }
      
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  async handleSingleChoice(args) {
    try {
      const dialogData = {
        toolType: 'single_choice',
        ...args
      };

      const result = await this.executeDialogScript(dialogData);
      
      if (result === 'CANCELLED') {
        return { content: [{ type: 'text', text: 'Selection cancelled by user.' }] };
      }
      
      const response = JSON.parse(result);
      
      if (response.type === 'cancel_to_planner') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User requested to return to planner. Use the planner tool to continue.' 
          }] 
        };
      } else if (response.type === 'text_response') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User wants to provide a text response instead. Use the text_input tool.' 
          }] 
        };
      } else if (response.type === 'submit') {
        // Check if user wants to remember this choice
        if (response.data.rememberChoice && args.question) {
          // Extract category from question (simple heuristic)
          const category = this.extractCategory(args.question);
          const decision = 'choice';
          
          await this.preferenceManager.rememberDecision(
            category,
            decision,
            response.data.value,
            { 
              applyToSimilar: true,
              label: response.data.label,
              question: args.question 
            }
          );
        }
        
        // Generate workflow guidance
        const guidance = this.guidanceGenerator.generateGuidance('single_choice', response.data, {
          question: args.question,
          options: args.options
        });
        
        return { 
          content: [{ 
            type: 'text', 
            text: `Selected: ${response.data.label} (${response.data.value})${response.data.rememberChoice ? '\n✓ Choice remembered for similar decisions' : ''}${guidance}` 
          }] 
        };
      }
      
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  async handleMultiChoice(args) {
    try {
      const dialogData = {
        toolType: 'multi_choice',
        ...args
      };

      const result = await this.executeDialogScript(dialogData);
      
      if (result === 'CANCELLED') {
        return { content: [{ type: 'text', text: 'Selection cancelled by user.' }] };
      }
      
      const response = JSON.parse(result);
      
      if (response.type === 'cancel_to_planner') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User requested to return to planner. Use the planner tool to continue.' 
          }] 
        };
      } else if (response.type === 'text_response') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User wants to provide a text response instead. Use the text_input tool.' 
          }] 
        };
      } else if (response.type === 'submit') {
        const selections = response.data.options.map(opt => opt.label).join(', ');
        return { 
          content: [{ 
            type: 'text', 
            text: `Selected ${response.data.count} options: ${selections}` 
          }] 
        };
      }
      
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  async handleScreenshotRequest(args) {
    try {
      const dialogData = {
        toolType: 'screenshot_request',
        ...args
      };

      const result = await this.executeDialogScript(dialogData);
      
      if (result === 'CANCELLED') {
        return { content: [{ type: 'text', text: 'Screenshot request cancelled by user.' }] };
      }
      
      const response = JSON.parse(result);
      
      if (response.type === 'cancel_to_planner') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User requested to return to planner. Use the planner tool to continue.' 
          }] 
        };
      } else if (response.type === 'text_response') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User wants to provide a text response instead. Use the text_input tool.' 
          }] 
        };
      } else if (response.type === 'submit') {
        const imageInfo = response.data.image;
        const content = [
          { 
            type: 'text', 
            text: `Screenshot received (${imageInfo.width}x${imageInfo.height}, ${Math.round(imageInfo.size/1024)}KB)` 
          }
        ];
        
        // Include the image data
        if (imageInfo.dataUrl) {
          content.push({
            type: 'image',
            data: imageInfo.dataUrl.split(',')[1], // Remove data URL prefix
            mimeType: imageInfo.type
          });
        }
        
        // Include additional text if provided
        if (response.data.additionalText) {
          content.push({
            type: 'text',
            text: `\nAdditional notes: ${response.data.additionalText}`
          });
        }
        
        return { content };
      }
      
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  async handleConfirm(args) {
    try {
      const dialogData = {
        toolType: 'confirm',
        ...args
      };

      const result = await this.executeDialogScript(dialogData);
      
      if (result === 'CANCELLED') {
        return { content: [{ type: 'text', text: 'Confirmation cancelled by user.' }] };
      }
      
      const response = JSON.parse(result);
      
      if (response.type === 'cancel_to_planner') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User requested to return to planner. Use the planner tool to continue.' 
          }] 
        };
      } else if (response.type === 'text_response') {
        return { 
          content: [{ 
            type: 'text', 
            text: 'User wants to provide a text response instead. Use the text_input tool.' 
          }] 
        };
      } else if (response.type === 'submit') {
        const guidance = this.guidanceGenerator.generateGuidance('confirm', response.data, {
          question: args.question,
          isDangerous: args.isDangerous
        });
        
        return { 
          content: [{ 
            type: 'text', 
            text: (response.data.confirmed ? 'Confirmed: Yes' : 'Confirmed: No') + guidance
          }] 
        };
      }
      
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  async handleInitializeProject(args) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Use provided path or current working directory
      const projectPath = args.project_path || process.cwd();
      const overwrite = args.overwrite || false;
      
      
      // Define file paths
      const mcpGuidePath = path.join(projectPath, 'MCP_GUIDE.md');
      const claudeMdPath = path.join(projectPath, 'claude.md');
      
      // Check if MCP_GUIDE.md already exists
      if (!overwrite) {
        try {
          await fs.access(mcpGuidePath);
          return {
            content: [{
              type: 'text',
              text: 'MCP_GUIDE.md already exists in this project. Use overwrite=true to replace it.',
            }],
          };
        } catch (e) {
          // File doesn't exist, continue
        }
      }
      
      // Generate MCP guide content
      const mcpGuideContent = this.generateMCPGuide();
      
      // Write MCP_GUIDE.md
      await fs.writeFile(mcpGuidePath, mcpGuideContent, 'utf8');
      
      // Update or create claude.md
      await this.updateClaudeMd(claudeMdPath, fs);
      
      return {
        content: [{
          type: 'text',
          text: `Successfully initialized MCP documentation for the project!\n\nCreated:\n- MCP_GUIDE.md: Comprehensive guide for using the pause_for_input tool\n- Updated claude.md with MCP usage instructions\n\nThe pause_for_input tool is now documented and ready to use in this project.`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error initializing MCP documentation: ${error.message}`,
        }],
      };
    }
  }

  generateMCPGuide() {
    return `# MCP (Model Context Protocol) Guide

## Overview

This project uses the Claude Pause MCP, which provides an interactive dialog system that allows Claude Code to pause and request user input during development tasks.

## The planner Tool

The \`planner\` tool is automatically used by Claude Code when it needs:
- Clarification on ambiguous requirements
- Design decisions between multiple valid approaches
- User preferences for implementation details
- Confirmation before making significant changes

## How It Works

When Claude needs your input, a dialog window will appear with:

1. **Decision Context**: A clear explanation of what Claude needs to know
2. **Options** (optional): Suggested choices you can select
3. **Response Input**: A text field for your answer
4. **Thinking Mode Selection**: Choose how deeply Claude should analyze your response
5. **Visual Output** (when applicable): Diagrams, layouts, or code structures

## Thinking Modes

Select the appropriate thinking mode based on your needs:

- **[Q] Quick**: Fast responses with minimal analysis (best for simple decisions)
- **[N] Normal**: Standard analysis depth (default choice)
- **[D] Deep**: Extended analysis for complex decisions (slower)
- **[U] Ultra**: Maximum depth analysis for critical decisions (slowest)

Your selected mode is remembered between uses.

## Keyboard Shortcuts

- \`Ctrl+Enter\`: Submit your response
- \`Escape\`: Cancel the dialog
- \`Q\`: Switch to Quick thinking mode
- \`N\`: Switch to Normal thinking mode
- \`D\`: Switch to Deep thinking mode
- \`U\`: Switch to Ultra thinking mode
- \`1-9\`: Quick select numbered options (if provided)
- \`P\`: Toggle planning mode

## Planning Mode

When enabled, planning mode automatically appends a request for Claude to:
1. Continue planning the implementation
2. Present a complete plan using pause_for_input
3. Wait for approval before making code changes

This ensures you can review and approve implementation strategies before execution.

## Best Practices

### For Clear Communication
- Be specific in your responses
- If unsure, ask Claude to provide more context
- Use the visual output to understand proposed changes

### For Efficient Development
- Use Quick mode for simple yes/no decisions
- Use Deep/Ultra mode for architectural decisions
- Enable planning mode for complex features
- Review the decision context carefully before responding

### Response Examples

**Simple Response:**
\`\`\`
"Use React hooks"
\`\`\`

**Detailed Response:**
\`\`\`
"Use React hooks with Context API. Prioritize performance over simplicity. Include proper TypeScript types."
\`\`\`

**With Planning Mode:**
\`\`\`
"Implement using Redux Toolkit. Focus on maintainability."
[Planning mode will add: "Please continue planning..."]
\`\`\`

## Common Scenarios

### Architecture Decisions
Claude: "Should I use REST API or GraphQL for the backend?"
You: Select an option or provide custom guidance

### Implementation Details
Claude: "How should I structure the component hierarchy?"
You: Describe your preferences or approve Claude's suggestion

### Feature Clarification
Claude: "The requirements mention 'user dashboard' - what should this include?"
You: Provide specific features and requirements

## Troubleshooting

### Dialog Doesn't Appear
- Check if the MCP server is running
- Restart Claude Code if needed
- Verify the MCP is properly installed

### Response Not Accepted
- Ensure you click Submit or press Ctrl+Enter
- Check for any error messages
- Try selecting a different thinking mode

## Configuration

The MCP stores preferences in hidden files:
- \`.thinking_mode_preference\`: Your default thinking mode
- \`.planning_mode_preference\`: Planning mode on/off state
- \`.electron_window_bounds.json\`: Window position and size

## Additional Features

### Visual Output Panel
When Claude needs to show diagrams, layouts, or structured data, it appears in the visual output panel. You can:
- Copy the content
- Expand for better viewing
- Clear when no longer needed

### Multiple Choice + Text Input
You can either:
- Select from provided options
- Enter custom text
- Select an option and modify it

### Response History
The tool maintains a history of recent responses for quick reuse.

---

*This guide was generated by the Claude Pause MCP initialization tool.*
`;
  }

  async updateClaudeMd(claudeMdPath, fs) {
    let existingContent = '';
    
    try {
      existingContent = await fs.readFile(claudeMdPath, 'utf8');
    } catch (e) {
      // File doesn't exist, will create new
    }
    
    const mcpSection = `
## MCP Usage

This project uses the Claude Pause MCP for interactive development decisions.

### Quick Reference
- When Claude needs input, a dialog window will appear
- Select thinking mode: [Q]uick, [N]ormal, [D]eep, or [U]ltra
- Use \`Ctrl+Enter\` to submit, \`Escape\` to cancel
- Enable planning mode with \`P\` for systematic development

For detailed instructions, see [MCP_GUIDE.md](./MCP_GUIDE.md).
`;

    if (existingContent) {
      // Check if MCP section already exists
      if (existingContent.includes('## MCP Usage') || existingContent.includes('MCP_GUIDE.md')) {
        return;
      }
      
      // Append to existing content
      const updatedContent = existingContent.trim() + '\n' + mcpSection;
      await fs.writeFile(claudeMdPath, updatedContent, 'utf8');
    } else {
      // Create new claude.md
      const newContent = `# Project Guidelines

This file contains project-specific instructions for Claude Code.
${mcpSection}`;
      await fs.writeFile(claudeMdPath, newContent, 'utf8');
    }
  }

  async handleSetDialogFrequency(args) {
    try {
      await this.preferenceManager.setDialogFrequency(args.frequency);
      
      return {
        content: [{
          type: 'text',
          text: `Dialog frequency set to: ${args.frequency}\n\nThis affects how often I'll ask for your input:\n- minimal: Only critical decisions\n- low: Important decisions only\n- normal: Balanced approach (default)\n- high: Most decisions will prompt for input`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error setting dialog frequency: ${error.message}`,
        }],
      };
    }
  }

  async handleRememberPreference(args) {
    try {
      await this.preferenceManager.rememberDecision(
        args.category,
        args.decision,
        args.value,
        { applyToSimilar: args.applyToSimilar || false }
      );
      
      return {
        content: [{
          type: 'text',
          text: `Preference stored: ${args.category}.${args.decision} = ${args.value}\n${args.applyToSimilar ? 'This will be applied to similar future decisions.' : 'This preference is stored but won\'t be automatically applied.'}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error storing preference: ${error.message}`,
        }],
      };
    }
  }

  async handleCheckPreference(args) {
    try {
      const result = await this.preferenceManager.shouldAsk({
        type: args.decision,
        category: args.category,
        importance: args.importance || 'medium'
      });
      
      let response = `Decision: ${args.category}.${args.decision}\n`;
      response += `Should ask: ${result.shouldAsk ? 'Yes' : 'No'}\n`;
      response += `Reason: ${result.reason}\n`;
      
      if (result.storedValue) {
        response += `Stored preference: ${result.storedValue}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: response,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error checking preference: ${error.message}`,
        }],
      };
    }
  }

  async handleResetPreferences(args) {
    try {
      if (!args.confirm) {
        return {
          content: [{
            type: 'text',
            text: 'Reset cancelled. Set confirm=true to reset all preferences.',
          }],
        };
      }
      
      await this.preferenceManager.reset();
      
      return {
        content: [{
          type: 'text',
          text: 'All preferences have been reset to defaults.\n\nDialog frequency: normal\nStored decisions: cleared\nStored patterns: cleared',
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error resetting preferences: ${error.message}`,
        }],
      };
    }
  }

  async handleShouldAskUser(args) {
    try {
      // Add default values for optional parameters
      const context = {
        type: args.type,
        category: args.category,
        importance: args.importance,
        hasExistingPattern: args.hasExistingPattern || false,
        isFirstImplementation: args.isFirstImplementation || false,
        isBreakingChange: args.isBreakingChange || false,
        userRequested: false
      };
      
      const result = await shouldAskHelper.shouldAsk(context);
      
      let response = `Decision: ${args.type} (${args.category})\n`;
      response += `Importance: ${args.importance}\n`;
      response += `Should ask: ${result.shouldAsk ? 'Yes' : 'No'}\n`;
      response += `Reason: ${result.reason}\n`;
      
      if (result.storedValue) {
        response += `\nStored preference available: ${result.storedValue}`;
      }
      
      // Add guidance
      if (result.shouldAsk) {
        response += '\n\nRecommended tools:';
        if (args.type.includes('choice') || args.type.includes('select')) {
          response += '\n- single_choice or multi_choice for selection';
        } else if (args.type.includes('confirm') || args.isBreakingChange) {
          response += '\n- confirm for yes/no decisions';
        } else {
          response += '\n- text_input for detailed input';
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: response,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error checking decision: ${error.message}`,
        }],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new ClaudePauseMCPServer();
server.run().catch(() => {});