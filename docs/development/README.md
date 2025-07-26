# Claude Pause Development Documentation

## 🚀 Overview

This directory contains comprehensive development documentation for the Claude Pause project. Whether you're contributing to the project, extending its functionality, or troubleshooting issues, you'll find detailed guides here.

## 📚 Documentation Structure

### Core Architecture
- **[MCP Architecture Deep Dive](./MCP_ARCHITECTURE_DEEP_DIVE.md)** - Complete guide to the Model Context Protocol implementation
- **[Parent App Detailed](./PARENT_APP_DETAILED.md)** - Electron application architecture and implementation
- **[Dialog Lifecycle & State](./DIALOG_LIFECYCLE_STATE.md)** - How dialogs work from request to response

### Development Guides
- **[Development Workflow](./DEVELOPMENT_WORKFLOW.md)** - Setup, coding standards, and best practices
- **[Testing Strategies](./TESTING_STRATEGIES.md)** - Comprehensive testing guide with examples
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and their solutions

## 🎯 Quick Navigation

### For New Developers
1. Start with [Development Workflow](./DEVELOPMENT_WORKFLOW.md#environment-setup)
2. Read [Parent App Detailed](./PARENT_APP_DETAILED.md) to understand the architecture
3. Review [Dialog Lifecycle](./DIALOG_LIFECYCLE_STATE.md) for component flow

### For MCP Integration
1. Study [MCP Architecture](./MCP_ARCHITECTURE_DEEP_DIVE.md)
2. See [Tool Registration](./MCP_ARCHITECTURE_DEEP_DIVE.md#tool-registration)
3. Check [Message Flow](./MCP_ARCHITECTURE_DEEP_DIVE.md#message-flow)

### For Dialog Development
1. Read [Dialog Types Deep Dive](./DIALOG_LIFECYCLE_STATE.md#dialog-types-deep-dive)
2. Follow [Adding a New Dialog Type](./DEVELOPMENT_WORKFLOW.md#adding-a-new-dialog-type)
3. Test with [Dialog Testing Strategy](./TESTING_STRATEGIES.md#dialog-testing-strategy)

### For Debugging
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Use [Debugging Tools](./TROUBLESHOOTING.md#debugging-tools)
3. Review [Common Issues](./TROUBLESHOOTING.md#common-issues)

## 📖 Document Summaries

### [MCP Architecture Deep Dive](./MCP_ARCHITECTURE_DEEP_DIVE.md)
Covers the complete MCP (Model Context Protocol) implementation including:
- Server architecture and tool registration
- WebSocket communication protocols
- Message flow and state management
- Error handling and recovery strategies
- Performance optimization techniques
- Security best practices

**Key Sections:**
- Tool Registration
- Message Flow Diagrams
- WebSocket Manager Implementation
- Error Recovery Strategies
- Monitoring and Metrics

### [Parent App Detailed](./PARENT_APP_DETAILED.md)
Comprehensive documentation of the Electron application:
- Main and renderer process architecture
- Window management and IPC communication
- WebSocket server integration
- Build configuration and optimization
- Platform-specific considerations

**Key Sections:**
- Main Process Setup
- IPC Bridge Implementation
- WebSocket Server
- Build Configuration
- Performance Optimization

### [Dialog Lifecycle & State](./DIALOG_LIFECYCLE_STATE.md)
In-depth guide to dialog state management:
- Complete lifecycle from request to response
- React Context implementation
- State management patterns
- Response handling pipeline
- Error states and recovery

**Key Sections:**
- Dialog States and Transitions
- Context Provider Implementation
- Custom Hooks
- Response Pipeline
- Testing Dialog Flows

### [Development Workflow](./DEVELOPMENT_WORKFLOW.md)
Complete guide for development setup and practices:
- Environment setup and configuration
- Code standards and best practices
- Component development patterns
- Git workflow and commit conventions
- Build and deployment process

**Key Sections:**
- Environment Setup
- TypeScript Guidelines
- React Best Practices
- Component Templates
- CI/CD Pipeline

### [Testing Strategies](./TESTING_STRATEGIES.md)
Comprehensive testing documentation:
- Test architecture and organization
- Unit, integration, and E2E testing
- Visual regression testing
- Performance testing approaches
- Test utilities and best practices

**Key Sections:**
- Test Stack Configuration
- Component Testing Examples
- E2E Test Scenarios
- Mock Implementations
- Debugging Test Failures

### [Troubleshooting](./TROUBLESHOOTING.md)
Solutions for common development issues:
- Startup and connection problems
- Runtime errors and memory leaks
- Build and deployment issues
- Platform-specific problems
- Debugging techniques

**Key Sections:**
- Common Issues & Solutions
- Performance Debugging
- Platform-Specific Fixes
- Debugging Tools
- FAQ

## 🛠️ Key Technologies

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling

### Backend
- **Electron 34** - Desktop framework
- **Node.js** - Runtime
- **WebSocket** - Real-time communication

### Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **Storybook** - Component development

## 🔧 Common Tasks

### Add a New Dialog Type
1. Define the interface in `types/index.ts`
2. Create component in `components/dialogs/`
3. Register in `DialogWrapper.tsx`
4. Update WebSocket mapping
5. Add tests
See: [Dialog Development](./DEVELOPMENT_WORKFLOW.md#dialog-development)

### Debug WebSocket Issues
1. Enable debug logging: `DEBUG=ws:* npm run dev`
2. Check Chrome DevTools Network tab
3. Use wscat for testing
4. Review logs in main process
See: [WebSocket Debugging](./TROUBLESHOOTING.md#websocket-connection-failed)

### Run Tests
```bash
npm test              # All tests
npm test:unit        # Unit tests only
npm test:integration # Integration tests
npm test:e2e         # E2E tests
npm test:coverage    # With coverage
```
See: [Testing Workflow](./TESTING_STRATEGIES.md)

### Build for Production
```bash
npm run build        # Build all
npm run build:win    # Windows only
npm run build:mac    # macOS only
npm run build:linux  # Linux only
```
See: [Build Process](./DEVELOPMENT_WORKFLOW.md#build-process)

## 📊 Architecture Diagrams

### System Overview
```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Claude MCP    │ ←───────────────→ │  Electron Main  │
│     Server      │                    │     Process     │
└─────────────────┘                    └────────┬────────┘
                                                │ IPC
                                      ┌─────────▼────────┐
                                      │ React Renderer   │
                                      │   (Dialog UI)    │
                                      └──────────────────┘
```

### Dialog Flow
```
Request → WebSocket → IPC → React → User → Response → IPC → WebSocket → MCP
```

## 🤝 Contributing

1. **Setup**: Follow [Environment Setup](./DEVELOPMENT_WORKFLOW.md#environment-setup)
2. **Standards**: Review [Code Standards](./DEVELOPMENT_WORKFLOW.md#code-standards)
3. **Testing**: Write tests per [Testing Strategies](./TESTING_STRATEGIES.md)
4. **PR Process**: Follow [Git Workflow](./DEVELOPMENT_WORKFLOW.md#git-workflow)

## 📞 Getting Help

- **Issues**: Check [Troubleshooting](./TROUBLESHOOTING.md) first
- **Questions**: File a GitHub issue
- **Discussions**: Join our Discord
- **Emergency**: Check [FAQ](./TROUBLESHOOTING.md#faq)

## 🔗 Related Documentation

- **[Main Documentation](../README.md)** - Project overview
- **[Architecture](../ARCHITECTURE.md)** - High-level design
- **[Components](../COMPONENTS.md)** - Component reference
- **[Magic UI](../MAGIC_UI_DESIGN.md)** - Design system

---

*Last Updated: January 2025*

**Remember**: When in doubt, check the troubleshooting guide first! 🛠️