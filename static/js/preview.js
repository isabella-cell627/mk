class PreviewManager {
    constructor(previewElement) {
        this.preview = previewElement;
        this.isVisible = true;
        this.currentDirection = 'ltr';
        this.debounceTimer = null;
        this.debounceDelay = 300;
        
        this.configureMarked();
    }

    configureMarked() {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: true,
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }

    update(content) {
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            if (content.trim()) {
                try {
                    let html = marked.parse(content);
                    
                    if (window.contentEmbedding) {
                        html = window.contentEmbedding.processEmbeds(html);
                    }
                    
                    this.preview.innerHTML = html;
                    
                    this.preview.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                } catch (error) {
                    console.error('Markdown parsing error:', error);
                    this.preview.innerHTML = '<p class="preview-placeholder">Error rendering preview</p>';
                }
            } else {
                this.preview.innerHTML = '<p class="preview-placeholder">Preview will appear here...</p>';
            }
        }, this.debounceDelay);
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const container = document.getElementById('previewContainer');
        const resizer = document.getElementById('resizer');
        const toggleBtn = document.getElementById('previewToggle');
        
        if (this.isVisible) {
            container.classList.remove('hidden');
            resizer.classList.remove('hidden');
            toggleBtn.classList.add('toggle-active');
        } else {
            container.classList.add('hidden');
            resizer.classList.add('hidden');
            toggleBtn.classList.remove('toggle-active');
        }
        
        return this.isVisible;
    }

    setDirection(direction) {
        this.currentDirection = direction;
        this.preview.setAttribute('dir', direction);
    }

    getHTML() {
        return this.preview.innerHTML;
    }
}

class ResizerManager {
    constructor() {
        this.resizer = document.getElementById('resizer');
        this.editorContainer = document.getElementById('editorContainer');
        this.previewContainer = document.getElementById('previewContainer');
        this.isResizing = false;
        
        this.init();
    }

    init() {
        this.resizer.addEventListener('mousedown', (e) => this.startResize(e));
        document.addEventListener('mousemove', (e) => this.resize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }

    startResize(e) {
        this.isResizing = true;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }

    resize(e) {
        if (!this.isResizing) return;

        const containerWidth = this.editorContainer.parentElement.offsetWidth;
        const newEditorWidth = (e.clientX / containerWidth) * 100;

        if (newEditorWidth > 20 && newEditorWidth < 80) {
            this.editorContainer.style.flex = `0 0 ${newEditorWidth}%`;
            this.previewContainer.style.flex = `0 0 ${100 - newEditorWidth}%`;
        }
    }

    stopResize() {
        this.isResizing = false;
        document.body.style.cursor = 'default';
    }
}

window.PreviewManager = PreviewManager;
window.ResizerManager = ResizerManager;
