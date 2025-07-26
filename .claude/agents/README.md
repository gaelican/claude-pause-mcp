# Claude Pause Sub-Agents Guide

This directory contains specialized sub-agents designed to assist with various aspects of Claude Pause development. Each agent has deep expertise in their specific domain and can be invoked using the Task tool.

## 🤖 Available Sub-Agents

### 1. **MCP Protocol Specialist** (`mcp-protocol-specialist`)
Expert in Model Context Protocol implementation, WebSocket communication, and distributed systems.
- **Best for**: Protocol implementation, WebSocket issues, tool registration, message flow optimization
- **Tools**: Read, Edit, MultiEdit, Grep, Glob, WebFetch, Bash

### 2. **Dialog Component Engineer** (`dialog-component-engineer`)
Specialist in React dialog components, animations, and accessibility.
- **Best for**: Creating new dialogs, improving UX, implementing animations, accessibility fixes
- **Tools**: Read, Edit, MultiEdit, Write, Grep, Glob

### 3. **Electron IPC Expert** (`electron-ipc-expert`)
Master of Electron inter-process communication and security.
- **Best for**: IPC implementation, security hardening, window management, native OS features
- **Tools**: Read, Edit, MultiEdit, Grep, Bash

### 4. **Test Automation Engineer** (`test-automation-engineer`)
Testing specialist with expertise in Jest, React Testing Library, and Playwright.
- **Best for**: Writing tests, setting up test infrastructure, debugging test failures
- **Tools**: Read, Write, Edit, MultiEdit, Bash, Grep

### 5. **Performance Optimization Analyst** (`performance-optimization-analyst`)
Expert in React performance, memory management, and optimization.
- **Best for**: Performance issues, memory leaks, bundle optimization, rendering optimization
- **Tools**: Read, Edit, Bash, Grep, WebFetch

### 6. **Magic UI Designer** (`magic-ui-designer`)
Specialist in the Magic UI design system and visual effects.
- **Best for**: UI improvements, animations, theme customization, CSS architecture
- **Tools**: Read, Edit, Write, MultiEdit, Glob

### 7. **Build & Deploy Specialist** (`build-deploy-specialist`)
Expert in build tools, CI/CD, and multi-platform distribution.
- **Best for**: Build configuration, CI/CD setup, release automation, platform-specific builds
- **Tools**: Read, Edit, Write, Bash, Grep

### 8. **Troubleshooting Detective** (`troubleshooting-detective`)
Master debugger and problem solver for complex issues.
- **Best for**: Debugging hard problems, analyzing logs, creating diagnostic tools
- **Tools**: Read, Grep, Bash, Edit, WebFetch

### 9. **State Management Architect** (`state-management-architect`)
Expert in React state patterns and complex state synchronization.
- **Best for**: State architecture, Context optimization, performance improvements
- **Tools**: Read, Edit, MultiEdit, Write, Grep

### 10. **Documentation Curator** (`documentation-curator`)
Technical writing specialist for clear, comprehensive documentation.
- **Best for**: Writing docs, API documentation, guides, maintaining doc quality
- **Tools**: Read, Write, Edit, MultiEdit, Glob, WebSearch

## 🚀 How to Use Sub-Agents

### Basic Usage

To use a sub-agent, invoke the Task tool with the agent name:

```
I need help with WebSocket disconnection issues

Claude: I'll use the MCP Protocol Specialist to help with this.

<Task tool invocation with subagent_type="mcp-protocol-specialist">
```

### Example Scenarios

#### Scenario 1: Creating a New Dialog Component
```
User: I need to create a multi-step wizard dialog with validation

Claude: I'll use the Dialog Component Engineer sub-agent to help design and implement this.

Task parameters:
- subagent_type: "dialog-component-engineer"
- prompt: "Create a multi-step wizard dialog component with form validation, step navigation, and progress indication"
```

#### Scenario 2: Debugging Performance Issues
```
User: The app is running slowly when multiple dialogs are open

Claude: I'll use the Performance Optimization Analyst to investigate this issue.

Task parameters:
- subagent_type: "performance-optimization-analyst"
- prompt: "Investigate and fix performance issues when multiple dialogs are open simultaneously"
```

#### Scenario 3: Setting Up CI/CD
```
User: We need automated builds for all platforms

Claude: I'll use the Build & Deploy Specialist to set this up.

Task parameters:
- subagent_type: "build-deploy-specialist"  
- prompt: "Set up GitHub Actions workflow for automated builds on Windows, macOS, and Linux with code signing"
```

## 📋 Sub-Agent Selection Guide

### By Task Type

| Task | Recommended Agent |
|------|------------------|
| Add new MCP tool | MCP Protocol Specialist |
| Create dialog component | Dialog Component Engineer |
| Fix security issue | Electron IPC Expert |
| Write tests | Test Automation Engineer |
| Optimize performance | Performance Optimization Analyst |
| Improve UI/animations | Magic UI Designer |
| Configure builds | Build & Deploy Specialist |
| Debug complex issue | Troubleshooting Detective |
| Design state system | State Management Architect |
| Write documentation | Documentation Curator |

### By Problem Domain

| Domain | Primary Agent | Secondary Agent |
|--------|--------------|-----------------|
| Frontend Issues | Dialog Component Engineer | Magic UI Designer |
| Backend Issues | MCP Protocol Specialist | Electron IPC Expert |
| Performance | Performance Optimization Analyst | Troubleshooting Detective |
| Testing | Test Automation Engineer | Documentation Curator |
| DevOps | Build & Deploy Specialist | Troubleshooting Detective |
| Architecture | State Management Architect | MCP Protocol Specialist |

## 🔧 Advanced Usage

### Combining Multiple Agents

For complex tasks, you might need multiple agents:

```
User: Implement a new real-time collaboration feature

Claude: This requires multiple specialists. I'll coordinate between:
1. MCP Protocol Specialist - for WebSocket real-time sync
2. Dialog Component Engineer - for UI components  
3. State Management Architect - for conflict resolution
4. Test Automation Engineer - for comprehensive testing
```

### Agent Capabilities Matrix

| Agent | Architecture | Implementation | Testing | Debugging | Documentation |
|-------|--------------|----------------|---------|-----------|---------------|
| MCP Protocol | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Dialog Engineer | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| Electron IPC | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| Test Engineer | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Performance | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| UI Designer | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐ |
| Build Specialist | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| Troubleshooter | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| State Architect | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| Doc Curator | ⭐ | ⭐ | ⭐ | ⭐ | ⭐⭐⭐ |

## 💡 Best Practices

### 1. Choose the Right Agent
- Match the agent's expertise to your specific need
- Consider using multiple agents for complex tasks
- Start with the most specialized agent for your problem

### 2. Provide Clear Context
- Describe the problem in detail
- Include error messages or symptoms
- Specify desired outcomes

### 3. Follow Agent Recommendations
- Each agent has deep expertise in their domain
- Trust their architectural decisions
- Implement their suggested patterns

### 4. Iterate and Refine
- Start with the primary issue
- Use follow-up agents for related tasks
- Build incrementally

## 🔍 Agent Implementation Details

Each agent is defined as a Markdown file with:
- **YAML frontmatter**: Metadata including name, description, and tools
- **System prompt**: Detailed expertise and approach
- **Examples**: Common scenarios and solutions
- **Best practices**: Domain-specific guidelines

To add a new sub-agent:
1. Create a new `.md` file in this directory
2. Follow the existing format with frontmatter
3. Write a comprehensive system prompt
4. Include relevant examples and patterns

## 📚 Additional Resources

- [Claude Pause Architecture](../../docs/ARCHITECTURE.md)
- [Development Workflow](../../docs/development/DEVELOPMENT_WORKFLOW.md)
- [MCP Protocol Guide](../../docs/development/MCP_ARCHITECTURE_DEEP_DIVE.md)
- [Component Development](../../docs/COMPONENTS.md)

---

Remember: These agents are specialized tools designed to accelerate development. Use them to leverage deep expertise in specific domains and maintain consistency across the Claude Pause project.