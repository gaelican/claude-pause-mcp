#!/usr/bin/env python3
import sys
import json
import os
import tkinter as tk
from tkinter import ttk
import tkinter.font as tkfont
from history import DialogHistory

def show_dialog(json_input):
    # Parse input
    data = json.loads(json_input)
    context = data.get('decision_context', '')
    options = data.get('options', [])
    default = data.get('default_action', '')
    
    # Load history
    history = DialogHistory()
    
    # Create window
    root = tk.Tk()
    root.title("Claude Code Decision Required")
    
    # Try to improve rendering quality
    try:
        # Force high DPI awareness
        root.tk.call('tk', 'scaling', 2.0)
    except:
        pass
    
    # Dark theme colors - Catppuccin Mocha with vibrant accents
    bg_color = "#1e1e2e"
    fg_color = "#cdd6f4"
    accent_color = "#89b4fa"  # Blue
    accent2_color = "#f38ba8"  # Pink
    accent3_color = "#a6e3a1"  # Green
    input_bg = "#313244"
    button_bg = "#45475a"
    button_hover = "#585b70"
    
    # Configure window
    root.configure(bg=bg_color)
    root.resizable(True, True)
    
    # Position file
    position_file = os.path.join(os.path.dirname(__file__), ".dialog_position")
    
    # Load saved position or center window
    try:
        if os.path.exists(position_file):
            with open(position_file, 'r') as f:
                pos_data = json.load(f)
                x = pos_data.get('x', 100)
                y = pos_data.get('y', 100)
                w = pos_data.get('w', 900)
                h = pos_data.get('h', 600)
                root.geometry(f"{w}x{h}+{x}+{y}")
        else:
            # Center window on first run
            root.geometry("900x600")
            root.update_idletasks()
            x = (root.winfo_screenwidth() // 2) - (900 // 2)
            y = (root.winfo_screenheight() // 2) - (600 // 2)
            root.geometry(f"900x600+{x}+{y}")
    except:
        # Fallback to center
        root.geometry("900x600")
        root.update_idletasks()
        x = (root.winfo_screenwidth() // 2) - (900 // 2)
        y = (root.winfo_screenheight() // 2) - (600 // 2)
        root.geometry(f"900x600+{x}+{y}")
    
    # Make window stay on top
    root.attributes('-topmost', True)
    
    # Custom fonts
    title_font = tkfont.Font(family="Arial", size=16, weight="bold")
    text_font = tkfont.Font(family="Arial", size=12)
    
    # Main frame
    main_frame = tk.Frame(root, bg=bg_color, padx=30, pady=20)
    main_frame.pack(fill=tk.BOTH, expand=True)
    
    # Title with gradient effect
    title_frame = tk.Frame(main_frame, bg=bg_color)
    title_frame.pack(fill=tk.X, pady=(0, 20))
    
    # Create colorful text effect
    colors = [accent_color, accent2_color, accent3_color]
    words = ["Claude", "Code", "Decision"]
    
    for word, color in zip(words, colors):
        label = tk.Label(
            title_frame,
            text=word,
            font=tkfont.Font(family="Arial", size=18, weight="bold"),
            bg=bg_color,
            fg=color
        )
        label.pack(side=tk.LEFT, padx=3)
    
    title_label = tk.Label(
        title_frame,
        text="Decision Required",
        font=title_font,
        bg=bg_color,
        fg=fg_color
    )
    title_label.pack(side=tk.LEFT, padx=10)
    
    # Context text
    text_frame = tk.Frame(main_frame, bg=bg_color)
    text_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
    
    text_widget = tk.Text(
        text_frame,
        wrap=tk.WORD,
        height=10,
        font=text_font,
        bg=input_bg,
        fg=fg_color,
        insertbackground=fg_color,
        relief=tk.FLAT,
        padx=15,
        pady=15
    )
    text_widget.pack(fill=tk.BOTH, expand=True)
    
    # Format and insert context
    full_context = context
    if default:
        full_context += f"\n\nDefault: {default}"
    text_widget.insert("1.0", full_context)
    text_widget.config(state=tk.DISABLED)
    
    # Create options section if options provided
    if options:
        options_frame = tk.Frame(main_frame, bg=bg_color)
        options_frame.pack(fill=tk.X, pady=(0, 15))
        
        options_label = tk.Label(
            options_frame,
            text="Select an option:",
            font=tkfont.Font(family="Arial", size=11, weight="bold"),
            bg=bg_color,
            fg="#89dceb"
        )
        options_label.pack(anchor=tk.W, pady=(0, 10))
        
        # Create radio buttons for options
        selected_option = tk.StringVar(value="")
        
        for i, opt in enumerate(options, 1):
            opt_frame = tk.Frame(options_frame, bg=bg_color)
            opt_frame.pack(fill=tk.X, pady=2)
            
            rb = tk.Radiobutton(
                opt_frame,
                text=f"{i}. {opt}",
                variable=selected_option,
                value=opt,
                bg=bg_color,
                fg=fg_color,
                activebackground=bg_color,
                activeforeground=accent3_color,
                selectcolor=bg_color,
                font=text_font,
                bd=0,
                highlightthickness=0,
                padx=5,
                indicatoron=True,
                command=lambda v=opt: result.set(v)
            )
            rb.pack(anchor=tk.W)
            
            # Keyboard shortcut for number keys
            if i <= 9:
                root.bind(str(i), lambda e, v=opt, r=rb: (r.select(), result.set(v)))
        
        # Or divider
        or_label = tk.Label(
            main_frame,
            text="— or enter a custom response —",
            font=tkfont.Font(family="Arial", size=10, style="italic"),
            bg=bg_color,
            fg="#a6adc8"
        )
        or_label.pack(pady=(0, 15))
    
    # Thinking mode section
    thinking_frame = tk.Frame(main_frame, bg=bg_color)
    thinking_frame.pack(fill=tk.X, pady=(0, 15))
    
    # Thinking mode header with description
    header_frame = tk.Frame(thinking_frame, bg=bg_color)
    header_frame.pack(fill=tk.X, pady=(0, 10))
    
    thinking_label = tk.Label(
        header_frame,
        text="Thinking Mode:",
        font=tkfont.Font(family="Arial", size=11, weight="bold"),
        bg=bg_color,
        fg=accent_color
    )
    thinking_label.pack(side=tk.LEFT)
    
    # Current mode indicator
    current_mode_label = tk.Label(
        header_frame,
        text="",
        font=tkfont.Font(family="Arial", size=10, weight="bold"),
        bg=bg_color,
        fg=accent3_color
    )
    current_mode_label.pack(side=tk.LEFT, padx=(10, 0))
    
    mode_desc = tk.Label(
        header_frame,
        text="(affects response depth and speed)",
        font=tkfont.Font(family="Arial", size=9),
        bg=bg_color,
        fg="#a6adc8"
    )
    mode_desc.pack(side=tk.LEFT, padx=(10, 0))
    
    # Radio buttons for thinking modes
    # Load saved preference
    pref_file = os.path.join(os.path.dirname(__file__), ".thinking_mode_preference")
    default_mode = "normal"
    try:
        if os.path.exists(pref_file):
            with open(pref_file, 'r') as f:
                saved_mode = f.read().strip()
                if saved_mode in ["normal", "deep", "ultra", "quick"]:
                    default_mode = saved_mode
                    # print(f"DEBUG: Loaded saved thinking mode: {saved_mode}", file=sys.stderr)
    except Exception as e:
        # print(f"DEBUG: Error loading thinking mode: {e}", file=sys.stderr)
        pass
    
    thinking_mode = tk.StringVar(value=default_mode)
    
    modes = [
        ("[Q] Quick", "quick", "Fast response (less thorough)", "#f9e2af"),
        ("[N] Normal", "normal", "Standard thinking", "#89dceb"),
        ("[D] Deep Think", "deep", "Extended analysis (slower)", "#89b4fa"),
        ("[U] Ultra Think", "ultra", "Maximum depth (slowest)", "#f38ba8")
    ]
    
    radio_frame = tk.Frame(thinking_frame, bg=bg_color)
    radio_frame.pack(anchor=tk.W)
    
    # Store radio buttons and frames for styling
    radio_buttons = []
    radio_frames = {}
    
    for text, value, tooltip, color in modes:
        # Create frame for each radio button with border
        rb_frame = tk.Frame(radio_frame, bg=bg_color, highlightbackground=bg_color, highlightthickness=2)
        rb_frame.pack(side=tk.LEFT, padx=(0, 10))
        radio_frames[value] = rb_frame
        
        rb = tk.Radiobutton(
            rb_frame,
            text=text,
            variable=thinking_mode,
            value=value,
            bg=bg_color,
            fg=color,
            activebackground=bg_color,
            activeforeground=color,
            selectcolor=bg_color,  # Background color for selected indicator
            font=tkfont.Font(family="Arial", size=11),
            bd=0,
            highlightthickness=0,
            padx=10,
            pady=5,
            indicatoron=True  # Show standard radio button
        )
        rb.pack()
        radio_buttons.append((rb, value, color))
    
    # Update mode indicator when selection changes
    def update_mode_indicator(*args):
        mode = thinking_mode.get()
        mode_text = {
            'quick': 'Quick Mode',
            'normal': 'Normal Mode', 
            'deep': 'Deep Mode',
            'ultra': 'Ultra Mode'
        }.get(mode, mode)
        current_mode_label.config(text=f"[{mode_text}]")
        
        # Update frame borders to show selection
        for value, frame in radio_frames.items():
            if value == mode:
                frame.config(highlightbackground=accent3_color, highlightthickness=2)
            else:
                frame.config(highlightbackground=bg_color, highlightthickness=2)
        
        # Also save preference on change
        try:
            with open(pref_file, 'w') as f:
                f.write(mode)
                # print(f"DEBUG: Saved thinking mode preference: {mode}", file=sys.stderr)
        except Exception as e:
            # print(f"DEBUG: Error saving thinking mode: {e}", file=sys.stderr)
            pass
    
    thinking_mode.trace('w', update_mode_indicator)
    update_mode_indicator()  # Set initial state
    
    # Input section
    input_frame = tk.Frame(main_frame, bg=bg_color)
    input_frame.pack(fill=tk.X, pady=(0, 20))
    
    # Result variable
    result = tk.StringVar(value=default)
    
    # Input header with history button
    input_header = tk.Frame(input_frame, bg=bg_color)
    input_header.pack(fill=tk.X, pady=(0, 5))
    
    input_label = tk.Label(
        input_header,
        text="Your response:",
        font=text_font,
        bg=bg_color,
        fg="#f9e2af"  # Yellow accent
    )
    input_label.pack(side=tk.LEFT)
    
    # History dropdown
    recent_history = history.get_recent(5)
    if recent_history:
        history_btn = tk.Menubutton(
            input_header,
            text="Recent ▼",
            bg=button_bg,
            fg=fg_color,
            font=tkfont.Font(size=10),
            relief=tk.FLAT,
            cursor="hand2",
            padx=10,
            pady=3
        )
        history_btn.pack(side=tk.RIGHT)
        
        history_menu = tk.Menu(history_btn, tearoff=0, bg=input_bg, fg=fg_color)
        history_btn.config(menu=history_menu)
        
        for item in recent_history:
            resp = item['response'][:40] + "..." if len(item['response']) > 40 else item['response']
            history_menu.add_command(
                label=resp,
                command=lambda r=item['response']: result.set(r)
            )
    
    # Input entry with custom styling
    entry = tk.Entry(
        input_frame,
        textvariable=result,
        font=text_font,
        bg=input_bg,
        fg=fg_color,
        insertbackground=accent_color,
        relief=tk.FLAT,
        bd=0
    )
    entry.pack(fill=tk.X, ipady=10, ipadx=10)
    entry.focus_set()
    entry.select_range(0, tk.END)
    
    # Button frame
    button_frame = tk.Frame(main_frame, bg=bg_color)
    button_frame.pack(fill=tk.X)
    
    # Style for buttons
    def on_enter(e):
        e.widget.config(bg=button_hover)
    
    def on_leave(e):
        e.widget.config(bg=button_bg)
    
    # Save window position
    def save_position():
        try:
            pos_data = {
                'x': root.winfo_x(),
                'y': root.winfo_y(),
                'w': root.winfo_width(),
                'h': root.winfo_height()
            }
            with open(position_file, 'w') as f:
                json.dump(pos_data, f)
        except:
            pass  # Ignore save errors
    
    # Submit function
    def submit():
        save_position()
        # Save thinking mode preference
        mode = thinking_mode.get()
        try:
            with open(pref_file, 'w') as f:
                f.write(mode)
        except:
            pass
        # Save to history
        response = result.get()
        if response and response != "CANCELLED":
            history.add_entry(response, context, mode)
        # Output format: response|||thinking_mode
        output = f"{response}|||{mode}"
        print(output)
        root.quit()
    
    def cancel():
        save_position()
        print("CANCELLED")
        root.quit()
    
    # Submit button with gradient effect
    submit_btn = tk.Button(
        button_frame,
        text="Submit",
        command=submit,
        bg=accent3_color,  # Green
        fg=bg_color,
        font=tkfont.Font(family="Arial", size=12, weight="bold"),
        relief=tk.FLAT,
        padx=40,
        pady=12,
        cursor="hand2",
        activebackground="#b4e7af",
        bd=0
    )
    submit_btn.pack(side=tk.RIGHT, padx=(10, 0))
    
    # Cancel button
    cancel_btn = tk.Button(
        button_frame,
        text="Cancel",
        command=cancel,
        bg=button_bg,
        fg=fg_color,
        font=text_font,
        relief=tk.FLAT,
        padx=30,
        pady=10,
        cursor="hand2"
    )
    cancel_btn.pack(side=tk.RIGHT)
    
    # Bind enter key to submit
    root.bind('<Return>', lambda e: submit())
    root.bind('<Escape>', lambda e: cancel())
    
    # Keyboard shortcuts for thinking modes
    root.bind('q', lambda e: thinking_mode.set('quick'))
    root.bind('Q', lambda e: thinking_mode.set('quick'))
    root.bind('n', lambda e: thinking_mode.set('normal'))
    root.bind('N', lambda e: thinking_mode.set('normal'))
    root.bind('d', lambda e: thinking_mode.set('deep'))
    root.bind('D', lambda e: thinking_mode.set('deep'))
    root.bind('u', lambda e: thinking_mode.set('ultra'))
    root.bind('U', lambda e: thinking_mode.set('ultra'))
    
    # Add hover effects
    cancel_btn.bind("<Enter>", on_enter)
    cancel_btn.bind("<Leave>", on_leave)
    
    # Run
    root.mainloop()
    root.destroy()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        show_dialog(sys.argv[1])
    else:
        print("ERROR: No input provided")
        sys.exit(1)