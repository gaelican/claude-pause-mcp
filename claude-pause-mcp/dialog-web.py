#!/usr/bin/env python3
import sys
import json
import webbrowser
import http.server
import socketserver
import threading
import time
import os
from urllib.parse import parse_qs, urlparse

result = None
server = None

class DialogHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Parse the dialog data
            data = json.loads(sys.argv[1])
            context = data.get('decision_context', '')
            options = data.get('options', [])
            default = data.get('default_action', '')
            
            # Load saved thinking mode
            thinking_mode = "normal"
            try:
                pref_file = os.path.join(os.path.dirname(__file__), ".thinking_mode_preference")
                if os.path.exists(pref_file):
                    with open(pref_file, 'r') as f:
                        saved = f.read().strip()
                        if saved in ["normal", "deep", "ultra", "quick"]:
                            thinking_mode = saved
            except:
                pass
            
            html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Claude Code Decision</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e2e;
            color: #cdd6f4;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
            box-sizing: border-box;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #313244;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }}
        h1 {{
            margin: 0 0 30px 0;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        .title-word {{
            font-weight: 800;
        }}
        .word-claude {{ color: #89b4fa; }}
        .word-code {{ color: #f38ba8; }}
        .word-decision {{ color: #a6e3a1; }}
        .context {{
            background: #1e1e2e;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            line-height: 1.6;
            white-space: pre-wrap;
            font-size: 16px;
        }}
        .thinking-modes {{
            margin-bottom: 30px;
        }}
        .mode-label {{
            color: #89b4fa;
            font-weight: 600;
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .mode-buttons {{
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }}
        .mode-btn {{
            padding: 12px 24px;
            border: 2px solid #45475a;
            background: #1e1e2e;
            color: #cdd6f4;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s;
            position: relative;
        }}
        .mode-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }}
        .mode-btn.active {{
            border-color: #a6e3a1;
            background: #45475a;
        }}
        .mode-btn.quick {{ color: #f9e2af; }}
        .mode-btn.normal {{ color: #89dceb; }}
        .mode-btn.deep {{ color: #89b4fa; }}
        .mode-btn.ultra {{ color: #f38ba8; }}
        .response-area {{
            margin-bottom: 30px;
        }}
        .response-label {{
            color: #f9e2af;
            font-weight: 600;
            margin-bottom: 10px;
        }}
        textarea {{
            width: 100%;
            background: #1e1e2e;
            border: 2px solid #45475a;
            color: #cdd6f4;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            min-height: 120px;
        }}
        textarea:focus {{
            outline: none;
            border-color: #89b4fa;
        }}
        .buttons {{
            display: flex;
            gap: 15px;
            justify-content: flex-end;
        }}
        button {{
            padding: 14px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .submit-btn {{
            background: #a6e3a1;
            color: #1e1e2e;
        }}
        .submit-btn:hover {{
            background: #b4e7af;
            transform: translateY(-2px);
        }}
        .cancel-btn {{
            background: #45475a;
            color: #cdd6f4;
        }}
        .cancel-btn:hover {{
            background: #585b70;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <span class="title-word word-claude">Claude</span>
            <span class="title-word word-code">Code</span>
            <span class="title-word word-decision">Decision</span>
            <span style="color: #a6adc8; font-weight: normal;">Required</span>
        </h1>
        
        <div class="context">{context}{options_html}{default_html}</div>
        
        <div class="thinking-modes">
            <div class="mode-label">Thinking Mode (affects response depth)</div>
            <div class="mode-buttons">
                <button class="mode-btn quick" data-mode="quick" onclick="setMode('quick')">
                    [Q] Quick
                </button>
                <button class="mode-btn normal" data-mode="normal" onclick="setMode('normal')">
                    [N] Normal
                </button>
                <button class="mode-btn deep" data-mode="deep" onclick="setMode('deep')">
                    [D] Deep Think
                </button>
                <button class="mode-btn ultra" data-mode="ultra" onclick="setMode('ultra')">
                    [U] Ultra Think
                </button>
            </div>
        </div>
        
        <div class="response-area">
            <div class="response-label">Your response:</div>
            <textarea id="response" autofocus>{default}</textarea>
        </div>
        
        <div class="buttons">
            <button class="cancel-btn" onclick="cancel()">Cancel</button>
            <button class="submit-btn" onclick="submit()">Submit</button>
        </div>
    </div>
    
    <script>
        let currentMode = '{thinking_mode}';
        
        // Set initial mode
        document.querySelector(`[data-mode="${{currentMode}}"]`).classList.add('active');
        
        function setMode(mode) {{
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-mode="${{mode}}"]`).classList.add('active');
            currentMode = mode;
        }}
        
        function submit() {{
            const response = document.getElementById('response').value;
            fetch('/submit?response=' + encodeURIComponent(response) + '&mode=' + currentMode)
                .then(() => window.close());
        }}
        
        function cancel() {{
            fetch('/cancel').then(() => window.close());
        }}
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {{
            if (e.key === 'Enter' && e.ctrlKey) submit();
            if (e.key === 'Escape') cancel();
            if (e.key.toLowerCase() === 'q' && !e.target.matches('textarea')) setMode('quick');
            if (e.key.toLowerCase() === 'n' && !e.target.matches('textarea')) setMode('normal');
            if (e.key.toLowerCase() === 'd' && !e.target.matches('textarea')) setMode('deep');
            if (e.key.toLowerCase() === 'u' && !e.target.matches('textarea')) setMode('ultra');
        }});
    </script>
</body>
</html>
"""
            
            # Add options if present
            options_html = ""
            if options:
                options_html = "\n\nOptions to consider:"
                for i, opt in enumerate(options, 1):
                    options_html += f"\n  {i}. {opt}"
            
            # Add default if present
            default_html = ""
            if default:
                default_html = f"\n\nDefault: {default}"
            
            html = html.replace("{options_html}", options_html)
            html = html.replace("{default_html}", default_html)
            
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/submit'):
            query = parse_qs(urlparse(self.path).query)
            response = query.get('response', [''])[0]
            mode = query.get('mode', ['normal'])[0]
            result = f"{response}|||{mode}"
            
            # Save thinking mode preference
            try:
                pref_file = os.path.join(os.path.dirname(__file__), ".thinking_mode_preference")
                with open(pref_file, 'w') as f:
                    f.write(mode)
            except:
                pass
            
            self.send_response(200)
            self.end_headers()
            server.shutdown()
            
        elif self.path == '/cancel':
            result = "CANCELLED"
            self.send_response(200)
            self.end_headers()
            server.shutdown()
    
    def log_message(self, format, *args):
        pass  # Suppress log messages

def show_web_dialog(json_input):
    global server, result
    
    # Find an available port
    port = 0
    with socketserver.TCPServer(("localhost", 0), DialogHandler) as s:
        port = s.server_address[1]
    
    # Start the server
    server = socketserver.TCPServer(("localhost", port), DialogHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    # Open browser
    webbrowser.open(f'http://localhost:{port}')
    
    # Wait for result
    server_thread.join()
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = show_web_dialog(sys.argv[1])
        if result:
            print(result)
    else:
        print("ERROR: No input provided")
        sys.exit(1)