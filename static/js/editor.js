class MarkdownEditor {
    constructor(editorElement) {
        this.editor = editorElement;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 100;
        this.isUpdating = false;
        this.currentDirection = 'ltr';
        
        this.init();
    }

    init() {
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.saveState();
    }

    handleInput() {
        if (!this.isUpdating) {
            this.updateStats();
            if (window.previewManager) {
                window.previewManager.update(this.editor.value);
            }
            if (window.sessionManager) {
                window.sessionManager.markModified();
            }
        }
    }

    handleKeydown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertText('    ');
        }
    }

    saveState() {
        const state = {
            content: this.editor.value,
            selectionStart: this.editor.selectionStart,
            selectionEnd: this.editor.selectionEnd
        };

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    restoreState(state) {
        this.isUpdating = true;
        this.editor.value = state.content;
        this.editor.setSelectionRange(state.selectionStart, state.selectionEnd);
        this.editor.focus();
        this.updateStats();
        if (window.previewManager) {
            window.previewManager.update(this.editor.value);
        }
        this.isUpdating = false;
    }

    updateStats() {
        const content = this.editor.value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        const lines = content.split('\n').length;

        document.getElementById('wordCount').textContent = `${words} word${words !== 1 ? 's' : ''}`;
        document.getElementById('charCount').textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        document.getElementById('lineCount').textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }

    getSelection() {
        return {
            start: this.editor.selectionStart,
            end: this.editor.selectionEnd,
            text: this.editor.value.substring(this.editor.selectionStart, this.editor.selectionEnd)
        };
    }

    insertText(text, offset = 0) {
        const selection = this.getSelection();
        const before = this.editor.value.substring(0, selection.start);
        const after = this.editor.value.substring(selection.end);
        
        this.editor.value = before + text + after;
        
        const newPosition = selection.start + text.length + offset;
        this.editor.setSelectionRange(newPosition, newPosition);
        this.editor.focus();
        
        this.saveState();
        this.handleInput();
    }

    wrapText(prefix, suffix = prefix) {
        const selection = this.getSelection();
        
        if (selection.text) {
            const wrapped = prefix + selection.text + suffix;
            this.replaceSelection(wrapped);
            this.editor.setSelectionRange(
                selection.start + prefix.length,
                selection.end + prefix.length
            );
        } else {
            const placeholder = 'text';
            const wrapped = prefix + placeholder + suffix;
            this.insertText(wrapped, -suffix.length - placeholder.length);
        }
        
        this.editor.focus();
    }

    replaceSelection(text) {
        const selection = this.getSelection();
        const before = this.editor.value.substring(0, selection.start);
        const after = this.editor.value.substring(selection.end);
        
        this.editor.value = before + text + after;
        this.saveState();
        this.handleInput();
    }

    insertAtLineStart(prefix) {
        const selection = this.getSelection();
        const lines = this.editor.value.split('\n');
        const currentLineIndex = this.editor.value.substring(0, selection.start).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];
        
        if (currentLine.startsWith(prefix)) {
            lines[currentLineIndex] = currentLine.substring(prefix.length);
        } else {
            lines[currentLineIndex] = prefix + currentLine;
        }
        
        this.editor.value = lines.join('\n');
        this.saveState();
        this.handleInput();
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
                this.insertText('\n```\ncode here\n```\n', -5);
                break;
            case 'link':
                this.insertText('[link text](url)', -4);
                break;
            case 'image':
                this.insertText('![alt text](image-url)', -13);
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

    applyHeading(level) {
        if (!level) {
            return;
        }
        const prefix = '#'.repeat(parseInt(level.charAt(1))) + ' ';
        this.insertAtLineStart(prefix);
    }

    toggleDirection() {
        this.currentDirection = this.currentDirection === 'ltr' ? 'rtl' : 'ltr';
        this.editor.setAttribute('dir', this.currentDirection);
        
        const icon = document.querySelector('#textDirectionBtn i');
        icon.className = this.currentDirection === 'rtl' ? 'fas fa-align-right' : 'fas fa-align-left';
        
        if (window.previewManager) {
            window.previewManager.setDirection(this.currentDirection);
        }
        
        return this.currentDirection;
    }

    getContent() {
        return this.editor.value;
    }

    setContent(content) {
        this.isUpdating = true;
        this.editor.value = content;
        this.history = [];
        this.historyIndex = -1;
        this.saveState();
        this.updateStats();
        if (window.previewManager) {
            window.previewManager.update(content);
        }
        this.isUpdating = false;
    }

    clear() {
        this.setContent('');
    }
}

window.MarkdownEditor = MarkdownEditor;
