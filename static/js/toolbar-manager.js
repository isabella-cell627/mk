class ToolbarManager {
    constructor() {
        this.toolbarVisible = true;
        this.toolbarFloating = false;
        this.customToolbars = [];
        this.defaultButtons = [
            { id: 'new', icon: 'file', label: 'New', action: 'createNew' },
            { id: 'open', icon: 'folder-open', label: 'Open', action: 'openFile' },
            { id: 'save', icon: 'save', label: 'Save', action: 'saveFile' },
            { id: 'save-as', icon: 'copy', label: 'Save As', action: 'saveAs' },
            { id: 'undo', icon: 'rotate-ccw', label: 'Undo', action: 'undo' },
            { id: 'redo', icon: 'rotate-cw', label: 'Redo', action: 'redo' },
            { id: 'bold', icon: 'bold', label: 'Bold', action: 'formatBold' },
            { id: 'italic', icon: 'italic', label: 'Italic', action: 'formatItalic' },
            { id: 'strikethrough', icon: 'minus', label: 'Strikethrough', action: 'formatStrike' },
            { id: 'code', icon: 'code', label: 'Code', action: 'insertCode' },
            { id: 'link', icon: 'link', label: 'Link', action: 'insertLink' },
            { id: 'image', icon: 'image', label: 'Image', action: 'insertImage' },
            { id: 'list-ul', icon: 'list', label: 'Bullet List', action: 'insertBulletList' },
            { id: 'list-ol', icon: 'hash', label: 'Numbered List', action: 'insertNumberedList' }
        ];
        
        this.activeButtons = [...this.defaultButtons];
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupToolbarControls();
        console.log('Toolbar Manager initialized');
    }
    
    loadSettings() {
        const settings = localStorage.getItem('toolbarSettings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                this.toolbarVisible = parsed.visible !== false;
                this.toolbarFloating = parsed.floating || false;
                this.activeButtons = parsed.activeButtons || this.defaultButtons;
            } catch (e) {
                console.error('Failed to load toolbar settings:', e);
            }
        }
    }
    
    saveSettings() {
        const settings = {
            visible: this.toolbarVisible,
            floating: this.toolbarFloating,
            activeButtons: this.activeButtons
        };
        localStorage.setItem('toolbarSettings', JSON.stringify(settings));
    }
    
    setupToolbarControls() {
        
    }
    
    toggleVisibility() {
        this.toolbarVisible = !this.toolbarVisible;
        this.applySettings();
        this.saveSettings();
    }
    
    toggleFloating() {
        this.toolbarFloating = !this.toolbarFloating;
        this.applySettings();
        this.saveSettings();
    }
    
    applySettings() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;
        
        if (this.toolbarVisible) {
            toolbar.style.display = 'flex';
        } else {
            toolbar.style.display = 'none';
        }
        
        if (this.toolbarFloating) {
            toolbar.classList.add('floating-toolbar');
        } else {
            toolbar.classList.remove('floating-toolbar');
        }
        
        this.renderToolbar();
    }
    
    renderToolbar() {
        
    }
    
    createToolbarButton(button) {
        const btn = document.createElement('button');
        btn.className = 'toolbar-btn';
        btn.id = `toolbar-${button.id}`;
        btn.title = button.label;
        btn.innerHTML = `<i data-feather="${button.icon}"></i>`;
        
        btn.onclick = (e) => {
            e.preventDefault();
            this.executeAction(button.action);
        };
        
        return btn;
    }
    
    executeAction(action) {
        if (window.markdownEditor && typeof window.markdownEditor[action] === 'function') {
            window.markdownEditor[action]();
        } else {
            console.warn(`Action ${action} not found`);
        }
    }
    
    showToolbarCustomizer() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content toolbar-customizer">
                <div class="modal-header">
                    <h2>Customize Toolbar</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i data-feather="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="toolbar-options">
                        <label>
                            <input type="checkbox" id="toolbar-floating-toggle" ${this.toolbarFloating ? 'checked' : ''}>
                            Floating Toolbar
                        </label>
                    </div>
                    
                    <h3>Available Buttons</h3>
                    <div class="button-list">
                        ${this.defaultButtons.map(btn => `
                            <label class="button-option">
                                <input type="checkbox" 
                                    value="${btn.id}" 
                                    ${this.activeButtons.find(ab => ab.id === btn.id) ? 'checked' : ''}>
                                <i data-feather="${btn.icon}"></i>
                                ${btn.label}
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="window.toolbarManager.saveCustomization(this)">
                            Save Changes
                        </button>
                        <button class="btn btn-tertiary" onclick="window.toolbarManager.resetToDefault()">
                            Reset to Default
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const floatingToggle = modal.querySelector('#toolbar-floating-toggle');
        floatingToggle.onchange = () => {
            this.toolbarFloating = floatingToggle.checked;
            this.applySettings();
        };
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    saveCustomization(button) {
        const modal = button.closest('.modal-overlay');
        const checkboxes = modal.querySelectorAll('.button-option input[type="checkbox"]:checked');
        
        this.activeButtons = Array.from(checkboxes).map(cb => {
            return this.defaultButtons.find(btn => btn.id === cb.value);
        }).filter(Boolean);
        
        this.saveSettings();
        this.renderToolbar();
        modal.remove();
        
        if (window.showNotification) {
            window.showNotification('Toolbar customization saved!', 'success');
        }
    }
    
    resetToDefault() {
        this.activeButtons = [...this.defaultButtons];
        this.toolbarFloating = false;
        this.toolbarVisible = true;
        
        this.saveSettings();
        this.applySettings();
        
        const modal = document.querySelector('.toolbar-customizer');
        if (modal) {
            modal.closest('.modal-overlay').remove();
        }
        
        if (window.showNotification) {
            window.showNotification('Toolbar reset to default!', 'success');
        }
    }
    
    createCustomToolbar(name, buttons) {
        const customToolbar = {
            id: Date.now().toString(),
            name: name,
            buttons: buttons
        };
        
        this.customToolbars.push(customToolbar);
        this.saveSettings();
        
        return customToolbar;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolbarManager;
}

window.ToolbarManager = ToolbarManager;
