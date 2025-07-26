// Preference Manager for Claude Pause MCP
// Stores and retrieves user preferences to reduce dialog fatigue

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

class PreferenceManager {
  constructor() {
    this.preferencesFile = null;
    this.preferences = null;
    this.defaultPreferences = {
      version: '1.0',
      dialogFrequency: 'normal', // minimal, low, normal, high
      decisions: {},
      patterns: {},
      skipTypes: [],
      alwaysAsk: ['security', 'breaking_changes', 'authentication'],
      projectSpecific: {}
    };
  }

  async getPreferencesPath() {
    // Try project-local first
    const localPath = path.join(process.cwd(), '.claude-preferences.json');
    try {
      await fs.access(localPath);
      return localPath;
    } catch {
      // Fall back to user home directory
      return path.join(os.homedir(), '.claude-preferences.json');
    }
  }

  async load() {
    try {
      this.preferencesFile = await this.getPreferencesPath();
      const data = await fs.readFile(this.preferencesFile, 'utf8');
      this.preferences = JSON.parse(data);
      
      // Merge with defaults to ensure all fields exist
      this.preferences = {
        ...this.defaultPreferences,
        ...this.preferences,
        decisions: {
          ...this.defaultPreferences.decisions,
          ...this.preferences.decisions
        },
        patterns: {
          ...this.defaultPreferences.patterns,
          ...this.preferences.patterns
        }
      };
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      this.preferences = { ...this.defaultPreferences };
      await this.save();
    }
    
    return this.preferences;
  }

  async save() {
    try {
      this.preferencesFile = await this.getPreferencesPath();
      await fs.writeFile(
        this.preferencesFile,
        JSON.stringify(this.preferences, null, 2),
        'utf8'
      );
    } catch (error) {
    }
  }

  // Store a decision for future reference
  async rememberDecision(category, decision, value, options = {}) {
    await this.load();
    
    const key = `${category}.${decision}`;
    this.preferences.decisions[key] = {
      value,
      timestamp: new Date().toISOString(),
      count: (this.preferences.decisions[key]?.count || 0) + 1,
      ...options
    };
    
    await this.save();
  }

  // Get a remembered decision
  async getDecision(category, decision) {
    await this.load();
    
    const key = `${category}.${decision}`;
    return this.preferences.decisions[key];
  }

  // Store a pattern (e.g., "always use functional components")
  async rememberPattern(patternType, value, options = {}) {
    await this.load();
    
    this.preferences.patterns[patternType] = {
      value,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    await this.save();
  }

  // Get a pattern preference
  async getPattern(patternType) {
    await this.load();
    return this.preferences.patterns[patternType];
  }

  // Check if we should ask based on preferences
  async shouldAsk(context) {
    await this.load();
    
    const { type, category, importance = 'medium' } = context;
    
    // Always ask for certain types
    if (this.preferences.alwaysAsk.includes(type)) {
      return { shouldAsk: true, reason: 'Always ask for this type' };
    }
    
    // Never ask for skipped types
    if (this.preferences.skipTypes.includes(type)) {
      return { shouldAsk: false, reason: 'User opted to skip this type' };
    }
    
    // Check dialog frequency setting
    const frequencyThresholds = {
      minimal: ['critical'],
      low: ['critical', 'high'],
      normal: ['critical', 'high', 'medium'],
      high: ['critical', 'high', 'medium', 'low']
    };
    
    const threshold = frequencyThresholds[this.preferences.dialogFrequency] || frequencyThresholds.normal;
    
    if (!threshold.includes(importance)) {
      return { shouldAsk: false, reason: `Below threshold for ${this.preferences.dialogFrequency} frequency` };
    }
    
    // Check if we have a stored decision
    const existingDecision = await this.getDecision(category, type);
    if (existingDecision && existingDecision.applyToSimilar) {
      return { 
        shouldAsk: false, 
        reason: 'Using stored preference',
        storedValue: existingDecision.value 
      };
    }
    
    return { shouldAsk: true, reason: 'No stored preference' };
  }

  // Update dialog frequency
  async setDialogFrequency(frequency) {
    await this.load();
    
    const validFrequencies = ['minimal', 'low', 'normal', 'high'];
    if (!validFrequencies.includes(frequency)) {
      throw new Error(`Invalid frequency: ${frequency}. Must be one of: ${validFrequencies.join(', ')}`);
    }
    
    this.preferences.dialogFrequency = frequency;
    await this.save();
  }

  // Add a type to always skip
  async addSkipType(type) {
    await this.load();
    
    if (!this.preferences.skipTypes.includes(type)) {
      this.preferences.skipTypes.push(type);
      await this.save();
    }
  }

  // Remove a type from skip list
  async removeSkipType(type) {
    await this.load();
    
    this.preferences.skipTypes = this.preferences.skipTypes.filter(t => t !== type);
    await this.save();
  }

  // Reset all preferences
  async reset() {
    this.preferences = { ...this.defaultPreferences };
    await this.save();
  }

  // Get statistics about stored preferences
  async getStats() {
    await this.load();
    
    return {
      totalDecisions: Object.keys(this.preferences.decisions).length,
      totalPatterns: Object.keys(this.preferences.patterns).length,
      dialogFrequency: this.preferences.dialogFrequency,
      skipTypes: this.preferences.skipTypes.length,
      mostUsedDecisions: Object.entries(this.preferences.decisions)
        .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
        .slice(0, 5)
        .map(([key, data]) => ({ key, ...data }))
    };
  }
}

export default PreferenceManager;