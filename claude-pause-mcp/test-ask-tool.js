// Test script for the ask tool
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = process.platform === 'win32';
const DIALOG_SCRIPT = isWindows 
  ? join(__dirname, 'dialog.bat')
  : join(__dirname, 'dialog.sh');

// Test 1: Basic ask with single-select options
async function testBasicAsk() {
    console.log('\n=== Test 1: Basic Ask with Single-Select ===');
    
    const askData = {
        toolType: 'ask',
        question: 'Which framework should we use for the frontend?',
        options: [
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' }
        ],
        allowTextInput: true,
        allowScreenshot: false,
        returnToPlanningOption: {
            label: '🔄 Return to planning',
            value: 'RETURN_TO_PLANNING',
            isSpecial: true
        }
    };
    
    const result = await runDialog(askData);
    console.log('Result:', result);
}

// Test 2: Ask with multi-select options
async function testMultiSelect() {
    console.log('\n=== Test 2: Ask with Multi-Select ===');
    
    const askData = {
        toolType: 'ask',
        question: 'Select the features you want to implement:',
        multiSelectOptions: [
            { label: 'User Authentication', value: 'auth', checked: true },
            { label: 'Dark Mode', value: 'darkmode', checked: false },
            { label: 'Real-time Updates', value: 'realtime', checked: false },
            { label: 'Export to PDF', value: 'pdf', checked: false }
        ],
        allowTextInput: true,
        allowScreenshot: false,
        returnToPlanningOption: {
            label: '🔄 Return to planning',
            value: 'RETURN_TO_PLANNING',
            isSpecial: true
        }
    };
    
    const result = await runDialog(askData);
    console.log('Result:', result);
}

// Test 3: Ask with both single and multi-select
async function testMixed() {
    console.log('\n=== Test 3: Ask with Mixed Options ===');
    
    const askData = {
        toolType: 'ask',
        question: 'Configure the deployment settings:',
        options: [
            { label: 'Production', value: 'prod' },
            { label: 'Staging', value: 'staging' },
            { label: 'Development', value: 'dev' }
        ],
        multiSelectOptions: [
            { label: 'Enable monitoring', value: 'monitoring', checked: true },
            { label: 'Enable backups', value: 'backups', checked: true },
            { label: 'Enable CDN', value: 'cdn', checked: false }
        ],
        allowTextInput: false,
        allowScreenshot: false,
        returnToPlanningOption: {
            label: '🔄 Return to planning',
            value: 'RETURN_TO_PLANNING',
            isSpecial: true
        }
    };
    
    const result = await runDialog(askData);
    console.log('Result:', result);
}

// Test 4: Planner tool (original functionality)
async function testPlanner() {
    console.log('\n=== Test 4: Planner Tool ===');
    
    const plannerData = {
        decision_context: 'We need to decide on the database architecture. Should we use SQL or NoSQL?',
        visual_output: `# Database Architecture Decision

## Options to Consider:

### SQL (PostgreSQL)
- **Pros**: ACID compliance, complex queries, mature ecosystem
- **Cons**: Rigid schema, scaling challenges

### NoSQL (MongoDB)
- **Pros**: Flexible schema, horizontal scaling
- **Cons**: Eventual consistency, limited query capabilities

What's your preference?`,
        options: [
            {
                label: 'PostgreSQL',
                value: 'postgresql',
                description: 'Traditional SQL with strong consistency'
            },
            {
                label: 'MongoDB',
                value: 'mongodb',
                description: 'Document-based NoSQL for flexibility'
            },
            {
                label: 'Let me explain my requirements',
                value: 'custom',
                description: 'I have specific needs to discuss'
            }
        ]
    };
    
    const result = await runDialog(plannerData);
    console.log('Result:', result);
}

// Helper function to run dialog
function runDialog(data) {
    return new Promise((resolve, reject) => {
        const jsonInput = JSON.stringify(data);
        const dialogArg = isWindows 
            ? Buffer.from(jsonInput).toString('base64')
            : jsonInput;

        const proc = isWindows 
            ? spawn('cmd.exe', ['/c', DIALOG_SCRIPT, dialogArg], {
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: false
              })
            : spawn(DIALOG_SCRIPT, [jsonInput], {
                stdio: ['ignore', 'pipe', 'pipe']
              });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error('[Dialog stderr]', data.toString());
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`Dialog exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

// Run tests
async function runTests() {
    console.log('Starting ask tool tests...');
    console.log('Note: This will open dialog windows. Please interact with them to test functionality.');
    
    try {
        // Test 1
        await testBasicAsk();
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2
        await testMultiSelect();
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3
        await testMixed();
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 4
        await testPlanner();
        
        console.log('\n✅ All tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Allow running individual tests or all tests
const testToRun = process.argv[2];
if (testToRun === '1') {
    testBasicAsk();
} else if (testToRun === '2') {
    testMultiSelect();
} else if (testToRun === '3') {
    testMixed();
} else if (testToRun === '4') {
    testPlanner();
} else {
    runTests();
}