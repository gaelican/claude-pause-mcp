// Dialog Types
export type DialogType = 'planner' | 'text_input' | 'single_choice' | 'multi_choice' | 'screenshot_request' | 'confirm';

export interface BaseDialogData {
  requestId: string;
  dialogType: DialogType;
  timestamp: string;
}

export interface PlannerParameters {
  decision_context: string;
  visual_output?: string;
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  default_action?: string;
}

export interface TextInputParameters {
  question: string;
  placeholder?: string;
  defaultText?: string;
  maxLength?: number;
  required?: boolean;
  expectsCode?: boolean;
}

export interface SingleChoiceParameters {
  question: string;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
  }>;
  defaultValue?: string;
}

export interface MultiChoiceParameters {
  question: string;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
    group?: string;
    tags?: string[];
  }>;
  minSelections?: number;
  maxSelections?: number;
  allowEmpty?: boolean;
}

export interface ScreenshotParameters {
  question: string;
  description?: string;
}

export interface ConfirmParameters {
  question: string;
  description?: string;
  warning?: string;
  isDangerous?: boolean;
  yesLabel?: string;
  noLabel?: string;
  defaultToNo?: boolean;
}

export type DialogParameters = 
  | PlannerParameters 
  | TextInputParameters 
  | SingleChoiceParameters 
  | MultiChoiceParameters 
  | ScreenshotParameters 
  | ConfirmParameters;

export interface Dialog extends BaseDialogData {
  parameters: DialogParameters;
}

// Response Types
export interface DialogResponse {
  cancelled?: boolean;
  switchToText?: boolean;
  timestamp: string;
}

export interface PlannerResponse extends DialogResponse {
  choice?: string | null;
  thinkingMode?: string;
  additionalContext?: string;
  attachments?: Array<{
    data: string;
    type: string;
    name: string;
  }>;
}

export interface TextInputResponse extends DialogResponse {
  text?: string;
}

export interface SingleChoiceResponse extends DialogResponse {
  choice?: string;
}

export interface MultiChoiceResponse extends DialogResponse {
  choices?: string[];
}

export interface ScreenshotResponse extends DialogResponse {
  images?: Array<{
    data: string;
    type: string;
    name: string;
  }>;
}

export interface ConfirmResponse extends DialogResponse {
  confirmed?: boolean;
}

// History Types
export interface DialogHistoryItem {
  requestId: string;
  type: DialogType;
  parameters: DialogParameters;
  response: DialogResponse;
  timestamp: string;
}

// Settings Types
export interface Settings {
  theme: 'light' | 'dark';
  dialogFrequency: 'minimal' | 'low' | 'normal' | 'high';
  autoFocus: boolean;
  soundNotifications: boolean;
  minimizeOnResponse: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Electron API Types
export interface ElectronAPI {
  onDialogRequest: (callback: (data: Dialog) => void) => void;
  sendDialogResponse: (response: { requestId: string; data: DialogResponse }) => Promise<void>;
  onOpenSettings: (callback: () => void) => void;
  onMCPMessage: (callback: (data: WebSocketMessage) => void) => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  preferences: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
  };
}