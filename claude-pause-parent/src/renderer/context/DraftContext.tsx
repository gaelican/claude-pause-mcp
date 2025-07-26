import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogResponse, DialogType } from '../types';

// TypeScript interfaces for draft storage
export interface DraftData {
  // Dialog identification
  requestId: string;
  dialogType: DialogType;
  originalParameters: any;
  
  // Draft content
  formData: DraftFormData;
  
  // Metadata
  createdAt: string;
  lastSavedAt: string;
  autoSaveCount: number;
  isManualSave: boolean;
  
  // Recovery information
  sessionId: string;
  wasRecovered: boolean;
}

export interface DraftFormData {
  // Common fields
  textInput?: string;
  selectedOption?: string | null;
  selectedOptions?: string[];
  thinkingMode?: string;
  
  // Dialog-specific fields
  attachments?: Array<{
    data: string;
    type: string;
    name: string;
  }>;
  
  // Form state
  isDirty: boolean;
  lastInteractionAt: string;
}

export interface DraftSaveStatus {
  isSaving: boolean;
  lastSaveTime: string | null;
  saveError: string | null;
  pendingChanges: boolean;
}

export interface DraftRecoveryInfo {
  availableDrafts: DraftData[];
  lastCrashTime: string | null;
}

interface DraftContextType {
  // Draft management
  drafts: Map<string, DraftData>;
  getDraft: (requestId: string) => DraftData | undefined;
  saveDraft: (requestId: string, formData: Partial<DraftFormData>, isManual?: boolean) => void;
  deleteDraft: (requestId: string) => void;
  
  // Save status
  saveStatus: Map<string, DraftSaveStatus>;
  getSaveStatus: (requestId: string) => DraftSaveStatus;
  
  // Recovery
  recoveryInfo: DraftRecoveryInfo;
  recoverDraft: (draft: DraftData) => void;
  dismissRecovery: () => void;
  
  // Settings
  autoSaveInterval: number;
  setAutoSaveInterval: (interval: number) => void;
  maxDraftAge: number;
  setMaxDraftAge: (age: number) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

// Constants
const STORAGE_KEY_PREFIX = 'claudePause_draft_';
const RECOVERY_KEY = 'claudePause_recovery';
const SESSION_KEY = 'claudePause_session';
const DEFAULT_AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const DEFAULT_MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<Map<string, DraftData>>(new Map());
  const [saveStatus, setSaveStatus] = useState<Map<string, DraftSaveStatus>>(new Map());
  const [recoveryInfo, setRecoveryInfo] = useState<DraftRecoveryInfo>({
    availableDrafts: [],
    lastCrashTime: null
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState(DEFAULT_AUTO_SAVE_INTERVAL);
  const [maxDraftAge, setMaxDraftAge] = useState(DEFAULT_MAX_DRAFT_AGE);
  
  const autoSaveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sessionId = useRef<string>('');

  // Initialize session
  useEffect(() => {
    sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId.current);
    
    // Check for crash recovery
    checkForCrashRecovery();
    
    // Clean up old drafts
    cleanupOldDrafts();
    
    // Set up periodic cleanup
    const cleanupInterval = setInterval(cleanupOldDrafts, 60 * 60 * 1000); // Every hour
    
    return () => {
      clearInterval(cleanupInterval);
      // Mark session as ended cleanly
      localStorage.removeItem(SESSION_KEY);
    };
  }, []);

  const checkForCrashRecovery = useCallback(() => {
    const lastSession = localStorage.getItem(SESSION_KEY);
    if (lastSession && lastSession !== sessionId.current) {
      // Previous session didn't end cleanly
      const draftsToRecover: DraftData[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          try {
            const draft = JSON.parse(localStorage.getItem(key) || '');
            if (draft.sessionId === lastSession) {
              draftsToRecover.push(draft);
            }
          } catch (error) {
            console.error('Failed to parse draft:', error);
          }
        }
      }
      
      if (draftsToRecover.length > 0) {
        setRecoveryInfo({
          availableDrafts: draftsToRecover,
          lastCrashTime: new Date().toISOString()
        });
        localStorage.setItem(RECOVERY_KEY, JSON.stringify({
          drafts: draftsToRecover,
          crashTime: new Date().toISOString()
        }));
      }
    }
  }, []);

  const cleanupOldDrafts = useCallback(() => {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const draft = JSON.parse(localStorage.getItem(key) || '');
          const draftAge = now - new Date(draft.createdAt).getTime();
          
          if (draftAge > maxDraftAge) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Invalid draft, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [maxDraftAge]);

  const saveDraft = useCallback((requestId: string, formData: Partial<DraftFormData>, isManual = false) => {
    // Update save status
    setSaveStatus(prev => new Map(prev).set(requestId, {
      isSaving: true,
      lastSaveTime: null,
      saveError: null,
      pendingChanges: false
    }));
    
    try {
      const existingDraft = drafts.get(requestId);
      const now = new Date().toISOString();
      
      const draft: DraftData = {
        requestId,
        dialogType: existingDraft?.dialogType || 'planner',
        originalParameters: existingDraft?.originalParameters || {},
        formData: {
          ...existingDraft?.formData,
          ...formData,
          isDirty: true,
          lastInteractionAt: now
        },
        createdAt: existingDraft?.createdAt || now,
        lastSavedAt: now,
        autoSaveCount: (existingDraft?.autoSaveCount || 0) + (isManual ? 0 : 1),
        isManualSave: isManual,
        sessionId: sessionId.current,
        wasRecovered: existingDraft?.wasRecovered || false
      };
      
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${requestId}`, JSON.stringify(draft));
      
      // Update state
      setDrafts(prev => new Map(prev).set(requestId, draft));
      setSaveStatus(prev => new Map(prev).set(requestId, {
        isSaving: false,
        lastSaveTime: now,
        saveError: null,
        pendingChanges: false
      }));
      
      // Reset auto-save timer
      if (!isManual) {
        const existingTimer = autoSaveTimers.current.get(requestId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const newTimer = setTimeout(() => {
          // Check if there are pending changes
          const currentDraft = drafts.get(requestId);
          if (currentDraft?.formData.isDirty) {
            saveDraft(requestId, {}, false);
          }
        }, autoSaveInterval);
        
        autoSaveTimers.current.set(requestId, newTimer);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus(prev => new Map(prev).set(requestId, {
        isSaving: false,
        lastSaveTime: null,
        saveError: error instanceof Error ? error.message : 'Unknown error',
        pendingChanges: true
      }));
    }
  }, [drafts, autoSaveInterval]);

  const deleteDraft = useCallback((requestId: string) => {
    // Clear auto-save timer
    const timer = autoSaveTimers.current.get(requestId);
    if (timer) {
      clearTimeout(timer);
      autoSaveTimers.current.delete(requestId);
    }
    
    // Remove from localStorage
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${requestId}`);
    
    // Update state
    setDrafts(prev => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });
    setSaveStatus(prev => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });
  }, []);

  const getDraft = useCallback((requestId: string) => {
    return drafts.get(requestId);
  }, [drafts]);

  const getSaveStatus = useCallback((requestId: string): DraftSaveStatus => {
    return saveStatus.get(requestId) || {
      isSaving: false,
      lastSaveTime: null,
      saveError: null,
      pendingChanges: false
    };
  }, [saveStatus]);

  const recoverDraft = useCallback((draft: DraftData) => {
    // Mark as recovered
    const recoveredDraft = {
      ...draft,
      wasRecovered: true,
      sessionId: sessionId.current
    };
    
    setDrafts(prev => new Map(prev).set(draft.requestId, recoveredDraft));
    
    // Remove from recovery list
    setRecoveryInfo(prev => ({
      ...prev,
      availableDrafts: prev.availableDrafts.filter(d => d.requestId !== draft.requestId)
    }));
  }, []);

  const dismissRecovery = useCallback(() => {
    setRecoveryInfo({
      availableDrafts: [],
      lastCrashTime: null
    });
    localStorage.removeItem(RECOVERY_KEY);
  }, []);

  const value: DraftContextType = {
    drafts,
    getDraft,
    saveDraft,
    deleteDraft,
    saveStatus,
    getSaveStatus,
    recoveryInfo,
    recoverDraft,
    dismissRecovery,
    autoSaveInterval,
    setAutoSaveInterval,
    maxDraftAge,
    setMaxDraftAge
  };

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDrafts must be used within DraftProvider');
  }
  return context;
}