import storage

class Folder:
    @staticmethod
    def get_by_id(folder_id):
        return storage.get_folder_by_id(folder_id)
    
    @staticmethod
    def get_children(parent_id):
        return storage.get_folders_by_parent_id(parent_id)
    
    @staticmethod
    def get_all():
        return storage.get_all_folders()
    
    @staticmethod
    def create(name, parent_id=None, color='#6366f1', icon='folder'):
        return storage.create_folder(name, parent_id, color, icon)
    
    @staticmethod
    def update(folder_id, **kwargs):
        return storage.update_folder(folder_id, **kwargs)
    
    @staticmethod
    def delete(folder_id):
        storage.delete_folder(folder_id)
    
    @staticmethod
    def to_dict(folder_data):
        if not folder_data:
            return None
        
        children = storage.get_folders_by_parent_id(folder_data['id'])
        children_sorted = sorted(children, key=lambda x: x.get('position', 0))
        documents = storage.get_documents_by_folder_id(folder_data['id'])
        
        return {
            'id': folder_data['id'],
            'name': folder_data['name'],
            'parent_id': folder_data.get('parent_id'),
            'created_at': folder_data.get('created_at'),
            'updated_at': folder_data.get('updated_at'),
            'color': folder_data.get('color', '#6366f1'),
            'icon': folder_data.get('icon', 'folder'),
            'position': folder_data.get('position', 0),
            'children': [Folder.to_dict(child) for child in children_sorted],
            'document_count': len(documents)
        }

class Document:
    @staticmethod
    def get_by_id(doc_id):
        return storage.get_document_by_id(doc_id)
    
    @staticmethod
    def get_by_folder(folder_id):
        return storage.get_documents_by_folder_id(folder_id)
    
    @staticmethod
    def get_all():
        return storage.get_all_documents()
    
    @staticmethod
    def create(filename, content='', folder_id=None):
        return storage.create_document(filename, content, folder_id)
    
    @staticmethod
    def update(doc_id, **kwargs):
        return storage.update_document(doc_id, **kwargs)
    
    @staticmethod
    def delete(doc_id):
        storage.delete_document(doc_id)
    
    @staticmethod
    def to_dict(doc_data, include_content=False):
        if not doc_data:
            return None
        
        folder = storage.get_folder_by_id(doc_data.get('folder_id')) if doc_data.get('folder_id') else None
        
        tags = []
        for tag_id in doc_data.get('tag_ids', []):
            tag = storage.get_tag_by_id(tag_id)
            if tag:
                tags.append(Tag.to_dict(tag))
        
        categories = []
        for cat_id in doc_data.get('category_ids', []):
            cat = storage.get_category_by_id(cat_id)
            if cat:
                categories.append(Category.to_dict(cat))
        
        content = doc_data.get('content', '')
        
        return {
            'id': doc_data['id'],
            'filename': doc_data['filename'],
            'content': content if include_content else None,
            'folder_id': doc_data.get('folder_id'),
            'folder_name': folder['name'] if folder else None,
            'created_at': doc_data.get('created_at'),
            'updated_at': doc_data.get('updated_at'),
            'is_favorite': doc_data.get('is_favorite', False),
            'is_pinned': doc_data.get('is_pinned', False),
            'last_opened_at': doc_data.get('last_opened_at'),
            'tags': tags,
            'categories': categories,
            'size': len(content.encode('utf-8')) if content else 0
        }

class Tag:
    @staticmethod
    def get_by_id(tag_id):
        return storage.get_tag_by_id(tag_id)
    
    @staticmethod
    def get_all():
        return storage.get_all_tags()
    
    @staticmethod
    def create(name, color='#6366f1'):
        return storage.create_tag(name, color)
    
    @staticmethod
    def delete(tag_id):
        storage.delete_tag(tag_id)
    
    @staticmethod
    def add_to_document(doc_id, tag_id):
        return storage.add_tag_to_document(doc_id, tag_id)
    
    @staticmethod
    def remove_from_document(doc_id, tag_id):
        return storage.remove_tag_from_document(doc_id, tag_id)
    
    @staticmethod
    def to_dict(tag_data):
        if not tag_data:
            return None
        
        documents = storage.get_all_documents()
        document_count = sum(1 for doc in documents if tag_data['id'] in doc.get('tag_ids', []))
        
        return {
            'id': tag_data['id'],
            'name': tag_data['name'],
            'color': tag_data.get('color', '#6366f1'),
            'created_at': tag_data.get('created_at'),
            'document_count': document_count
        }

class Category:
    @staticmethod
    def get_by_id(cat_id):
        return storage.get_category_by_id(cat_id)
    
    @staticmethod
    def get_all():
        return storage.get_all_categories()
    
    @staticmethod
    def create(name, color='#ec4899', icon='bookmark'):
        return storage.create_category(name, color, icon)
    
    @staticmethod
    def delete(cat_id):
        storage.delete_category(cat_id)
    
    @staticmethod
    def add_to_document(doc_id, cat_id):
        return storage.add_category_to_document(doc_id, cat_id)
    
    @staticmethod
    def remove_from_document(doc_id, cat_id):
        return storage.remove_category_from_document(doc_id, cat_id)
    
    @staticmethod
    def to_dict(cat_data):
        if not cat_data:
            return None
        
        documents = storage.get_all_documents()
        document_count = sum(1 for doc in documents if cat_data['id'] in doc.get('category_ids', []))
        
        return {
            'id': cat_data['id'],
            'name': cat_data['name'],
            'color': cat_data.get('color', '#ec4899'),
            'icon': cat_data.get('icon', 'bookmark'),
            'created_at': cat_data.get('created_at'),
            'document_count': document_count
        }

class RecentFile:
    @staticmethod
    def add(doc_id):
        return storage.add_recent_file(doc_id)
    
    @staticmethod
    def get_recent(limit=20):
        return storage.get_recent_files(limit)
    
    @staticmethod
    def to_dict(recent_data):
        if not recent_data:
            return None
        
        doc = storage.get_document_by_id(recent_data['document_id'])
        
        return {
            'id': recent_data['id'],
            'document': Document.to_dict(doc) if doc else None,
            'accessed_at': recent_data.get('accessed_at')
        }
