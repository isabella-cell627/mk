class SessionManager {
    constructor(editor) {
        this.editor = editor;
        this.sessions = new Map();
        this.currentSessionId = 'default';
        this.autoSaveEnabled = false;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000;
        
        this.init();
    }

    init() {
        this.createSession('default', 'Untitled', '');
        this.loadAutoSavePreference();
        this.setupAutoSave();
    }

    createSession(id, name, content = '') {
        const session = {
            id: id,
            name: name,
            content: content,
            modified: false,
            savedFilename: null,
            documentId: null,
            folderId: null,
            direction: 'ltr'
        };
        
        this.sessions.set(id, session);
        this.addTab(session);
        
        return session;
    }

    addTab(session) {
        const tabsContainer = document.getElementById('tabsContainer');
        const newTabBtn = document.getElementById('newTabBtn');
        
        const existingTab = tabsContainer.querySelector(`[data-session-id="${session.id}"]`);
        if (existingTab) {
            return;
        }
        
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.dataset.sessionId = session.id;
        
        tabButton.innerHTML = `
            <span class="tab-name">${session.name}</span>
            <i class="fas fa-circle modified-indicator" style="display: none;"></i>
            <i class="fas fa-times tab-close"></i>
        `;
        
        tabButton.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                e.stopPropagation();
                this.closeSession(session.id);
            } else {
                this.switchSession(session.id);
            }
        });
        
        tabsContainer.insertBefore(tabButton, newTabBtn);
    }

    switchSession(sessionId) {
        const currentSession = this.sessions.get(this.currentSessionId);
        if (currentSession) {
            currentSession.content = this.editor.getContent();
            currentSession.direction = this.editor.currentDirection;
        }
        
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        this.currentSessionId = sessionId;
        this.editor.setContent(session.content);
        
        if (session.direction !== this.editor.currentDirection) {
            this.editor.toggleDirection();
        }
        
        this.updateTabs();
        this.updateStatus(`Switched to ${session.name}`);
    }

    closeSession(sessionId) {
        if (this.sessions.size <= 1) {
            this.updateStatus('Cannot close the last tab');
            return;
        }
        
        const session = this.sessions.get(sessionId);
        if (session && session.modified) {
            if (!confirm(`Close "${session.name}" without saving?`)) {
                return;
            }
        }
        
        this.sessions.delete(sessionId);
        
        const tab = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (tab) {
            tab.remove();
        }
        
        if (this.currentSessionId === sessionId) {
            const firstSessionId = this.sessions.keys().next().value;
            this.switchSession(firstSessionId);
        }
    }

    newSession() {
        const id = 'session-' + Date.now();
        const name = 'Untitled';
        const session = this.createSession(id, name, '');
        this.switchSession(id);
        this.updateStatus('New document created');
    }

    markModified() {
        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.modified = true;
            this.updateTabs();
        }
    }

    markSaved(filename = null) {
        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.modified = false;
            if (filename) {
                session.savedFilename = filename;
                session.name = filename;
            }
            this.updateTabs();
        }
    }

    updateTabs() {
        document.querySelectorAll('.tab-button').forEach(tab => {
            const sessionId = tab.dataset.sessionId;
            const session = this.sessions.get(sessionId);
            
            if (session) {
                const nameSpan = tab.querySelector('.tab-name');
                const indicator = tab.querySelector('.modified-indicator');
                
                nameSpan.textContent = session.name;
                indicator.style.display = session.modified ? 'inline' : 'none';
                
                if (sessionId === this.currentSessionId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            }
        });
    }

    getCurrentSession() {
        return this.sessions.get(this.currentSessionId);
    }

    async save() {
        const session = this.getCurrentSession();
        if (!session) return;
        
        const filename = session.savedFilename || await this.promptFilename();
        if (!filename) return;
        
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: filename,
                    content: this.editor.getContent(),
                    document_id: session.documentId,
                    folder_id: session.folderId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                session.documentId = result.document_id;
                this.markSaved(result.filename);
                this.updateStatus(`Saved as ${result.filename}`);
                
                if (window.fileManager) {
                    window.fileManager.loadDocuments(session.folderId);
                }
            } else {
                this.updateStatus(`Error: ${result.error}`, true);
            }
        } catch (error) {
            this.updateStatus(`Error saving file: ${error.message}`, true);
        }
    }

    async saveAs() {
        const filename = await this.promptFilename();
        if (!filename) return;
        
        const session = this.getCurrentSession();
        if (session) {
            session.savedFilename = filename;
        }
        
        await this.save();
    }

    promptFilename() {
        return new Promise((resolve) => {
            const modal = document.getElementById('saveAsModal');
            const input = document.getElementById('saveAsInput');
            const confirmBtn = document.getElementById('saveAsConfirm');
            const closeButtons = modal.querySelectorAll('.modal-close');
            
            const session = this.getCurrentSession();
            input.value = session.savedFilename || 'document.md';
            
            modal.classList.add('active');
            input.focus();
            input.select();
            
            const close = (filename = null) => {
                modal.classList.remove('active');
                resolve(filename);
            };
            
            const handleConfirm = () => {
                const filename = input.value.trim();
                if (filename) {
                    close(filename);
                }
            };
            
            confirmBtn.onclick = handleConfirm;
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    close();
                }
            };
            
            closeButtons.forEach(btn => {
                btn.onclick = () => close();
            });
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    close();
                }
            };
        });
    }

    async open() {
        try {
            const response = await fetch('/api/files');
            const result = await response.json();
            
            if (!result.success) {
                this.updateStatus(`Error: ${result.error}`, true);
                return;
            }
            
            this.showFileList(result.files);
        } catch (error) {
            this.updateStatus(`Error loading files: ${error.message}`, true);
        }
    }

    showFileList(files) {
        const modal = document.getElementById('openFileModal');
        const fileList = document.getElementById('fileList');
        const closeButtons = modal.querySelectorAll('.modal-close');
        
        modal.classList.add('active');
        
        if (files.length === 0) {
            fileList.innerHTML = '<p class="loading">No saved files found</p>';
        } else {
            fileList.innerHTML = files.map(file => `
                <div class="file-item" data-filename="${file.filename}" data-document-id="${file.document_id || ''}">
                    <div class="file-info">
                        <div class="file-name">
                            ${file.is_pinned ? '<i class="fas fa-thumbtack" style="color: var(--warning); margin-right: 0.5rem;"></i>' : ''}
                            ${file.is_favorite ? '<i class="fas fa-heart" style="color: var(--danger); margin-right: 0.5rem;"></i>' : ''}
                            ${file.filename}
                        </div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.size)} · Modified ${this.formatDate(file.modified)}
                        </div>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `).join('');
            
            fileList.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', () => {
                    const documentId = item.dataset.documentId;
                    const filename = item.dataset.filename;
                    this.openFile(filename, documentId || null);
                    modal.classList.remove('active');
                });
            });
        }
        
        closeButtons.forEach(btn => {
            btn.onclick = () => modal.classList.remove('active');
        });
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    }

    async openFile(filename, documentId = null) {
        try {
            const requestData = documentId ? { document_id: documentId } : { filename: filename };
            
            const response = await fetch('/api/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const id = 'session-' + Date.now();
                const session = this.createSession(id, result.filename, result.content);
                session.savedFilename = result.filename;
                session.documentId = result.document_id;
                if (result.document) {
                    session.folderId = result.document.folder_id;
                }
                this.switchSession(id);
                this.updateStatus(`Opened ${result.filename}`);
            } else {
                this.updateStatus(`Error: ${result.error}`, true);
            }
        } catch (error) {
            this.updateStatus(`Error opening file: ${error.message}`, true);
        }
    }

    async exportFile(format) {
        const session = this.getCurrentSession();
        const filename = session.savedFilename || 'document.md';
        const content = this.editor.getContent();
        
        try {
            this.updateStatus(`Exporting as ${format.toUpperCase()}...`);
            
            const response = await fetch(`/api/export/${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename.replace('.md', '')}_export.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.updateStatus(`Exported as ${format.toUpperCase()}`);
            } else {
                const result = await response.json();
                this.updateStatus(`Export error: ${result.error}`, true);
            }
        } catch (error) {
            this.updateStatus(`Export error: ${error.message}`, true);
        }
    }

    setupAutoSave() {
        const toggle = document.getElementById('autoSaveToggle');
        toggle.checked = this.autoSaveEnabled;
        
        toggle.addEventListener('change', (e) => {
            this.autoSaveEnabled = e.target.checked;
            localStorage.setItem('autoSaveEnabled', this.autoSaveEnabled);
            
            if (this.autoSaveEnabled) {
                this.startAutoSave();
                this.updateStatus('Auto-save enabled');
            } else {
                this.stopAutoSave();
                this.updateStatus('Auto-save disabled');
            }
        });
        
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
    }

    loadAutoSavePreference() {
        const saved = localStorage.getItem('autoSaveEnabled');
        this.autoSaveEnabled = saved === 'true';
    }

    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            const session = this.getCurrentSession();
            if (session && session.modified && session.savedFilename) {
                this.save();
            }
        }, this.autoSaveDelay);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    updateStatus(message, isError = false) {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.style.color = isError ? 'var(--danger-color)' : 'var(--text-secondary)';
        
        if (!isError) {
            setTimeout(() => {
                statusEl.textContent = 'Ready';
                statusEl.style.color = 'var(--text-secondary)';
            }, 3000);
        }
    }
}

window.SessionManager = SessionManager;
