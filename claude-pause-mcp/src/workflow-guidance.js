// Workflow Guidance Generator
// Generates smart chaining instructions for tool responses

class WorkflowGuidanceGenerator {
  constructor() {
    this.decisionPatterns = {
      architecture: ['framework', 'database', 'api', 'auth'],
      implementation: ['component', 'styling', 'state', 'routing'],
      integration: ['third_party', 'payment', 'email', 'storage'],
      optimization: ['performance', 'caching', 'bundling', 'seo']
    };
  }

  /**
   * Generate guidance based on tool type and response
   */
  generateGuidance(toolType, response, context = {}) {
    try {
      const generators = {
        planner: () => this.generatePlannerGuidance(response, context),
        single_choice: () => this.generateChoiceGuidance(response, context),
        multi_choice: () => this.generateMultiChoiceGuidance(response, context),
        text_input: () => this.generateTextGuidance(response, context),
        confirm: () => this.generateConfirmGuidance(response, context),
        screenshot_request: () => this.generateScreenshotGuidance(response, context)
      };

      const generator = generators[toolType];
      if (!generator) {
        return this.generateDefaultGuidance();
      }

      const guidance = generator();
      return this.formatGuidance(guidance);
    } catch (error) {
      return this.generateDefaultGuidance();
    }
  }

  /**
   * Planner-specific guidance
   */
  generatePlannerGuidance(response, context) {
    // Extract the plan text from response object
    const planText = typeof response === 'string' ? response : (response.value || response.text || '');
    const decisions = this.extractDecisionsFromPlan(planText);
    
    return {
      type: 'planner',
      instruction: `
## 🔍 Workflow Analysis Required

Now that you have a plan, analyze each step for decision points:

1. **Review the plan** for places where multiple approaches exist
2. **Check patterns** using \`should_ask_user\` before implementing
3. **Use dialog tools** when user input would improve the outcome`,
      
      decisions: decisions.map(d => ({
        step: d.step,
        description: d.description,
        suggestedCheck: `should_ask_user(type: "${d.type}", category: "${d.category}", importance: "${d.importance}")`,
        reason: d.reason
      })),
      
      nextAction: decisions.length > 0 
        ? `Start with: \`should_ask_user\` for "${decisions[0].step}"`
        : 'Proceed with implementation following existing patterns',
      
      example: this.generatePlannerExample(decisions[0])
    };
  }

  /**
   * Single choice guidance - analyze impact
   */
  generateChoiceGuidance(response, context) {
    const choice = response.value;
    const implications = this.analyzeChoiceImplications(choice, context);
    
    return {
      type: 'single_choice',
      instruction: `
## 🔄 Choice Impact Analysis

Your selection of "${response.label}" affects the following:`,
      
      impacts: {
        enables: implications.enables,
        eliminates: implications.eliminates,
        modifies: implications.modifies,
        requires: implications.newDecisions
      },
      
      workflowUpdate: `
### Workflow adjustments:
${implications.enables.map(e => `- ✅ Can now proceed with: ${e}`).join('\n')}
${implications.eliminates.map(e => `- ⏭️ Can skip: ${e} (implied by choice)`).join('\n')}
${implications.newDecisions.map(d => `- 🆕 New decision needed: ${d}`).join('\n')}`,
      
      nextAction: implications.nextDecision 
        ? `Next: \`should_ask_user\` for "${implications.nextDecision}"`
        : 'Continue with implementation',
      
      stored: response.rememberChoice 
        ? '💾 Choice remembered - will apply to similar decisions' 
        : null
    };
  }

  /**
   * Text input guidance
   */
  generateTextGuidance(response, context) {
    const content = this.analyzeTextContent(response);
    
    return {
      type: 'text_input',
      instruction: `
## 📝 Input Received

Based on the provided details:`,
      
      analysis: content.findings,
      
      followUp: content.needsClarification.length > 0 ? {
        questions: content.needsClarification,
        suggestedTool: 'text_input or single_choice'
      } : null,
      
      nextAction: content.nextStep
    };
  }

  /**
   * Confirmation guidance
   */
  generateConfirmGuidance(response, context) {
    const confirmed = response.confirmed;
    
    return {
      type: 'confirm',
      instruction: confirmed 
        ? '## ✅ Confirmed - Proceeding with action'
        : '## ❌ Cancelled - Considering alternatives',
      
      guidance: confirmed ? {
        reminder: 'Ensure all safety checks before executing',
        rollback: 'Prepare rollback plan if needed'
      } : {
        alternatives: 'Consider alternative approaches',
        suggestion: 'Use single_choice to present options'
      },
      
      nextAction: confirmed 
        ? 'Proceed with implementation'
        : 'Explore alternative approaches'
    };
  }

  /**
   * Multi-choice guidance
   */
  generateMultiChoiceGuidance(response, context) {
    const selected = response.options || [];
    
    return {
      type: 'multi_choice',
      instruction: `
## ☑️ Multiple Selections Made

Selected ${selected.length} options will be implemented:`,
      
      implementation: {
        parallel: this.getParallelTasks(selected),
        sequential: this.getSequentialTasks(selected),
        dependencies: this.getDependencies(selected)
      },
      
      warnings: this.getCompatibilityWarnings(selected),
      
      nextAction: 'Check dependencies before implementing selected features'
    };
  }

  /**
   * Screenshot guidance
   */
  generateScreenshotGuidance(response, context) {
    return {
      type: 'screenshot',
      instruction: `
## 📸 Visual Feedback Received

Analyze the screenshot for:`,
      
      checklist: [
        'UI/UX issues to address',
        'Alignment with requirements',
        'Accessibility concerns',
        'Responsive design needs'
      ],
      
      nextAction: 'Based on visual feedback, determine necessary adjustments'
    };
  }

  /**
   * Extract decisions from plan
   */
  extractDecisionsFromPlan(planText) {
    const decisions = [];
    // Ensure planText is a string
    const textToAnalyze = String(planText || '');
    const planLower = textToAnalyze.toLowerCase();
    
    // Common decision keywords
    const decisionKeywords = {
      high: ['authentication', 'database', 'api', 'framework', 'architecture'],
      medium: ['styling', 'state management', 'routing', 'validation'],
      low: ['formatting', 'naming', 'structure']
    };
    
    for (const [importance, keywords] of Object.entries(decisionKeywords)) {
      for (const keyword of keywords) {
        if (planLower.includes(keyword)) {
          decisions.push({
            step: keyword,
            description: `Decide on ${keyword} approach`,
            type: this.inferType(keyword),
            category: this.inferCategory(keyword),
            importance,
            reason: `Multiple valid approaches for ${keyword}`
          });
        }
      }
    }
    
    return decisions;
  }

  /**
   * Analyze implications of a choice
   */
  analyzeChoiceImplications(choice, context) {
    const implications = {
      enables: [],
      eliminates: [],
      modifies: [],
      newDecisions: [],
      nextDecision: null
    };
    
    // Framework choices
    if (context.question && typeof context.question === 'string' && context.question.toLowerCase().includes('framework')) {
      if (choice === 'react') {
        implications.enables = ['JSX components', 'React hooks'];
        implications.newDecisions = ['State management (Context/Redux/Zustand)'];
        implications.nextDecision = 'state management';
      } else if (choice === 'vue') {
        implications.enables = ['Vue components', 'Composition API'];
        implications.newDecisions = ['Store solution (Vuex/Pinia)'];
        implications.nextDecision = 'store solution';
      }
    }
    
    // Database choices
    if (context.question && typeof context.question === 'string' && context.question.toLowerCase().includes('database')) {
      if (choice === 'postgresql') {
        implications.enables = ['Relational queries', 'ACID compliance'];
        implications.eliminates = ['NoSQL schema decisions'];
      } else if (choice === 'mongodb') {
        implications.enables = ['Flexible schemas', 'Document storage'];
        implications.eliminates = ['SQL migrations'];
      }
    }
    
    return implications;
  }

  /**
   * Format guidance for output
   */
  formatGuidance(guidance) {
    let formatted = '\n\n---\n';
    formatted += guidance.instruction + '\n';
    
    if (guidance.decisions) {
      formatted += '\n### 📋 Identified Decision Points:\n';
      guidance.decisions.forEach((d, i) => {
        formatted += `\n${i + 1}. **${d.step}**\n`;
        formatted += `   - Check: \`${d.suggestedCheck}\`\n`;
        formatted += `   - Reason: ${d.reason}\n`;
      });
    }
    
    if (guidance.workflowUpdate) {
      formatted += guidance.workflowUpdate;
    }
    
    if (guidance.nextAction) {
      formatted += `\n\n**🎯 Next Action**: ${guidance.nextAction}\n`;
    }
    
    if (guidance.stored) {
      formatted += `\n${guidance.stored}\n`;
    }
    
    return formatted;
  }

  /**
   * Helper methods
   */
  inferType(keyword) {
    const typeMap = {
      'auth': 'authentication',
      'database': 'database_choice',
      'api': 'api_design',
      'framework': 'framework_selection',
      'styling': 'styling_approach'
    };
    
    return typeMap[keyword] || keyword;
  }

  inferCategory(keyword) {
    if (['auth', 'database', 'api', 'framework'].includes(keyword)) {
      return 'architecture';
    }
    if (['styling', 'state', 'routing'].includes(keyword)) {
      return 'implementation';
    }
    return 'general';
  }

  generatePlannerExample(decision) {
    if (!decision) return '';
    
    return `
### Example for "${decision.step}":
\`\`\`javascript
// Before implementing ${decision.step}
const shouldAsk = await should_ask_user({
  type: "${decision.type}",
  category: "${decision.category}", 
  importance: "${decision.importance}"
});

if (shouldAsk) {
  // Use appropriate dialog tool
  const choice = await single_choice({
    question: "Which ${decision.step} approach?",
    options: [/* context-specific options */]
  });
}
\`\`\``;
  }

  generateDefaultGuidance() {
    return {
      instruction: '\n## 💡 Continue with implementation',
      nextAction: 'Follow established patterns'
    };
  }

  // Additional helper methods
  analyzeTextContent(response) {
    return {
      findings: ['Input captured successfully'],
      needsClarification: [],
      nextStep: 'Implement based on provided specifications'
    };
  }

  getParallelTasks(selected) {
    return selected.filter(s => !this.hasDependencies(s));
  }

  getSequentialTasks(selected) {
    return selected.filter(s => this.hasDependencies(s));
  }

  getDependencies(selected) {
    return [];
  }

  getCompatibilityWarnings(selected) {
    return [];
  }

  hasDependencies(selection) {
    return false;
  }
}

export default WorkflowGuidanceGenerator;