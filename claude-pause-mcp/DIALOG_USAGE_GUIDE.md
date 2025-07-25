# Dialog Tool Usage Guidelines

## 🎯 Core Principle
Use dialog tools to ensure features are implemented exactly as the user wants, while avoiding unnecessary interruptions for obvious decisions.

## 📊 Decision Framework

### 🔴 MUST ASK (Always use dialog tools)

1. **First Implementation of Major Features**
   - New authentication system
   - Database schema design
   - API structure decisions
   - UI component architecture

2. **Multiple Valid Approaches**
   - Choosing between REST vs GraphQL
   - State management solutions
   - Testing frameworks
   - Build tool configuration

3. **Breaking Changes**
   - Modifying existing APIs
   - Database migrations
   - Removing features
   - Changing core dependencies

4. **Security-Sensitive Code**
   - Authentication methods
   - Authorization logic
   - Data encryption approaches
   - API key management

5. **User Explicitly Requests**
   - "Ask me about..."
   - "I want to decide..."
   - "Let me choose..."

### 🟡 SHOULD ASK (Use judgment)

1. **UI/UX Decisions (when no pattern exists)**
   - Layout structure
   - Color schemes
   - Component organization
   - Navigation patterns

2. **Performance Optimizations**
   - Caching strategies
   - Database indexing
   - Bundle optimization
   - Lazy loading approaches

3. **Error Handling (first occurrence)**
   - Global vs local handling
   - Error message format
   - Retry strategies
   - Logging approaches

4. **Third-party Integrations**
   - Library selection
   - API service choices
   - Payment processors
   - Analytics tools

### 🟢 JUST DO IT (Don't ask)

1. **Following Established Patterns**
   - Existing code style
   - Current component structure
   - Established naming conventions
   - Project's testing patterns

2. **Standard Implementations**
   - Basic CRUD operations
   - Form validation
   - Data formatting
   - Common utilities

3. **Obvious Bug Fixes**
   - Typos
   - Syntax errors
   - Clear logic errors
   - Missing imports

4. **Refactoring for Quality**
   - Code formatting
   - Extract methods
   - Remove duplication
   - Add type annotations

## 🛠️ Tool-Specific Guidelines

### text_input
**When to use:**
- Need detailed specifications
- Complex requirements clarification
- Custom implementation details
- Multi-line responses needed

**Example scenarios:**
- "Describe the API endpoints you need"
- "Explain the validation rules"
- "What error messages should appear?"

### single_choice
**When to use:**
- 2-5 mutually exclusive options
- Clear alternatives exist
- Decision impacts architecture
- User preference matters

**Example scenarios:**
- "Database: PostgreSQL, MySQL, or MongoDB?"
- "Style approach: CSS Modules, Styled Components, or Tailwind?"
- "Testing: Jest, Vitest, or Mocha?"

### multi_choice
**When to use:**
- Multiple features to include/exclude
- Configuration options
- Feature flags
- Optional enhancements

**Example scenarios:**
- "Which validations to include?"
- "Select features for the dashboard"
- "Choose middleware to enable"

### confirm
**When to use:**
- Destructive operations
- Major changes
- Before deployment
- Risky modifications

**Example scenarios:**
- "Delete all user data?"
- "Deploy to production?"
- "Overwrite existing configuration?"

### screenshot_request
**When to use:**
- UI/UX feedback needed
- Visual bug reports
- Design verification
- Layout issues

**Example scenarios:**
- "Show me the current layout"
- "Screenshot the error"
- "How should this look?"

## 📈 Progressive Disclosure

Start high-level, get specific only when needed:

```
"Implement user authentication"
└─ Ask: "Which auth method?" (JWT/Session/OAuth)
   └─ If JWT → Proceed with standard implementation
   └─ If OAuth → Ask: "Which provider?" (Google/GitHub/etc)
```

## 🔍 Context Checking

Before asking, check:

1. **Does a pattern exist?**
   ```javascript
   // Check for existing examples
   if (findSimilarImplementation()) {
     // Follow existing pattern
   } else {
     // Ask user preference
   }
   ```

2. **Is it a standard solution?**
   - Common CRUD operations → Don't ask
   - Custom business logic → Ask for details

3. **User's recent choices**
   - Similar decision made recently → Apply same choice
   - New type of decision → Ask user

## 💡 Smart Defaults

When NOT asking, use:
1. **Project conventions** (check existing code)
2. **Industry best practices**
3. **Most secure option**
4. **Most performant option**

## 🎮 User Control

Users can adjust dialog frequency:

### In Conversation:
- "Be more autonomous" → Reduce dialogs
- "Ask me about everything" → Increase dialogs
- "Just follow the patterns" → Minimal dialogs

### In Dialogs:
- ☑️ "Apply to all similar decisions"
- ☑️ "Remember this choice"
- ☑️ "Don't ask again for this project"

## 📝 Decision Record

When you DO ask, always explain why:
- "❓ Asking because: No existing auth pattern found"
- "❓ Asking because: Multiple valid approaches exist"
- "❓ Asking because: This is a breaking change"

## 🚫 Anti-patterns

DON'T ask about:
- Variable names (unless critical)
- Formatting (use project style)
- Import order
- Comment style
- Obvious implementations

## 🎯 Goal

The perfect balance:
- User gets exactly what they want
- Minimal interruption for routine tasks
- Clear communication about decisions
- Learned preferences reduce future dialogs