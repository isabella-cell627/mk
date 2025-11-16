class ShortcutManager {
    constructor(editor, sessionManager) {
        this.editor = editor;
        this.sessionManager = sessionManager;
        this.shortcuts = new Map();
        
        this.init();
    }

    init() {
        this.registerShortcuts();
        document.addEventListener('keydown', (e) => this.handleShortcut(e));
    }

    registerShortcuts() {
        this.shortcuts.set('ctrl+s', () => {
            this.sessionManager.save();
            return true;
        });
        
        this.shortcuts.set('ctrl+shift+s', () => {
            this.sessionManager.saveAs();
            return true;
        });
        
        this.shortcuts.set('ctrl+o', () => {
            this.sessionManager.open();
            return true;
        });
        
        this.shortcuts.set('ctrl+n', () => {
            this.sessionManager.newSession();
            return true;
        });
        
        this.shortcuts.set('ctrl+t', () => {
            this.sessionManager.newSession();
            return true;
        });
        
        this.shortcuts.set('ctrl+z', () => {
            return this.editor.undo();
        });
        
        this.shortcuts.set('ctrl+y', () => {
            return this.editor.redo();
        });
        
        this.shortcuts.set('ctrl+shift+z', () => {
            return this.editor.redo();
        });
        
        this.shortcuts.set('ctrl+b', () => {
            this.editor.applyFormat('bold');
            return true;
        });
        
        this.shortcuts.set('ctrl+i', () => {
            this.editor.applyFormat('italic');
            return true;
        });
        
        this.shortcuts.set('ctrl+k', () => {
            this.editor.applyFormat('link');
            return true;
        });
        
        this.shortcuts.set('ctrl+p', () => {
            if (window.previewManager) {
                window.previewManager.toggle();
            }
            return true;
        });
        
        this.shortcuts.set('ctrl+shift+d', () => {
            if (window.themeManager) {
                window.themeManager.toggle();
            }
            return true;
        });
        
        this.shortcuts.set('ctrl+shift+t', () => {
            this.editor.toggleDirection();
            return true;
        });
        
        this.shortcuts.set('ctrl+1', () => {
            this.editor.applyHeading('h1');
            return true;
        });
        
        this.shortcuts.set('ctrl+2', () => {
            this.editor.applyHeading('h2');
            return true;
        });
        
        this.shortcuts.set('ctrl+3', () => {
            this.editor.applyHeading('h3');
            return true;
        });
        
        this.shortcuts.set('ctrl+4', () => {
            this.editor.applyHeading('h4');
            return true;
        });
        
        this.shortcuts.set('ctrl+5', () => {
            this.editor.applyHeading('h5');
            return true;
        });
        
        this.shortcuts.set('ctrl+6', () => {
            this.editor.applyHeading('h6');
            return true;
        });
    }

    handleShortcut(e) {
        const key = this.getShortcutKey(e);
        const handler = this.shortcuts.get(key);
        
        if (handler) {
            const preventDefault = handler();
            if (preventDefault) {
                e.preventDefault();
            }
        }
    }

    getShortcutKey(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        
        const key = e.key.toLowerCase();
        parts.push(key);
        
        return parts.join('+');
    }
}

window.ShortcutManager = ShortcutManager;
