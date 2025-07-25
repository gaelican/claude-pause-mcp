// Helper module for agents to determine when to use dialog tools
// This provides guidance based on context and user preferences

import PreferenceManager from './preference-manager.js';

class ShouldAskHelper {
  constructor() {
    this.preferenceManager = new PreferenceManager();
  }

  /**
   * Main function to determine if a dialog should be shown
   * @param {Object} context - The decision context
   * @param {string} context.type - Type of decision (e.g., 'framework', 'api_design', 'styling')
   * @param {string} context.category - Category (e.g., 'architecture', 'implementation', 'style')
   * @param {string} context.importance - Importance level: 'critical', 'high', 'medium', 'low'
   * @param {boolean} context.hasExistingPattern - Whether there's an existing pattern to follow
   * @param {boolean} context.isFirstImplementation - Whether this is the first time implementing
   * @param {boolean} context.isBreakingChange - Whether this could break existing functionality
   * @param {boolean} context.userRequested - Whether user explicitly asked to be consulted
   * @returns {Object} { shouldAsk: boolean, reason: string, storedValue?: any }
   */
  async shouldAsk(context) {
    // Always ask if user explicitly requested
    if (context.userRequested) {
      return { 
        shouldAsk: true, 
        reason: 'User explicitly requested input' 
      };
    }

    // Check MUST ASK conditions
    if (this.isMustAsk(context)) {
      return { 
        shouldAsk: true, 
        reason: this.getMustAskReason(context) 
      };
    }

    // Check DON'T ASK conditions
    if (this.isDontAsk(context)) {
      return { 
        shouldAsk: false, 
        reason: this.getDontAskReason(context) 
      };
    }

    // Check user preferences
    const preferenceResult = await this.preferenceManager.shouldAsk(context);
    if (!preferenceResult.shouldAsk && preferenceResult.storedValue) {
      return preferenceResult;
    }

    // Check SHOULD ASK conditions
    if (this.isShouldAsk(context)) {
      return { 
        shouldAsk: true, 
        reason: this.getShouldAskReason(context) 
      };
    }

    // Default: follow preference manager's decision
    return preferenceResult;
  }

  isMustAsk(context) {
    return (
      context.importance === 'critical' ||
      context.isBreakingChange ||
      (context.isFirstImplementation && context.category === 'architecture') ||
      context.type === 'security' ||
      context.type === 'authentication'
    );
  }

  getMustAskReason(context) {
    if (context.importance === 'critical') return 'Critical decision requires user input';
    if (context.isBreakingChange) return 'Breaking change requires confirmation';
    if (context.isFirstImplementation && context.category === 'architecture') {
      return 'First implementation of major architecture';
    }
    if (context.type === 'security') return 'Security decisions always require input';
    if (context.type === 'authentication') return 'Authentication decisions always require input';
    return 'High-impact decision';
  }

  isDontAsk(context) {
    return (
      context.hasExistingPattern ||
      context.type === 'formatting' ||
      context.type === 'bugfix_obvious' ||
      context.type === 'standard_crud' ||
      context.type === 'refactor_minor'
    );
  }

  getDontAskReason(context) {
    if (context.hasExistingPattern) return 'Following existing pattern';
    if (context.type === 'formatting') return 'Code formatting follows project style';
    if (context.type === 'bugfix_obvious') return 'Obvious bug fix';
    if (context.type === 'standard_crud') return 'Standard CRUD implementation';
    if (context.type === 'refactor_minor') return 'Minor refactoring';
    return 'Standard implementation';
  }

  isShouldAsk(context) {
    return (
      context.importance === 'high' ||
      (context.isFirstImplementation && context.category !== 'architecture') ||
      context.type === 'ui_layout' ||
      context.type === 'api_design' ||
      context.type === 'performance_optimization' ||
      context.type === 'third_party_selection'
    );
  }

  getShouldAskReason(context) {
    if (context.importance === 'high') return 'High importance decision';
    if (context.isFirstImplementation) return 'First implementation needs guidance';
    if (context.type === 'ui_layout') return 'UI layout requires user preference';
    if (context.type === 'api_design') return 'API design affects system interface';
    if (context.type === 'performance_optimization') return 'Performance trade-offs need input';
    if (context.type === 'third_party_selection') return 'Library selection has long-term impact';
    return 'Important decision';
  }

  /**
   * Quick check for common patterns
   */
  async quickCheck(type, hasExistingPattern = false) {
    return this.shouldAsk({
      type,
      category: 'general',
      importance: 'medium',
      hasExistingPattern,
      isFirstImplementation: !hasExistingPattern,
      isBreakingChange: false,
      userRequested: false
    });
  }
}

// Export singleton instance
export default new ShouldAskHelper();