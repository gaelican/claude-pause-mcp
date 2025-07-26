# Testing Strategies and Patterns

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Architecture](#test-architecture)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Visual Testing](#visual-testing)
7. [Performance Testing](#performance-testing)
8. [Test Best Practices](#test-best-practices)

## Testing Overview

### Testing Philosophy

```
┌─────────────────────────────────────────────────────────┐
│                    Testing Pyramid                        │
├─────────────────────────────────────────────────────────┤
│                    E2E Tests (10%)                        │
│                 ┌─────────────────┐                      │
│                 │  User Journeys   │                      │
│                 └─────────────────┘                      │
├─────────────────────────────────────────────────────────┤
│              Integration Tests (30%)                      │
│         ┌─────────────────────────────┐                 │
│         │  Component Interactions      │                 │
│         │  API Integration             │                 │
│         └─────────────────────────────┘                 │
├─────────────────────────────────────────────────────────┤
│                Unit Tests (60%)                           │
│   ┌─────────────────────────────────────────┐           │
│   │  Functions, Hooks, Components, Utils     │           │
│   └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Test Stack

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Jest | Test runner | `jest.config.js` |
| React Testing Library | Component testing | `setupTests.ts` |
| Playwright | E2E testing | `playwright.config.ts` |
| Storybook | Visual testing | `.storybook/` |
| MSW | API mocking | `src/mocks/` |

## Test Architecture

### Directory Structure

```
claude-pause-parent/
├── __tests__/              # Global test utilities
│   ├── fixtures/           # Test data
│   ├── mocks/             # Mock implementations
│   └── utils/             # Test helpers
├── src/
│   ├── renderer/
│   │   ├── components/
│   │   │   └── MyComponent/
│   │   │       ├── MyComponent.tsx
│   │   │       ├── MyComponent.test.tsx
│   │   │       └── MyComponent.stories.tsx
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── validation.test.ts
│   └── main/
│       ├── handlers.js
│       └── handlers.test.js
├── e2e/                   # E2E tests
│   ├── dialogs.spec.ts
│   └── user-flows.spec.ts
└── jest.config.js         # Jest configuration
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/renderer/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/main/preload.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  }
};
```

### Setup Files

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock Electron API
global.electronAPI = {
  sendDialogResponse: jest.fn(),
  onDialogRequest: jest.fn(),
  minimizeWindow: jest.fn(),
  maximizeWindow: jest.fn(),
  closeWindow: jest.fn(),
  getSettings: jest.fn(),
  saveSettings: jest.fn(),
  platform: 'win32',
  arch: 'x64',
  versions: {
    node: '18.0.0',
    chrome: '110.0.0',
    electron: '28.0.0'
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Performance API mock
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => [])
};
```

## Unit Testing

### Component Testing

```typescript
// DialogComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogComponent } from './DialogComponent';
import { DialogProvider } from '@/context/DialogContext';

// Test wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <DialogProvider>
      {ui}
    </DialogProvider>
  );
};

describe('DialogComponent', () => {
  const defaultProps = {
    requestId: 'test-123',
    parameters: {
      question: 'Test question?',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ]
    }
  };

  describe('Rendering', () => {
    it('renders question text', () => {
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      expect(screen.getByText('Test question?')).toBeInTheDocument();
    });

    it('renders all options', () => {
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('applies correct CSS classes', () => {
      const { container } = renderWithProviders(
        <DialogComponent {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('dialog-component');
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('selects option on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      const yesButton = screen.getByText('Yes');
      await user.click(yesButton);
      
      expect(yesButton.parentElement).toHaveClass('selected');
    });

    it('submits response with selected option', async () => {
      const mockSendResponse = jest.fn();
      jest.spyOn(electronAPI, 'sendDialogResponse')
        .mockImplementation(mockSendResponse);
      
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      // Select option
      await user.click(screen.getByText('Yes'));
      
      // Submit
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(mockSendResponse).toHaveBeenCalledWith({
          requestId: 'test-123',
          data: {
            choice: 'yes',
            timestamp: expect.any(String)
          }
        });
      });
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      // Tab to first option
      await user.tab();
      expect(screen.getByText('Yes').parentElement).toHaveFocus();
      
      // Arrow down to next option
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('No').parentElement).toHaveFocus();
      
      // Enter to select
      await user.keyboard('{Enter}');
      expect(screen.getByText('No').parentElement).toHaveClass('selected');
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      jest.spyOn(electronAPI, 'sendDialogResponse')
        .mockRejectedValueOnce(new Error('Network error'));
      
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      await user.click(screen.getByText('Yes'));
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      jest.spyOn(electronAPI, 'sendDialogResponse')
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(resolve, 1000)
        ));
      
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      await user.click(screen.getByText('Yes'));
      const submitButton = screen.getByText('Submit');
      
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'dialog-title'
      );
      
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Options'
      );
    });

    it('manages focus correctly', async () => {
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      // First focusable element should receive focus
      await waitFor(() => {
        expect(screen.getByText('Yes').parentElement).toHaveFocus();
      });
    });

    it('traps focus within dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DialogComponent {...defaultProps} />);
      
      // Tab through all elements
      await user.tab(); // Yes option
      await user.tab(); // No option
      await user.tab(); // Submit button
      await user.tab(); // Cancel button
      await user.tab(); // Should wrap to Yes option
      
      expect(screen.getByText('Yes').parentElement).toHaveFocus();
    });
  });
});
```

### Hook Testing

```typescript
// useDialogState.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDialogState } from './useDialogState';

describe('useDialogState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useDialogState());
    
    expect(result.current.state).toEqual({
      selectedOption: null,
      isSubmitting: false,
      error: null
    });
  });

  it('updates selected option', () => {
    const { result } = renderHook(() => useDialogState());
    
    act(() => {
      result.current.actions.selectOption('option1');
    });
    
    expect(result.current.state.selectedOption).toBe('option1');
  });

  it('handles submission flow', async () => {
    const { result } = renderHook(() => useDialogState());
    
    act(() => {
      result.current.actions.selectOption('option1');
    });
    
    const submitPromise = act(async () => {
      await result.current.actions.submit();
    });
    
    // Check submitting state
    expect(result.current.state.isSubmitting).toBe(true);
    
    await submitPromise;
    
    // Check completed state
    expect(result.current.state.isSubmitting).toBe(false);
  });

  it('validates before submission', async () => {
    const { result } = renderHook(() => useDialogState({
      validate: (state) => {
        if (!state.selectedOption) {
          return 'Please select an option';
        }
        return null;
      }
    }));
    
    // Try to submit without selection
    await act(async () => {
      await result.current.actions.submit();
    });
    
    expect(result.current.state.error).toBe('Please select an option');
    expect(result.current.state.isSubmitting).toBe(false);
  });
});
```

### Utility Function Testing

```typescript
// validation.test.ts
import {
  validateEmail,
  validateRequired,
  validateLength,
  composeValidators
} from './validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('user@example.com')).toBeNull();
      expect(validateEmail('test.user+tag@subdomain.example.com')).toBeNull();
    });

    it('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe('Invalid email address');
      expect(validateEmail('user@')).toBe('Invalid email address');
      expect(validateEmail('@example.com')).toBe('Invalid email address');
    });

    it('handles empty value', () => {
      expect(validateEmail('')).toBe('Invalid email address');
      expect(validateEmail(null as any)).toBe('Invalid email address');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('value')).toBeNull();
      expect(validateRequired(123)).toBeNull();
      expect(validateRequired(['item'])).toBeNull();
    });

    it('rejects empty values', () => {
      expect(validateRequired('')).toBe('This field is required');
      expect(validateRequired(null)).toBe('This field is required');
      expect(validateRequired(undefined)).toBe('This field is required');
      expect(validateRequired([])).toBe('This field is required');
    });
  });

  describe('validateLength', () => {
    it('validates length within range', () => {
      const validator = validateLength(5, 10);
      
      expect(validator('hello')).toBeNull();
      expect(validator('hello world')).toBeNull();
    });

    it('rejects length outside range', () => {
      const validator = validateLength(5, 10);
      
      expect(validator('hi')).toBe('Must be between 5 and 10 characters');
      expect(validator('this is too long')).toBe('Must be between 5 and 10 characters');
    });
  });

  describe('composeValidators', () => {
    it('runs multiple validators', () => {
      const validator = composeValidators(
        validateRequired,
        validateLength(5, 10)
      );
      
      expect(validator('')).toBe('This field is required');
      expect(validator('hi')).toBe('Must be between 5 and 10 characters');
      expect(validator('hello')).toBeNull();
    });

    it('returns first error', () => {
      const validator = composeValidators(
        () => 'Error 1',
        () => 'Error 2'
      );
      
      expect(validator('any value')).toBe('Error 1');
    });
  });
});
```

## Integration Testing

### Component Integration

```typescript
// DialogFlow.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Dialog Flow Integration', () => {
  it('completes full dialog flow', async () => {
    const user = userEvent.setup();
    
    // Mock dialog request
    const mockDialogRequest = {
      requestId: 'integration-test-1',
      dialogType: 'single_choice',
      parameters: {
        question: 'Choose your option',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' }
        ]
      }
    };
    
    // Render app
    render(<App />);
    
    // Simulate incoming dialog request
    act(() => {
      window.dispatchEvent(new CustomEvent('dialog-request', {
        detail: mockDialogRequest
      }));
    });
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Choose your option')).toBeInTheDocument();
    });
    
    // Interact with dialog
    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByText('Submit'));
    
    // Verify response sent
    await waitFor(() => {
      expect(electronAPI.sendDialogResponse).toHaveBeenCalledWith({
        requestId: 'integration-test-1',
        data: {
          choice: 'a',
          timestamp: expect.any(String)
        }
      });
    });
    
    // Verify dialog removed
    await waitFor(() => {
      expect(screen.queryByText('Choose your option')).not.toBeInTheDocument();
    });
    
    // Verify history updated
    await user.click(screen.getByText('History'));
    expect(screen.getByText('Single Choice Dialog')).toBeInTheDocument();
  });

  it('handles WebSocket reconnection', async () => {
    render(<App />);
    
    // Verify initial connection
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
    
    // Simulate disconnection
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
    
    // Simulate reconnection
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('handles concurrent dialogs', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Send multiple dialog requests
    const dialogs = [
      {
        requestId: 'concurrent-1',
        dialogType: 'text_input',
        parameters: { question: 'Question 1' }
      },
      {
        requestId: 'concurrent-2',
        dialogType: 'text_input',
        parameters: { question: 'Question 2' }
      },
      {
        requestId: 'concurrent-3',
        dialogType: 'text_input',
        parameters: { question: 'Question 3' }
      }
    ];
    
    dialogs.forEach(dialog => {
      act(() => {
        window.dispatchEvent(new CustomEvent('dialog-request', {
          detail: dialog
        }));
      });
    });
    
    // Verify all dialogs are displayed
    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });
    
    // Respond to middle dialog
    const input2 = screen.getByLabelText('Question 2');
    await user.type(input2, 'Answer 2');
    
    const submit2 = screen.getByTestId('submit-concurrent-2');
    await user.click(submit2);
    
    // Verify only that dialog is removed
    await waitFor(() => {
      expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });
  });
});
```

### API Integration Testing

```typescript
// api.integration.test.ts
import { WebSocketManager } from '@/utils/websocket';
import { MockWebSocket } from '@/__tests__/mocks/MockWebSocket';

// Replace WebSocket with mock
global.WebSocket = MockWebSocket as any;

describe('WebSocket Integration', () => {
  let wsManager: WebSocketManager;
  
  beforeEach(() => {
    wsManager = new WebSocketManager();
  });
  
  afterEach(() => {
    wsManager.disconnect();
  });
  
  it('establishes connection', async () => {
    const onConnect = jest.fn();
    wsManager.on('connect', onConnect);
    
    await wsManager.connect();
    
    expect(onConnect).toHaveBeenCalled();
    expect(wsManager.isConnected()).toBe(true);
  });
  
  it('handles message exchange', async () => {
    const onMessage = jest.fn();
    wsManager.on('message', onMessage);
    
    await wsManager.connect();
    
    // Send message
    wsManager.send({
      type: 'ping',
      timestamp: Date.now()
    });
    
    // Wait for echo response
    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith({
        type: 'ping',
        timestamp: expect.any(Number)
      });
    });
  });
  
  it('reconnects on disconnection', async () => {
    const onReconnect = jest.fn();
    wsManager.on('reconnect', onReconnect);
    
    await wsManager.connect();
    
    // Force disconnection
    wsManager.ws?.close();
    
    // Wait for reconnection
    await waitFor(() => {
      expect(onReconnect).toHaveBeenCalled();
      expect(wsManager.isConnected()).toBe(true);
    }, { timeout: 5000 });
  });
  
  it('queues messages during disconnection', async () => {
    await wsManager.connect();
    const ws = wsManager.ws;
    
    // Spy on send
    const sendSpy = jest.spyOn(ws!, 'send');
    
    // Disconnect
    ws?.close();
    
    // Send messages while disconnected
    wsManager.send({ type: 'message1' });
    wsManager.send({ type: 'message2' });
    wsManager.send({ type: 'message3' });
    
    // Messages should not be sent yet
    expect(sendSpy).not.toHaveBeenCalled();
    
    // Wait for reconnection
    await waitFor(() => wsManager.isConnected());
    
    // Verify queued messages sent
    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });
  });
});
```

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev:test',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/dialog-flows.spec.ts
import { test, expect, Page } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: ['.'],
    env: {
      NODE_ENV: 'test',
      ELECTRON_IS_DEV: '0'
    }
  });
  
  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Dialog E2E Tests', () => {
  test('planner dialog complete flow', async () => {
    // Trigger dialog
    await page.evaluate(() => {
      window.electronAPI.onDialogRequest({
        requestId: 'e2e-planner-1',
        dialogType: 'planner',
        parameters: {
          decision_context: 'Which implementation approach?',
          plan: 'We need to implement a new feature',
          visual_output: '## Options\n- Approach A: Fast\n- Approach B: Thorough',
          options: [
            { label: 'Approach A', value: 'a', description: 'Quick implementation' },
            { label: 'Approach B', value: 'b', description: 'Comprehensive solution' }
          ]
        }
      });
    });
    
    // Wait for dialog
    await expect(page.locator('.planner-dialog-magic')).toBeVisible();
    
    // Verify content
    await expect(page.locator('.planner-plan-magic')).toContainText(
      'We need to implement a new feature'
    );
    
    // Select thinking mode
    await page.click('[data-thinking-mode="deep"]');
    await expect(page.locator('.mode-btn-magic.active')).toHaveAttribute(
      'data-thinking-mode', 
      'deep'
    );
    
    // Select option
    await page.click('[data-option-value="b"]');
    await expect(page.locator('.planner-option-magic.selected')).toContainText(
      'Approach B'
    );
    
    // Add additional context
    await page.fill('.planner-textarea', 'I prefer thorough solutions for maintainability');
    
    // Submit
    await page.click('button:has-text("Submit")');
    
    // Verify dialog closed
    await expect(page.locator('.planner-dialog-magic')).not.toBeVisible();
    
    // Check response
    const response = await page.evaluate(() => window.lastDialogResponse);
    expect(response).toMatchObject({
      choice: 'b',
      thinkingMode: 'deep',
      additionalContext: 'I prefer thorough solutions for maintainability'
    });
  });
  
  test('screenshot dialog with image upload', async () => {
    // Trigger screenshot dialog
    await page.evaluate(() => {
      window.electronAPI.onDialogRequest({
        requestId: 'e2e-screenshot-1',
        dialogType: 'screenshot_request',
        parameters: {
          question: 'Please share a screenshot of the error',
          description: 'This will help us debug the issue'
        }
      });
    });
    
    // Wait for dialog
    await expect(page.locator('.screenshot-dialog-magic')).toBeVisible();
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/test-screenshot.png');
    
    // Verify preview
    await expect(page.locator('.image-preview')).toBeVisible();
    
    // Add notes
    await page.fill('.screenshot-notes', 'Error appears after clicking submit');
    
    // Submit
    await page.click('button:has-text("Send Screenshot")');
    
    // Verify response includes image
    const response = await page.evaluate(() => window.lastDialogResponse);
    expect(response.images).toHaveLength(1);
    expect(response.images[0]).toMatchObject({
      name: 'test-screenshot.png',
      type: 'image/png',
      data: expect.stringMatching(/^data:image\/png;base64,/)
    });
  });
  
  test('handles dialog timeout', async () => {
    // Set short timeout
    await page.evaluate(() => {
      window.DIALOG_TIMEOUT = 5000; // 5 seconds
    });
    
    // Trigger dialog
    await page.evaluate(() => {
      window.electronAPI.onDialogRequest({
        requestId: 'e2e-timeout-1',
        dialogType: 'text_input',
        parameters: {
          question: 'This will timeout'
        }
      });
    });
    
    // Wait for dialog
    await expect(page.locator('.text-input-dialog')).toBeVisible();
    
    // Wait for timeout
    await page.waitForTimeout(6000);
    
    // Verify timeout message
    await expect(page.locator('.dialog-timeout-message')).toBeVisible();
    await expect(page.locator('.dialog-timeout-message')).toContainText(
      'Dialog timed out'
    );
    
    // Verify error response sent
    const response = await page.evaluate(() => window.lastDialogResponse);
    expect(response).toMatchObject({
      error: true,
      errorType: 'timeout',
      errorMessage: 'User did not respond in time'
    });
  });
});
```

### Visual Regression Testing

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('dialog components visual test', async ({ page }) => {
    // Navigate to Storybook
    await page.goto('http://localhost:6006');
    
    // Test each dialog type
    const dialogTypes = [
      'planner-dialog',
      'text-input-dialog',
      'single-choice-dialog',
      'multi-choice-dialog',
      'screenshot-dialog',
      'confirm-dialog'
    ];
    
    for (const dialogType of dialogTypes) {
      await page.click(`[data-story-id="${dialogType}"]`);
      await page.waitForTimeout(1000); // Wait for animations
      
      // Take screenshot
      await expect(page.locator('#storybook-preview-iframe')).toHaveScreenshot(
        `${dialogType}.png`,
        {
          maxDiffPixels: 100,
          threshold: 0.2
        }
      );
    }
  });
  
  test('dark theme consistency', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('app-dark-theme.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Open different tabs
    const tabs = ['Active Dialogs', 'History', 'Settings'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(500);
      
      await expect(page.locator('.tab-content')).toHaveScreenshot(
        `tab-${tab.toLowerCase().replace(' ', '-')}.png`
      );
    }
  });
});
```

## Visual Testing

### Storybook Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  features: {
    storyStoreV7: true
  }
};

export default config;
```

### Story Examples

```typescript
// DialogComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { DialogComponent } from './DialogComponent';
import { DialogProvider } from '@/context/DialogContext';

const meta: Meta<typeof DialogComponent> = {
  title: 'Dialogs/DialogComponent',
  component: DialogComponent,
  decorators: [
    (Story) => (
      <DialogProvider>
        <div style={{ padding: '2rem', background: '#0f172a', minHeight: '100vh' }}>
          <Story />
        </div>
      </DialogProvider>
    )
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    requestId: 'story-1',
    parameters: {
      question: 'Which option do you prefer?',
      options: [
        { label: 'Option A', value: 'a', description: 'The first choice' },
        { label: 'Option B', value: 'b', description: 'The second choice' }
      ]
    }
  }
};

export const WithManyOptions: Story = {
  args: {
    requestId: 'story-2',
    parameters: {
      question: 'Select your favorite programming language',
      options: [
        { label: 'JavaScript', value: 'js' },
        { label: 'TypeScript', value: 'ts' },
        { label: 'Python', value: 'py' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'Ruby', value: 'ruby' }
      ]
    }
  }
};

export const Interactive: Story = {
  args: Default.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Select first option', async () => {
      await userEvent.click(canvas.getByText('Option A'));
      await expect(canvas.getByText('Option A').parentElement).toHaveClass('selected');
    });
    
    await step('Change selection', async () => {
      await userEvent.click(canvas.getByText('Option B'));
      await expect(canvas.getByText('Option B').parentElement).toHaveClass('selected');
      await expect(canvas.getByText('Option A').parentElement).not.toHaveClass('selected');
    });
    
    await step('Submit dialog', async () => {
      await userEvent.click(canvas.getByText('Submit'));
      // In real app, dialog would close
    });
  }
};

export const ErrorState: Story = {
  args: {
    requestId: 'story-error',
    parameters: {
      question: 'This will show an error',
      options: []
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try to submit without selection
    await userEvent.click(canvas.getByText('Submit'));
    
    // Error should appear
    await expect(canvas.getByText(/please select an option/i)).toBeInTheDocument();
  }
};
```

## Performance Testing

### Performance Test Setup

```typescript
// performance/dialog-performance.test.ts
import { performance, PerformanceObserver } from 'perf_hooks';
import { render, cleanup } from '@testing-library/react';
import { DialogComponent } from '@/components/DialogComponent';

describe('Performance Tests', () => {
  let performanceEntries: PerformanceEntry[] = [];
  
  beforeAll(() => {
    const obs = new PerformanceObserver((items) => {
      performanceEntries.push(...items.getEntries());
    });
    
    obs.observe({ entryTypes: ['measure'] });
  });
  
  afterEach(() => {
    cleanup();
    performanceEntries = [];
  });
  
  test('dialog renders within performance budget', () => {
    const startMark = 'dialog-render-start';
    const endMark = 'dialog-render-end';
    
    performance.mark(startMark);
    
    render(<DialogComponent {...defaultProps} />);
    
    performance.mark(endMark);
    performance.measure('dialog-render', startMark, endMark);
    
    const renderMeasure = performanceEntries.find(
      entry => entry.name === 'dialog-render'
    );
    
    expect(renderMeasure?.duration).toBeLessThan(16); // 60fps = 16ms per frame
  });
  
  test('handles large option lists efficiently', () => {
    const largeOptions = Array.from({ length: 1000 }, (_, i) => ({
      label: `Option ${i}`,
      value: `option-${i}`,
      description: `Description for option ${i}`
    }));
    
    const props = {
      ...defaultProps,
      parameters: {
        ...defaultProps.parameters,
        options: largeOptions
      }
    };
    
    performance.mark('large-list-start');
    
    const { container } = render(<DialogComponent {...props} />);
    
    performance.mark('large-list-end');
    performance.measure('large-list-render', 'large-list-start', 'large-list-end');
    
    const measure = performanceEntries.find(
      entry => entry.name === 'large-list-render'
    );
    
    // Should use virtualization for large lists
    expect(measure?.duration).toBeLessThan(100);
    
    // Check that not all options are rendered
    const renderedOptions = container.querySelectorAll('.option-item');
    expect(renderedOptions.length).toBeLessThan(50); // Virtualized
  });
});
```

### Memory Leak Testing

```typescript
// performance/memory-leak.test.ts
describe('Memory Leak Tests', () => {
  test('dialog cleanup prevents memory leaks', async () => {
    const iterations = 100;
    const measurements: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Render and unmount dialog
      const { unmount } = render(<DialogComponent {...defaultProps} />);
      
      // Simulate user interactions
      fireEvent.click(screen.getByText('Option 1'));
      
      // Unmount
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Measure memory
      if (performance.memory) {
        measurements.push(performance.memory.usedJSHeapSize);
      }
    }
    
    // Check that memory usage is stable
    const firstQuarter = measurements.slice(0, 25);
    const lastQuarter = measurements.slice(75);
    
    const avgFirst = firstQuarter.reduce((a, b) => a + b) / firstQuarter.length;
    const avgLast = lastQuarter.reduce((a, b) => a + b) / lastQuarter.length;
    
    // Memory should not grow significantly
    const growthRate = (avgLast - avgFirst) / avgFirst;
    expect(growthRate).toBeLessThan(0.1); // Less than 10% growth
  });
});
```

## Test Best Practices

### Test Organization

```typescript
// Group related tests
describe('DialogComponent', () => {
  describe('Rendering', () => {
    test('renders with required props', () => {});
    test('renders with optional props', () => {});
  });
  
  describe('User Interactions', () => {
    test('handles click events', () => {});
    test('handles keyboard navigation', () => {});
  });
  
  describe('Error Handling', () => {
    test('displays validation errors', () => {});
    test('handles network errors', () => {});
  });
  
  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {});
    test('supports keyboard navigation', () => {});
  });
});
```

### Test Data Builders

```typescript
// testBuilders.ts
export class DialogBuilder {
  private dialog: Partial<Dialog> = {
    requestId: 'test-' + Math.random(),
    type: 'single_choice',
    state: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  withId(id: string): this {
    this.dialog.requestId = id;
    return this;
  }
  
  withType(type: DialogType): this {
    this.dialog.type = type;
    return this;
  }
  
  withParameters(params: any): this {
    this.dialog.parameters = params;
    return this;
  }
  
  build(): Dialog {
    return this.dialog as Dialog;
  }
}

// Usage
const dialog = new DialogBuilder()
  .withType('planner')
  .withParameters({ question: 'Test?' })
  .build();
```

### Custom Matchers

```typescript
// customMatchers.ts
expect.extend({
  toBeValidDialog(received: any) {
    const pass = Boolean(
      received &&
      typeof received === 'object' &&
      received.requestId &&
      received.type &&
      received.parameters
    );
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid dialog`
        : `expected ${received} to be a valid dialog`
    };
  },
  
  toHaveDialogState(received: Dialog, expectedState: string) {
    const pass = received.state === expectedState;
    
    return {
      pass,
      message: () => pass
        ? `expected dialog not to have state ${expectedState}`
        : `expected dialog to have state ${expectedState}, but got ${received.state}`
    };
  }
});

// Usage
expect(dialog).toBeValidDialog();
expect(dialog).toHaveDialogState('active');
```

### Test Utilities

```typescript
// testUtils.ts
export const waitForDialog = async (requestId: string) => {
  await waitFor(() => {
    const dialog = screen.getByTestId(`dialog-${requestId}`);
    expect(dialog).toBeInTheDocument();
  });
};

export const submitDialog = async (requestId: string) => {
  const submitButton = screen.getByTestId(`submit-${requestId}`);
  await userEvent.click(submitButton);
};

export const fillTextInput = async (label: string, value: string) => {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
};

export const selectOption = async (optionText: string) => {
  const option = screen.getByText(optionText);
  await userEvent.click(option);
};
```

### Debugging Test Failures

```typescript
// Debug utilities
export const debugDialog = (dialog: HTMLElement) => {
  console.log('Dialog HTML:', dialog.innerHTML);
  console.log('Dialog text content:', dialog.textContent);
  console.log('Dialog classes:', dialog.className);
  
  // Log all interactive elements
  const buttons = dialog.querySelectorAll('button');
  console.log('Buttons:', Array.from(buttons).map(b => b.textContent));
  
  const inputs = dialog.querySelectorAll('input, textarea');
  console.log('Inputs:', Array.from(inputs).map(i => ({
    type: i.getAttribute('type'),
    value: (i as HTMLInputElement).value
  })));
};

// Use in tests
test('debug failing test', async () => {
  render(<DialogComponent {...props} />);
  
  const dialog = screen.getByRole('dialog');
  debugDialog(dialog);
  
  // Also use screen.debug()
  screen.debug(dialog, 20000); // Increase character limit
});
```