class FileManager {
    constructor() {
        this.folders = [];
        this.documents = [];
        this.tags = [];
        this.categories = [];
        this.currentFolder = null;
        this.currentDocument = null;
        this.init();
    }

    async init() {
        await Promise.all([
            this.loadFolders(),
            this.loadTags(),
            this.loadCategories(),
            this.loadDocuments()
        ]);
        this.renderSidebar();
        this.setupEventListeners();
    }

    async loadFolders() {
        try {
            const response = await fetch('/api/folders');
            const result = await response.json();
            if (result.success) {
                this.folders = result.folders;
            }
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    }

    async loadDocuments(folderId = null) {
        try {
            const url = folderId !== null ? `/api/documents?folder_id=${folderId}` : '/api/documents';
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            const result = await response.json();
            if (result.success) {
                this.tags = result.tags;
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const result = await response.json();
            if (result.success) {
                this.categories = result.categories;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderSidebar() {
        const sidebar = document.getElementById('fileSidebar');
        if (!sidebar) return;

        const foldersHtml = this.renderFolderTree(this.folders);
        
        sidebar.innerHTML = `
            <div class="sidebar-section">
                <div class="sidebar-header">
                    <h3><i class="fas fa-folder"></i> Folders</h3>
                    <button class="btn-icon" onclick="fileManager.createFolder()" title="New Folder">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                </div>
                <div class="folder-tree">
                    ${foldersHtml || '<p class="empty-state">No folders yet</p>'}
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-header">
                    <h3><i class="fas fa-star"></i> Quick Access</h3>
                </div>
                <div class="quick-links">
                    <a href="#" class="quick-link" onclick="fileManager.showRecent(); return false;">
                        <i class="fas fa-clock"></i>
                        <span>Recent Files</span>
                    </a>
                    <a href="#" class="quick-link" onclick="fileManager.showFavorites(); return false;">
                        <i class="fas fa-heart"></i>
                        <span>Favorites</span>
                    </a>
                    <a href="#" class="quick-link" onclick="fileManager.showPinned(); return false;">
                        <i class="fas fa-thumbtack"></i>
                        <span>Pinned</span>
                    </a>
                    <a href="#" class="quick-link" onclick="fileManager.showAllDocuments(); return false;">
                        <i class="fas fa-file-alt"></i>
                        <span>All Documents</span>
                    </a>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-header">
                    <h3><i class="fas fa-tags"></i> Tags</h3>
                    <button class="btn-icon" onclick="fileManager.createTag()" title="New Tag">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="tags-list">
                    ${this.renderTags()}
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-header">
                    <h3><i class="fas fa-bookmark"></i> Categories</h3>
                    <button class="btn-icon" onclick="fileManager.createCategory()" title="New Category">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="categories-list">
                    ${this.renderCategories()}
                </div>
            </div>
        `;
    }

    renderFolderTree(folders, level = 0) {
        if (!folders || folders.length === 0) return '';
        
        return folders.map(folder => `
            <div class="folder-item" data-folder-id="${folder.id}" style="padding-left: ${level * 20}px;">
                <div class="folder-content" onclick="fileManager.selectFolder(${folder.id})">
                    <i class="fas fa-${folder.icon}" style="color: ${folder.color}"></i>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">${folder.document_count}</span>
                </div>
                <div class="folder-actions">
                    <button class="btn-icon-sm" onclick="fileManager.editFolder(${folder.id}); event.stopPropagation();" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon-sm" onclick="fileManager.deleteFolder(${folder.id}); event.stopPropagation();" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ${folder.children && folder.children.length > 0 ? this.renderFolderTree(folder.children, level + 1) : ''}
            </div>
        `).join('');
    }

    renderTags() {
        if (this.tags.length === 0) {
            return '<p class="empty-state">No tags yet</p>';
        }
        
        return this.tags.map(tag => `
            <div class="tag-item" onclick="fileManager.filterByTag(${tag.id})">
                <span class="tag-badge" style="background-color: ${tag.color}">${tag.name}</span>
                <span class="tag-count">${tag.document_count}</span>
                <button class="btn-icon-sm" onclick="fileManager.deleteTag(${tag.id}); event.stopPropagation();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderCategories() {
        if (this.categories.length === 0) {
            return '<p class="empty-state">No categories yet</p>';
        }
        
        return this.categories.map(cat => `
            <div class="category-item" onclick="fileManager.filterByCategory(${cat.id})">
                <i class="fas fa-${cat.icon}" style="color: ${cat.color}"></i>
                <span class="category-name">${cat.name}</span>
                <span class="category-count">${cat.document_count}</span>
                <button class="btn-icon-sm" onclick="fileManager.deleteCategory(${cat.id}); event.stopPropagation();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderDocumentList() {
        const listContainer = document.getElementById('documentList');
        if (!listContainer) return;

        if (this.documents.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No documents found</p>';
            return;
        }

        listContainer.innerHTML = this.documents.map(doc => `
            <div class="document-card" onclick="fileManager.openDocument(${doc.id})">
                <div class="document-header">
                    <div class="document-title">
                        ${doc.is_pinned ? '<i class="fas fa-thumbtack" style="color: var(--primary);"></i>' : ''}
                        <i class="fas fa-file-alt"></i>
                        <span>${doc.filename}</span>
                    </div>
                    <div class="document-actions">
                        <button class="btn-icon-sm" onclick="fileManager.toggleFavorite(${doc.id}, ${doc.is_favorite}); event.stopPropagation();" title="${doc.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-heart ${doc.is_favorite ? 'active' : ''}"></i>
                        </button>
                        <button class="btn-icon-sm" onclick="fileManager.togglePin(${doc.id}, ${doc.is_pinned}); event.stopPropagation();" title="${doc.is_pinned ? 'Unpin' : 'Pin'}">
                            <i class="fas fa-thumbtack ${doc.is_pinned ? 'active' : ''}"></i>
                        </button>
                        <button class="btn-icon-sm" onclick="fileManager.deleteDocument(${doc.id}); event.stopPropagation();" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="document-meta">
                    <span><i class="fas fa-folder"></i> ${doc.folder_name || 'No folder'}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(doc.updated_at)}</span>
                    <span><i class="fas fa-file"></i> ${this.formatSize(doc.size)}</span>
                </div>
                ${doc.tags && doc.tags.length > 0 ? `
                    <div class="document-tags">
                        ${doc.tags.map(tag => `<span class="tag-badge-sm" style="background-color: ${tag.color}">${tag.name}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async selectFolder(folderId) {
        this.currentFolder = folderId;
        await this.loadDocuments(folderId);
        
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (folderElement) {
            folderElement.classList.add('active');
        }
    }

    async showAllDocuments() {
        this.currentFolder = null;
        await this.loadDocuments();
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    async showRecent() {
        try {
            const response = await fetch('/api/recent');
            const result = await response.json();
            if (result.success) {
                this.documents = result.recent.map(r => r.document).filter(d => d !== null);
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error loading recent files:', error);
        }
    }

    async showFavorites() {
        try {
            const response = await fetch('/api/favorites');
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    async showPinned() {
        try {
            const response = await fetch('/api/pinned');
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error loading pinned:', error);
        }
    }

    async createFolder(parentId = null) {
        const name = prompt('Enter folder name:');
        if (!name) return;

        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parent_id: parentId })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadFolders();
                this.renderSidebar();
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    }

    async deleteFolder(folderId) {
        if (!confirm('Delete this folder and all its contents?')) return;

        try {
            const response = await fetch(`/api/folders/${folderId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadFolders();
                this.renderSidebar();
                if (this.currentFolder === folderId) {
                    await this.showAllDocuments();
                }
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    }

    async createTag() {
        const name = prompt('Enter tag name:');
        if (!name) return;

        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadTags();
                this.renderSidebar();
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    }

    async deleteTag(tagId) {
        if (!confirm('Delete this tag?')) return;

        try {
            const response = await fetch(`/api/tags/${tagId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadTags();
                this.renderSidebar();
            }
        } catch (error) {
            console.error('Error deleting tag:', error);
        }
    }

    async createCategory() {
        const name = prompt('Enter category name:');
        if (!name) return;

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadCategories();
                this.renderSidebar();
            }
        } catch (error) {
            console.error('Error creating category:', error);
        }
    }

    async deleteCategory(catId) {
        if (!confirm('Delete this category?')) return;

        try {
            const response = await fetch(`/api/categories/${catId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadCategories();
                this.renderSidebar();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    }

    async filterByTag(tagId) {
        try {
            const response = await fetch(`/api/search?tags=${tagId}`);
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error filtering by tag:', error);
        }
    }

    async filterByCategory(catId) {
        try {
            const response = await fetch(`/api/search?categories=${catId}`);
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error filtering by category:', error);
        }
    }

    async toggleFavorite(docId, currentState) {
        try {
            const response = await fetch(`/api/documents/${docId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_favorite: !currentState })
            });
            
            if (response.ok) {
                await this.loadDocuments(this.currentFolder);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }

    async togglePin(docId, currentState) {
        try {
            const response = await fetch(`/api/documents/${docId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: !currentState })
            });
            
            if (response.ok) {
                await this.loadDocuments(this.currentFolder);
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    }

    async openDocument(docId) {
        try {
            const response = await fetch(`/api/documents/${docId}`);
            const result = await response.json();
            if (result.success && window.sessionManager) {
                const doc = result.document;
                const id = 'doc-' + docId;
                const session = window.sessionManager.createSession(id, doc.filename, doc.content);
                session.documentId = docId;
                session.savedFilename = doc.filename;
                window.sessionManager.switchSession(id);
                window.sessionManager.updateStatus(`Opened ${doc.filename}`);
            }
        } catch (error) {
            console.error('Error opening document:', error);
        }
    }

    async deleteDocument(docId) {
        if (!confirm('Delete this document?')) return;

        try {
            const response = await fetch(`/api/documents/${docId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                await this.loadDocuments(this.currentFolder);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }
    }

    async performSearch(query) {
        if (!query.trim()) {
            await this.loadDocuments(this.currentFolder);
            return;
        }

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            if (result.success) {
                this.documents = result.documents;
                this.renderDocumentList();
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    formatDate(isoString) {
        if (!isoString) return '';
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

    formatSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

const fileManager = new FileManager();
window.fileManager = fileManager;

console.log('File Manager initialized!');
