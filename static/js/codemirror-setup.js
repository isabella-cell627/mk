class CodeMirrorSetup {
    constructor() {
        this.editor = null;
        this.currentMode = 'default';
    }

    async init(container, initialContent = '') {
        await this.loadScripts();
        
        const textareaEl = document.getElementById('editor');
        
        this.editor = CodeMirror.fromTextArea(textareaEl, {
            mode: 'markdown',
            lineNumbers: true,
            lineWrapping: true,
            theme: 'default',
            autoCloseBrackets: true,
            matchBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Enter": "newlineAndIndentContinueMarkdownList",
                "Tab": function(cm) {
                    cm.replaceSelection("    ", "end");
                },
                "Ctrl-Q": function(cm) { cm.foldCode(cm.getCursor()); },
                "Ctrl-F": function(cm) {
                    window.advancedFeatures && window.advancedFeatures.openSearch();
                },
                "Alt-Click": "goFoldPointMouseDown",
                "Ctrl-D": "selectNextOccurrence"
            },
            highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
            styleActiveLine: true,
            showCursorWhenSelecting: true,
            selectionsMayTouch: true,
            configureMouse: function(cm, repeat, event) {
                if (event.altKey && event.button === 0) {
                    return {
                        unit: "rectangle",
                        extend: event.shiftKey,
                        addNew: event.ctrlKey || event.metaKey
                    };
                }
            }
        });

        this.editor.on('change', () => {
            this.onContentChange();
        });

        if (initialContent) {
            this.editor.setValue(initialContent);
        }

        this.editor.setSize('100%', '100%');
        this.updateStats();

        console.log('CodeMirror initialized with advanced features successfully!');
        return this.editor;
    }

    async loadScripts() {
        return new Promise((resolve, reject) => {
            if (typeof CodeMirror !== 'undefined') {
                resolve();
                return;
            }

            const cssLinks = [
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/monokai.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldgutter.css',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/dialog/dialog.css'
            ];

            cssLinks.forEach(href => {
                if (!document.querySelector(`link[href="${href}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = href;
                    document.head.appendChild(link);
                }
            });

            const scripts = [
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/markdown/markdown.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/mark-selection.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/search/searchcursor.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/search/search.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/dialog/dialog.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/foldgutter.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/fold/markdown-fold.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/scroll/annotatescrollbar.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/search/matchesonscrollbar.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/search/match-highlighter.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/keymap/vim.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/keymap/emacs.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/keymap/sublime.min.js'
            ];

            let loadedCount = 0;
            scripts.forEach((src, index) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        this.initializeMultipleCursors();
                        resolve();
                    }
                };
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });
    }

    initializeMultipleCursors() {
        if (typeof CodeMirror === 'undefined') return;

        CodeMirror.commands.selectNextOccurrence = function(cm) {
            const from = cm.getCursor("from");
            const to = cm.getCursor("to");
            const selectedText = cm.getRange(from, to);

            if (!selectedText) {
                const word = cm.findWordAt(from);
                cm.setSelection(word.anchor, word.head);
                return;
            }

            const cursor = cm.getSearchCursor(selectedText, to);
            if (cursor.findNext()) {
                cm.addSelection(cursor.from(), cursor.to());
            } else {
                const cursor = cm.getSearchCursor(selectedText, CodeMirror.Pos(0, 0));
                if (cursor.findNext()) {
                    cm.addSelection(cursor.from(), cursor.to());
                }
            }
        };
    }

    onContentChange() {
        if (window.previewManager) {
            window.previewManager.update(this.getContent());
        }
        if (window.sessionManager) {
            window.sessionManager.markModified();
        }
        this.updateStats();
    }

    updateStats() {
        const content = this.getContent();
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const lines = content.split('\n').length;

        document.getElementById('wordCount').textContent = `${words} word${words !== 1 ? 's' : ''}`;
        document.getElementById('charCount').textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        document.getElementById('lineCount').textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }

    setMode(mode) {
        if (!this.editor) return;

        const keymaps = {
            'vim': 'vim',
            'emacs': 'emacs',
            'sublime': 'sublime',
            'default': 'default'
        };

        if (mode !== 'default') {
            const originalKeyMap = keymaps[mode] || 'default';
            this.editor.setOption('keyMap', originalKeyMap);
            
            setTimeout(() => {
                this.preserveAppShortcuts(mode);
            }, 100);
        } else {
            this.editor.setOption('keyMap', 'default');
        }

        this.currentMode = mode;
        localStorage.setItem('editorMode', mode);
    }

    preserveAppShortcuts(mode) {
        if (!this.editor) return;

        CodeMirror.keyMap[mode + '_custom'] = {
            'Ctrl-S': function(cm) {
                document.getElementById('saveBtn').click();
                return false;
            },
            'Ctrl-N': function(cm) {
                document.getElementById('newBtn').click();
                return false;
            },
            'Ctrl-P': function(cm) {
                document.getElementById('previewToggle').click();
                return false;
            },
            fallthrough: mode
        };

        this.editor.setOption('keyMap', mode + '_custom');
    }

    setTheme(theme) {
        if (!this.editor) return;

        const themeName = theme === 'dark' ? 'dracula' : 'default';
        this.editor.setOption('theme', themeName);
    }

    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content);
            this.updateStats();
        }
    }

    insertText(text) {
        if (this.editor) {
            this.editor.replaceSelection(text);
            this.editor.focus();
        }
    }

    wrapText(prefix, suffix = prefix) {
        if (!this.editor) return;

        const selection = this.editor.getSelection();
        if (selection) {
            this.editor.replaceSelection(prefix + selection + suffix);
            const cursor = this.editor.getCursor();
            this.editor.setCursor({line: cursor.line, ch: cursor.ch - suffix.length});
        } else {
            const placeholder = 'text';
            this.editor.replaceSelection(prefix + placeholder + suffix);
            const cursor = this.editor.getCursor();
            this.editor.setSelection(
                {line: cursor.line, ch: cursor.ch - suffix.length - placeholder.length},
                {line: cursor.line, ch: cursor.ch - suffix.length}
            );
        }
        this.editor.focus();
    }

    applyFormat(action) {
        switch (action) {
            case 'bold':
                this.wrapText('**');
                break;
            case 'italic':
                this.wrapText('*');
                break;
            case 'strikethrough':
                this.wrapText('~~');
                break;
            case 'code-inline':
                this.wrapText('`');
                break;
            case 'code-block':
                this.insertText('\n```\ncode here\n```\n');
                break;
            case 'link':
                this.insertText('[link text](url)');
                break;
            case 'image':
                this.insertText('![alt text](image-url)');
                break;
            case 'ul':
                this.insertAtLineStart('- ');
                break;
            case 'ol':
                this.insertAtLineStart('1. ');
                break;
            case 'checklist':
                this.insertAtLineStart('- [ ] ');
                break;
            case 'quote':
                this.insertAtLineStart('> ');
                break;
            case 'hr':
                this.insertText('\n---\n');
                break;
            case 'table':
                this.insertText('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n');
                break;
        }
    }

    insertAtLineStart(prefix) {
        if (!this.editor) return;

        const cursor = this.editor.getCursor();
        const line = this.editor.getLine(cursor.line);

        if (line.startsWith(prefix)) {
            this.editor.replaceRange('', {line: cursor.line, ch: 0}, {line: cursor.line, ch: prefix.length});
        } else {
            this.editor.replaceRange(prefix, {line: cursor.line, ch: 0});
        }
        this.editor.focus();
    }

    applyHeading(level) {
        if (!level || !this.editor) return;
        
        const prefix = '#'.repeat(parseInt(level.charAt(1))) + ' ';
        this.insertAtLineStart(prefix);
    }

    undo() {
        if (this.editor) {
            this.editor.undo();
        }
    }

    redo() {
        if (this.editor) {
            this.editor.redo();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    clear() {
        this.setContent('');
    }

    destroy() {
        if (this.editor) {
            this.editor.toTextArea();
            this.editor = null;
        }
    }
}

window.CodeMirrorSetup = CodeMirrorSetup;
