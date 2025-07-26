import { spawn, spawnSync } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(spawn);

export class DialogManager {
  constructor() {
    this.dialogTool = this.detectDialogTool();
    this.decisionHistory = [];
    this.lastPosition = null; // Store last dialog position
  }

  detectDialogTool() {
    const tools = ['yad', 'zenity', 'kdialog', 'dialog', 'whiptail']; // Prefer yad for position support
    
    for (const tool of tools) {
      const result = spawnSync('which', [tool], { encoding: 'utf8' });
      if (result.status === 0) {
        return tool;
      }
    }
    
    return null;
  }

  async showDialog(args) {
    const { decision_context, options, default_action } = args;
    
    if (!this.dialogTool) {
      throw new Error('No dialog tool available. Please install zenity, yad, or whiptail.');
    }

    this.logToStderr(`Using ${this.dialogTool} for dialog`);

    switch (this.dialogTool) {
      case 'zenity':
        return await this.showZenityDialog(args);
      case 'yad':
        return await this.showYadDialog(args);
      case 'whiptail':
      case 'dialog':
        return await this.showWhiptailDialog(args);
      default:
        throw new Error(`Unsupported dialog tool: ${this.dialogTool}`);
    }
  }

  async showZenityDialog({ decision_context, options, default_action }) {
    // Always use entry dialog with options listed in context
    let fullContext = this.formatContext(decision_context);
    
    // Add options to context if provided
    if (options && options.length > 0) {
      fullContext += '\n\nOptions to consider:';
      options.forEach((opt, i) => {
        fullContext += `\n  ${i + 1}. ${opt}`;
      });
    }
    
    // Add default if provided
    if (default_action) {
      fullContext += `\n\nDefault: ${default_action}`;
    }
    
    fullContext += '\n\nType your response below (or press Enter for default):';
    
    // Use entry dialog
    const command = 'zenity';
    const args = [
      '--entry',
      '--title=Claude Code Decision Required',
      '--text=' + fullContext,
      '--width=700',
      '--height=400'
    ];
    
    // Try to attach to parent window if possible
    const windowId = this.getParentWindowId();
    if (windowId) {
      args.push('--attach=' + windowId);
      this.logToStderr(`Attaching to window ID: ${windowId}`);
    }
    
    if (default_action) {
      args.push('--entry-text=' + default_action);
    }

    return new Promise((resolve) => {
      const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // Get the result - either typed text or selected option
          const result = stdout.trim() || default_action || 'No input provided';
          this.recordDecision(decision_context, result);
          resolve(result);
        } else if (code === 1) {
          // User cancelled
          resolve('CANCELLED');
        } else {
          resolve(default_action || 'No input provided');
        }
      });
    });
  }

  async showZenityEntryDialog({ decision_context, default_action }) {
    const command = 'zenity';
    const args = [
      '--entry',
      '--title=Claude Code Decision Required',
      '--text=' + this.formatContext(decision_context) + (default_action ? '\n\nDefault: ' + default_action : ''),
      '--width=600'
    ];

    if (default_action) {
      args.push('--entry-text=' + default_action);
    }

    return new Promise((resolve) => {
      const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          const result = stdout.trim() || default_action || 'No input provided';
          this.recordDecision(decision_context, result);
          resolve(result);
        } else {
          resolve('CANCELLED');
        }
      });
    });
  }

  async showYadDialog({ decision_context, options, default_action }) {
    // Always use entry dialog with options listed in context
    let fullContext = this.formatContext(decision_context);
    
    // Add options to context if provided
    if (options && options.length > 0) {
      fullContext += '\n\nOptions to consider:';
      options.forEach((opt, i) => {
        fullContext += `\n  ${i + 1}. ${opt}`;
      });
    }
    
    // Add default if provided
    if (default_action) {
      fullContext += `\n\nDefault: ${default_action}`;
    }
    
    fullContext += '\n\nType your response below:';
    
    const command = 'yad';
    const args = [
      '--entry',
      '--title=Claude Code Decision Required',
      '--text=' + fullContext,
      '--width=700',
      '--height=400',
      '--on-top',  // Keep dialog on top
      '--center',   // Center on first run
      '--print-settings'  // Print window settings on close
    ];
    
    // Use saved position if available
    if (this.lastPosition) {
      const geometryIndex = args.indexOf('--center');
      args[geometryIndex] = '--geometry=+' + this.lastPosition.x + '+' + this.lastPosition.y;
      this.logToStderr(`Using saved position: ${this.lastPosition.x}, ${this.lastPosition.y}`);
    }
    
    if (default_action) {
      args.push('--entry-text=' + default_action);
    }

    return new Promise((resolve) => {
      const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // With --print-settings, yad outputs: value|geometry|other_settings
          const parts = stdout.trim().split('|');
          const result = parts[0] || default_action || 'No input provided';
          
          // Parse geometry from the settings output
          if (parts.length > 1 && parts[1]) {
            // Geometry format: WIDTHxHEIGHT+X+Y
            const geoMatch = parts[1].match(/\d+x\d+\+(\d+)\+(\d+)/);
            if (geoMatch) {
              this.lastPosition = { x: geoMatch[1], y: geoMatch[2] };
              this.logToStderr(`Saved position from yad settings: ${this.lastPosition.x}, ${this.lastPosition.y}`);
            }
          }
          
          this.recordDecision(decision_context, result);
          resolve(result);
        } else {
          resolve('CANCELLED');
        }
      });
    });
  }

  async showWhiptailDialog({ decision_context, options, default_action }) {
    const title = 'Claude Code Decision Required';
    let fullContext = this.formatContext(decision_context);
    
    // Add options to context if provided
    if (options && options.length > 0) {
      fullContext += '\n\nOptions to consider:';
      options.forEach((opt, i) => {
        fullContext += `\n  ${i + 1}. ${opt}`;
      });
    }
    
    // Add default if provided
    if (default_action) {
      fullContext += `\n\nDefault: ${default_action}`;
    }
    
    fullContext += '\n\nType your response:';
    
    // Always use inputbox
    const command = 'whiptail';
    const args = [
      '--title', title,
      '--inputbox', fullContext,
      '25', '80'
    ];

    if (default_action) {
      args.push(default_action);
    }

    return new Promise((resolve) => {
      const proc = spawn(command, args, { 
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, TERM: 'xterm' }
      });
      
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          let result = stderr.trim();
          
          // For menu selection, get the actual option text
          if (options && options.length > 0 && /^\d+$/.test(result)) {
            const index = parseInt(result) - 1;
            result = options[index] || result;
          }
          
          result = result || default_action || 'No input provided';
          this.recordDecision(decision_context, result);
          resolve(result);
        } else {
          resolve('CANCELLED');
        }
      });
    });
  }

  formatContext(context) {
    // Format context for better display
    const lines = context.split('\n');
    if (lines.length > 10) {
      // Truncate very long contexts
      return lines.slice(0, 10).join('\n') + '\n\n... (truncated)';
    }
    return context;
  }

  recordDecision(context, decision) {
    // Store decision for pattern learning
    this.decisionHistory.push({
      timestamp: new Date().toISOString(),
      context: context,
      decision: decision
    });

    // Keep only last 100 decisions in memory
    if (this.decisionHistory.length > 100) {
      this.decisionHistory = this.decisionHistory.slice(-100);
    }
  }

  getDecisionHistory() {
    return this.decisionHistory;
  }

  getParentWindowId() {
    // Try various methods to get the parent window ID
    
    // Method 1: Check WINDOWID environment variable (works in some terminals)
    if (process.env.WINDOWID) {
      return process.env.WINDOWID;
    }
    
    // Method 2: Try to find the terminal window using wmctrl
    try {
      const result = spawnSync('wmctrl', ['-lp'], { encoding: 'utf8' });
      if (result.status === 0) {
        // Get our parent PID
        const ppid = process.ppid;
        
        // Look for windows owned by our parent process
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          const parts = line.split(/\s+/);
          if (parts.length > 2 && parts[2] === String(ppid)) {
            return parts[0]; // Window ID is first column
          }
        }
      }
    } catch (e) {
      // wmctrl not available
    }
    
    // Method 3: Try xprop to get active window (less reliable)
    try {
      const result = spawnSync('xprop', ['-root', '_NET_ACTIVE_WINDOW'], { encoding: 'utf8' });
      if (result.status === 0) {
        const match = result.stdout.match(/0x[0-9a-f]+/);
        if (match) {
          return match[0];
        }
      }
    } catch (e) {
      // xprop not available
    }
    
    return null;
  }

  captureYadPosition(pid) {
    // Try to find yad window and get its position
    try {
      // First, find windows associated with the PID
      const wmctrlResult = spawnSync('wmctrl', ['-lp'], { encoding: 'utf8' });
      if (wmctrlResult.status === 0) {
        const lines = wmctrlResult.stdout.split('\n');
        for (const line of lines) {
          const parts = line.split(/\s+/);
          // Check if this window belongs to our yad process
          if (parts.length > 2 && parts[2] === String(pid)) {
            const windowId = parts[0];
            
            // Get window geometry
            const xwinfoResult = spawnSync('xwininfo', ['-id', windowId], { encoding: 'utf8' });
            if (xwinfoResult.status === 0) {
              const xMatch = xwinfoResult.stdout.match(/Absolute upper-left X:\s*(\d+)/);
              const yMatch = xwinfoResult.stdout.match(/Absolute upper-left Y:\s*(\d+)/);
              
              if (xMatch && yMatch) {
                this.lastPosition = { x: xMatch[1], y: yMatch[1] };
                this.logToStderr(`Captured yad position: ${this.lastPosition.x}, ${this.lastPosition.y}`);
              }
            }
            break;
          }
        }
      }
    } catch (e) {
      // Position capture failed, continue without it
      this.logToStderr('Failed to capture yad position: ' + e.message);
    }
  }

  logToStderr(message) {
    // Logging disabled for production
  }
}

export function createDialogManager() {
  return new DialogManager();
}