#!/usr/bin/env python3
import json
import os
from datetime import datetime

class DialogHistory:
    def __init__(self, max_items=10):
        self.max_items = max_items
        self.history_file = os.path.join(os.path.dirname(__file__), ".dialog_history.json")
        self.history = self.load_history()
    
    def load_history(self):
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    def save_history(self):
        try:
            with open(self.history_file, 'w') as f:
                json.dump(self.history[:self.max_items], f, indent=2)
        except:
            pass
    
    def add_entry(self, response, context, thinking_mode="normal"):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "response": response,
            "context": context[:100] + "..." if len(context) > 100 else context,
            "thinking_mode": thinking_mode
        }
        self.history.insert(0, entry)
        self.history = self.history[:self.max_items]
        self.save_history()
    
    def get_recent(self, count=5):
        return self.history[:count]
    
    def clear(self):
        self.history = []
        self.save_history()