#!/usr/bin/env node

import { createDialogManager } from './src/dialogs.js';

async function testDialog() {
  const dialogManager = createDialogManager();
  
  console.log('Dialog tool detected:', dialogManager.dialogTool);
  
  // Test 1: Multiple choice
  console.log('\nTest 1: Multiple choice dialog');
  const result1 = await dialogManager.showDialog({
    decision_context: 'Which component architecture should I use for the user profile page?',
    options: [
      'Single page with all information',
      'Tabbed interface (Profile, Settings, Activity)',
      'Wizard-style step-by-step',
      'Card-based sections'
    ],
    default_action: 'Tabbed interface'
  });
  console.log('Result:', result1);
  
  // Test 2: Open-ended input
  console.log('\nTest 2: Open-ended input dialog');
  const result2 = await dialogManager.showDialog({
    decision_context: 'What color scheme should I use for the modern dashboard? Please specify primary and accent colors.',
    default_action: 'Blue primary with orange accents'
  });
  console.log('Result:', result2);
  
  console.log('\nDecision history:', dialogManager.getDecisionHistory());
}

testDialog().catch(console.error);