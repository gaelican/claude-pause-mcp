# Project Guidelines

This file contains project-specific instructions for Claude Code.

## MCP Usage

This project uses the Claude Pause MCP for interactive development decisions.

### Quick Reference
- When Claude needs input, a dialog window will appear
- Select thinking mode: [Q]uick, [N]ormal, [D]eep, or [U]ltra
- Use `Ctrl+Enter` to submit, `Escape` to cancel
- Enable planning mode with `P` for systematic development

For detailed instructions, see [MCP_GUIDE.md](./MCP_GUIDE.md).

## 🔄 Smart Workflow Integration

### Required Workflow Pattern

1. **Start with Planning**
   - Use the `planner` tool for any non-trivial task
   - The response will include workflow analysis instructions
   
2. **Analyze Each Step**
   - After receiving a plan, identify decision points
   - Use `should_ask_user` before implementing each major step
   
3. **Follow Tool Guidance**
   - Each tool response includes "Next Action" guidance
   - Follow the workflow adjustments based on choices made
   - Re-evaluate upcoming decisions when context changes

### Example Workflow

```
User: "Build a user authentication system"
 ↓
You: Use planner tool to create implementation plan
 ↓
Planner response: Includes workflow analysis prompt
 ↓
You: Analyze plan, identify "auth method" as first decision
 ↓
You: Use should_ask_user(type: "authentication", category: "architecture", importance: "critical")
 ↓
Result: Should ask = Yes
 ↓
You: Use single_choice for auth method selection
 ↓
Choice response: Includes workflow impact analysis
 ↓
You: Adjust plan based on choice, continue implementation
```

### Key Principles

- **Check Before Implementing**: Always use `should_ask_user` before major decisions
- **Follow the Chain**: Each tool response guides the next step
- **Adapt Dynamically**: Choices affect future decisions
- **Store Preferences**: User choices are remembered for consistency

## CRITICAL: Implementation Workflow

For ANY non-trivial task:
1. **Start with planner** - Creates plan and identifies decision points
2. **Follow workflow guidance** - Each response includes next steps
3. **Check before implementing** - Use `should_ask_user` for decisions
4. **Chain responses** - Let each tool guide the next action
5. **Remember preferences** - Reduces future interruptions

This ensures exact implementation while minimizing dialog fatigue.

## Operation Guidelines

- Never stop working unless specifically instructed. If your task is finished then run the planner tool again