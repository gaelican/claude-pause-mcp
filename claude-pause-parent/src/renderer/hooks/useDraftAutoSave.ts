import { useEffect, useCallback, useRef } from 'react';
import { useDrafts } from '../context/DraftContext';
import { DialogType } from '../types';
import { debounce } from '../utils/debounce';

interface UseDraftAutoSaveOptions {
  requestId: string;
  dialogType: DialogType;
  originalParameters: any;
  debounceMs?: number;
}

export function useDraftAutoSave({
  requestId,
  dialogType,
  originalParameters,
  debounceMs = 1000
}: UseDraftAutoSaveOptions) {
  const { getDraft, saveDraft, deleteDraft, getSaveStatus } = useDrafts();
  const lastSavedDataRef = useRef<string>('');

  // Initialize draft on mount
  useEffect(() => {
    const existingDraft = getDraft(requestId);
    if (!existingDraft) {
      saveDraft(requestId, {
        isDirty: false,
        lastInteractionAt: new Date().toISOString()
      });
    }
    
    // Cleanup on unmount
    return () => {
      // Don't delete draft on unmount - user might come back
      // Drafts are cleaned up based on age
    };
  }, [requestId, dialogType, originalParameters]);

  // Create debounced save function
  const debouncedSave = useRef(
    debounce((formData: any) => {
      const dataString = JSON.stringify(formData);
      
      // Only save if data has actually changed
      if (dataString !== lastSavedDataRef.current) {
        lastSavedDataRef.current = dataString;
        saveDraft(requestId, formData);
      }
    }, debounceMs)
  ).current;

  // Auto-save function
  const autoSave = useCallback((formData: any) => {
    debouncedSave(formData);
  }, [debouncedSave]);

  // Manual save function
  const manualSave = useCallback((formData: any) => {
    // Cancel any pending auto-saves
    debouncedSave.cancel();
    
    // Save immediately
    saveDraft(requestId, formData, true);
  }, [requestId, saveDraft, debouncedSave]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    deleteDraft(requestId);
  }, [requestId, deleteDraft]);

  // Get current draft and save status
  const draft = getDraft(requestId);
  const saveStatus = getSaveStatus(requestId);

  return {
    draft,
    saveStatus,
    autoSave,
    manualSave,
    clearDraft
  };
}