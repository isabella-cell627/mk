class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.codemirrorSetup = null;
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupToggle();
    }

    setCodemirrorSetup(setup) {
        this.codemirrorSetup = setup;
        this.setTheme(this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        const lightHighlight = document.getElementById('highlight-light');
        const darkHighlight = document.getElementById('highlight-dark');
        
        if (theme === 'dark') {
            lightHighlight.disabled = true;
            darkHighlight.disabled = false;
        } else {
            lightHighlight.disabled = false;
            darkHighlight.disabled = true;
        }

        if (this.codemirrorSetup) {
            this.codemirrorSetup.setTheme(theme);
        }
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }

    setupToggle() {
        const toggle = document.getElementById('themeToggle');
        toggle.addEventListener('click', () => this.toggle());
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const editorElement = document.getElementById('editor');
    const previewElement = document.getElementById('preview');
    
    window.themeManager = new ThemeManager();
    
    window.codemirrorSetup = new CodeMirrorSetup();
    
    const editorContainer = editorElement.parentElement;
    editorElement.style.display = 'none';
    
    await window.codemirrorSetup.init(editorContainer);
    
    window.editorManager = window.codemirrorSetup;
    
    window.previewManager = new PreviewManager(previewElement);
    
    window.resizerManager = new ResizerManager();
    
    window.sessionManager = new SessionManager(window.editorManager);
    
    window.shortcutManager = new ShortcutManager(window.editorManager, window.sessionManager);
    
    window.advancedFeatures = new AdvancedFeaturesManager();
    window.advancedFeatures.setCodemirrorSetup(window.codemirrorSetup);
    
    window.spellCheckManager = new SpellCheckManager();
    window.spellCheckManager.setCodemirrorSetup(window.codemirrorSetup);
    
    window.themeManager.setCodemirrorSetup(window.codemirrorSetup);
    
    window.contentEmbedding = new ContentEmbedding();
    
    window.toolbarManager = new ToolbarManager();
    
    document.getElementById('newBtn').addEventListener('click', () => {
        window.sessionManager.newSession();
    });
    
    document.getElementById('openBtn').addEventListener('click', () => {
        window.sessionManager.open();
    });
    
    document.getElementById('saveBtn').addEventListener('click', () => {
        window.sessionManager.save();
    });
    
    document.getElementById('saveAsBtn').addEventListener('click', () => {
        window.sessionManager.saveAs();
    });
    
    document.getElementById('undoBtn').addEventListener('click', () => {
        window.editorManager.undo();
    });
    
    document.getElementById('redoBtn').addEventListener('click', () => {
        window.editorManager.redo();
    });
    
    document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            window.editorManager.applyFormat(action);
        });
    });
    
    document.getElementById('headingSelect').addEventListener('change', (e) => {
        const level = e.target.value;
        if (level) {
            window.editorManager.applyHeading(level);
            e.target.value = '';
        }
    });
    
    document.getElementById('textDirectionBtn').addEventListener('click', () => {
        window.editorManager.toggleDirection();
    });
    
    document.getElementById('previewToggle').addEventListener('click', () => {
        window.previewManager.toggle();
    });
    
    document.querySelectorAll('[data-export]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const format = link.getAttribute('data-export');
            window.sessionManager.exportFile(format);
        });
    });
    
    document.getElementById('newTabBtn').addEventListener('click', () => {
        window.sessionManager.newSession();
    });
    
    window.editorManager.updateStats();
    window.previewManager.update('');
    
    console.log('Markdown Editor Pro initialized successfully!');
});
