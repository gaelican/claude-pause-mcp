# Claude Pause MCP - deliver-complete Integration Guide

## Overview

The Claude Pause MCP server integrates seamlessly with the deliver-complete workflow system to provide GUI-based user input during development. This ensures that Claude Code builds exactly what users envision by clarifying ambiguous requirements and design decisions.

## How It Works with deliver-complete

### Stage Integration Points

#### 1. **Context & Preservation Stage**
When the Context Archaeologist or Pattern Guardian encounters ambiguous patterns:
```
Example: "Found multiple authentication patterns. Which should be the standard?"
Options: JWT, Session-based, OAuth, Basic Auth
```

#### 2. **Planning Stage**
Architecture Protector uses pause_for_input for critical design decisions:
```
Example: "Component architecture for user dashboard?"
Options: Microservices, Monolithic, Modular monolith, Event-driven
```

#### 3. **Execution Stage**
Implementation agents request clarification on unclear requirements:
```
Example: "Error handling strategy for API failures?"
Input: User provides specific retry logic and user feedback approach
```

#### 4. **Documentation Stage**
Documentation Compiler asks about format preferences:
```
Example: "Documentation format for API endpoints?"
Options: OpenAPI/Swagger, Markdown, JSDoc, All of the above
```

## Automatic Trigger Scenarios

The tool is automatically invoked when deliver-complete agents detect:

### 1. **Ambiguous Requirements**
- Missing implementation details
- Vague quality attributes ("user-friendly", "modern", "fast")
- Incomplete acceptance criteria

### 2. **Multiple Valid Approaches**
- Architecture patterns (MVC vs MVVM vs Component-based)
- State management (Context vs Redux vs Zustand)
- Styling approaches (CSS Modules vs Styled Components)

### 3. **Design Decisions**
- Component structure and hierarchy
- Data flow patterns
- API design choices
- Database schema decisions

### 4. **User Preferences**
- UI/UX patterns
- Color schemes and themes
- Animation and interaction levels
- Accessibility requirements

## Dialog Display

The GUI dialog will show:
- **Title**: "Claude Code Decision Required"
- **Context**: Clear explanation from the agent
- **Current Understanding**: What the agent knows
- **Options**: Radio buttons or text input
- **Default**: Suggested approach (if any)

## Usage Examples

### Example 1: Architecture Decision
```javascript
// Architecture Protector agent code
if (multipleArchitectureOptions) {
  const decision = await tools.use('mcp__claude-pause__pause_for_input', {
    decision_context: `Multiple architecture patterns are suitable for this feature:
    
    Current requirements:
    - User management system
    - Real-time notifications
    - File uploads
    
    I've identified these viable approaches:`,
    options: [
      'REST API with WebSocket for real-time',
      'GraphQL with subscriptions',
      'gRPC with streaming',
      'Event-driven with message queues'
    ],
    default_action: 'REST API with WebSocket for real-time'
  });
}
```

### Example 2: UI Component Design
```javascript
// UI Implementation agent
if (unclearUIRequirements) {
  const decision = await tools.use('mcp__claude-pause__pause_for_input', {
    decision_context: `The user profile page needs design decisions:
    
    Requirements mention "modern and intuitive" but no specifics.
    
    What layout approach should I use?`,
    options: [
      'Single page with scrolling sections',
      'Tabbed interface for different sections',
      'Sidebar navigation with content panels',
      'Card-based responsive grid'
    ]
  });
}
```

### Example 3: Performance Requirements
```javascript
// Quality Guardian agent
if (noPerformanceTargets) {
  const targets = await tools.use('mcp__claude-pause__pause_for_input', {
    decision_context: `No specific performance requirements found.
    
    For the data dashboard with real-time updates, what are your performance expectations?
    
    Please specify:
    - Initial load time target
    - Update frequency for real-time data
    - Maximum acceptable latency`,
    default_action: '2s load time, 1s updates, 100ms latency'
  });
}
```

## Configuration for deliver-complete

Add to your deliver-complete configuration:

```json
{
  "mcp_integration": {
    "pause_tool": {
      "enabled": true,
      "auto_trigger_on": [
        "ambiguous_requirements",
        "multiple_valid_approaches",
        "missing_preferences",
        "unclear_specifications"
      ],
      "dialog_preferences": {
        "tool": "auto",  // auto, zenity, whiptail
        "timeout": null,  // no timeout for user input
        "log_decisions": true
      }
    }
  }
}
```

## Best Practices

1. **Clear Context**: Agents should provide clear, concise context about why input is needed

2. **Meaningful Options**: When providing options, ensure they are distinct and meaningful

3. **Smart Defaults**: Always provide sensible defaults based on common patterns

4. **Decision History**: The tool tracks decisions to learn user preferences over time

5. **Non-Blocking**: If the dialog fails, agents should proceed with defaults rather than blocking

## Troubleshooting

### Dialog Not Appearing
1. Check if GUI dialog tool is installed:
   ```bash
   # For best experience, install zenity:
   sudo apt-get install zenity
   ```

2. Verify MCP server is running:
   ```bash
   claude mcp list
   ```

### Using with WSL
The tool works in WSL with X11 forwarding:
1. Install X server on Windows (e.g., VcXsrv)
2. Set DISPLAY environment variable
3. Install zenity for better GUI experience

### Fallback Behavior
If GUI tools are unavailable, the server will:
1. Try whiptail (terminal-based GUI)
2. Log error and use default values
3. Continue execution without blocking

## Integration with Evolution System

The pause tool integrates with deliver-complete's evolution tracking:
- Decision patterns are analyzed
- Common choices become future defaults
- User preferences are learned over time
- Reduces repetitive questions

## Future Enhancements

Planned improvements for deliver-complete integration:
- Context-aware option generation
- Pattern-based default suggestions
- Integration with project health metrics
- Decision impact analysis