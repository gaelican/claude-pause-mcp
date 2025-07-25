# Example Usage Scenarios

## Scenario 1: File Deletion Confirmation

When Claude Code is asked to clean up a project:

```
User: "Clean up this project by removing unused files"

Claude: *Uses pause_for_input tool*
  decision_context: "I found 12 files that appear to be unused based on no imports or references. These include: 
    - src/old-utils.js
    - src/deprecated/
    - test/legacy-tests.js
    ... (9 more files)
  Should I proceed with deletion?"
  
  options: [
    "Delete all 12 files",
    "Show me the full list first",
    "Delete only obvious ones",
    "Cancel deletion"
  ]
  
User Input: "Show me the full list first"

Claude: *Shows full list and uses pause_for_input again for final confirmation*
```

## Scenario 2: Architecture Decision

When implementing a new feature:

```
User: "Add user authentication to this app"

Claude: *Uses pause_for_input tool*
  decision_context: "For implementing authentication, I need to choose an approach. The project uses Express.js. Which authentication strategy would you prefer?"
  
  options: [
    "JWT tokens with local storage",
    "Session-based with cookies",
    "OAuth integration (Google/GitHub)",
    "Basic auth for simplicity"
  ]
  
  default_action: "JWT tokens with local storage"
  
User Input: "OAuth integration"

Claude: *Proceeds with OAuth implementation*
```

## Scenario 3: Refactoring Scope

When asked to refactor code:

```
User: "Refactor this codebase to use modern JavaScript"

Claude: *Uses pause_for_input tool*
  decision_context: "I've identified several areas for modernization:
    - Convert var to let/const (87 instances)
    - Convert callbacks to async/await (23 functions)
    - Use arrow functions (45 candidates)
    - Add optional chaining (15 places)
    - Convert require to import (all files)
  
  This is a large change. How should I proceed?"
  
  options: [
    "Do all changes at once",
    "Start with let/const only",
    "Focus on async/await first",
    "Create separate commits for each type"
  ]
  
User Input: "Create separate commits for each type"

Claude: *Proceeds with incremental refactoring*
```

## Scenario 4: Ambiguous Requirements

When requirements are unclear:

```
User: "Make the UI look better"

Claude: *Uses pause_for_input tool*
  decision_context: "To improve the UI, I need more specific direction. What aspect would you like me to focus on?"
  
  options: [
    "Modern design with better spacing and typography",
    "Dark mode support",
    "Mobile responsiveness",
    "Color scheme and branding",
    "Animation and transitions"
  ]
  
User Input: "Modern design with better spacing and typography, and add dark mode"

Claude: *Proceeds with specific improvements*
```

## Integration Tips

1. **Configure in your project**: Add to `.mcp.json` in your project root
2. **Test the integration**: Ask Claude to "test the pause tool" to ensure it's working
3. **Set expectations**: Tell Claude when you want it to pause (e.g., "always ask before deleting files")
4. **Use with workflows**: Combine with other tools for complex operations