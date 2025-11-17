import json
import os
from datetime import datetime
from threading import Lock
from contextlib import contextmanager

DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)

class JSONStorage:
    def __init__(self, filename):
        self.filename = os.path.join(DATA_DIR, filename)
        self.lock = Lock()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        if not os.path.exists(self.filename):
            with open(self.filename, 'w', encoding='utf-8') as f:
                json.dump([], f)
    
    def _load_unsafe(self):
        try:
            with open(self.filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    
    def _save_unsafe(self, data):
        with open(self.filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @contextmanager
    def transaction(self):
        with self.lock:
            data = self._load_unsafe()
            result = {'data': data, 'modified': False}
            yield result
            if result['modified']:
                self._save_unsafe(result['data'])
    
    def load(self):
        with self.lock:
            return self._load_unsafe()
    
    def save(self, data):
        with self.lock:
            self._save_unsafe(data)

folders_storage = JSONStorage('folders.json')
documents_storage = JSONStorage('documents.json')
tags_storage = JSONStorage('tags.json')
categories_storage = JSONStorage('categories.json')
recent_files_storage = JSONStorage('recent_files.json')

def get_next_id(items):
    if not items:
        return 1
    return max(item.get('id', 0) for item in items) + 1

def get_folder_by_id(folder_id):
    folders = folders_storage.load()
    for folder in folders:
        if folder['id'] == folder_id:
            return folder
    return None

def get_folders_by_parent_id(parent_id):
    folders = folders_storage.load()
    return [f for f in folders if f.get('parent_id') == parent_id]

def get_all_folders():
    return folders_storage.load()

def create_folder(name, parent_id=None, color='#6366f1', icon='folder'):
    with folders_storage.transaction() as txn:
        folders = txn['data']
        folder_id = get_next_id(folders)
        folder = {
            'id': folder_id,
            'name': name,
            'parent_id': parent_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'color': color,
            'icon': icon,
            'position': len(folders)
        }
        folders.append(folder)
        txn['modified'] = True
        return folder

def update_folder(folder_id, **kwargs):
    with folders_storage.transaction() as txn:
        folders = txn['data']
        for folder in folders:
            if folder['id'] == folder_id:
                for key, value in kwargs.items():
                    folder[key] = value
                folder['updated_at'] = datetime.utcnow().isoformat()
                txn['modified'] = True
                return folder
        return None

def delete_folder(folder_id):
    with folders_storage.transaction() as txn_f:
        folders = txn_f['data']
        original_len = len(folders)
        folders[:] = [f for f in folders if f['id'] != folder_id]
        txn_f['modified'] = len(folders) != original_len
    
    with documents_storage.transaction() as txn_d:
        documents = txn_d['data']
        modified = False
        for doc in documents:
            if doc.get('folder_id') == folder_id:
                doc['folder_id'] = None
                modified = True
        txn_d['modified'] = modified

def get_document_by_id(doc_id):
    documents = documents_storage.load()
    for doc in documents:
        if doc['id'] == doc_id:
            return doc
    return None

def get_documents_by_folder_id(folder_id):
    documents = documents_storage.load()
    return [d for d in documents if d.get('folder_id') == folder_id]

def get_all_documents():
    return documents_storage.load()

def create_document(filename, content='', folder_id=None):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        doc_id = get_next_id(documents)
        document = {
            'id': doc_id,
            'filename': filename,
            'content': content,
            'folder_id': folder_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'is_favorite': False,
            'is_pinned': False,
            'last_opened_at': None,
            'tag_ids': [],
            'category_ids': []
        }
        documents.append(document)
        txn['modified'] = True
        return document

def update_document(doc_id, **kwargs):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        for doc in documents:
            if doc['id'] == doc_id:
                for key, value in kwargs.items():
                    doc[key] = value
                doc['updated_at'] = datetime.utcnow().isoformat()
                txn['modified'] = True
                return doc
        return None

def delete_document(doc_id):
    with documents_storage.transaction() as txn_d:
        documents = txn_d['data']
        original_len = len(documents)
        documents[:] = [d for d in documents if d['id'] != doc_id]
        txn_d['modified'] = len(documents) != original_len
    
    with recent_files_storage.transaction() as txn_r:
        recent_files = txn_r['data']
        original_len = len(recent_files)
        recent_files[:] = [r for r in recent_files if r['document_id'] != doc_id]
        txn_r['modified'] = len(recent_files) != original_len

def get_tag_by_id(tag_id):
    tags = tags_storage.load()
    for tag in tags:
        if tag['id'] == tag_id:
            return tag
    return None

def get_all_tags():
    return tags_storage.load()

def create_tag(name, color='#6366f1'):
    with tags_storage.transaction() as txn:
        tags = txn['data']
        for tag in tags:
            if tag['name'] == name:
                return tag
        
        tag_id = get_next_id(tags)
        tag = {
            'id': tag_id,
            'name': name,
            'color': color,
            'created_at': datetime.utcnow().isoformat()
        }
        tags.append(tag)
        txn['modified'] = True
        return tag

def delete_tag(tag_id):
    with tags_storage.transaction() as txn_t:
        tags = txn_t['data']
        original_len = len(tags)
        tags[:] = [t for t in tags if t['id'] != tag_id]
        txn_t['modified'] = len(tags) != original_len
    
    with documents_storage.transaction() as txn_d:
        documents = txn_d['data']
        modified = False
        for doc in documents:
            if tag_id in doc.get('tag_ids', []):
                doc['tag_ids'].remove(tag_id)
                modified = True
        txn_d['modified'] = modified

def add_tag_to_document(doc_id, tag_id):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        for doc in documents:
            if doc['id'] == doc_id:
                if 'tag_ids' not in doc:
                    doc['tag_ids'] = []
                if tag_id not in doc['tag_ids']:
                    doc['tag_ids'].append(tag_id)
                    txn['modified'] = True
                return True
        return False

def remove_tag_from_document(doc_id, tag_id):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        for doc in documents:
            if doc['id'] == doc_id:
                if 'tag_ids' in doc and tag_id in doc['tag_ids']:
                    doc['tag_ids'].remove(tag_id)
                    txn['modified'] = True
                return True
        return False

def get_category_by_id(cat_id):
    categories = categories_storage.load()
    for cat in categories:
        if cat['id'] == cat_id:
            return cat
    return None

def get_all_categories():
    return categories_storage.load()

def create_category(name, color='#ec4899', icon='bookmark'):
    with categories_storage.transaction() as txn:
        categories = txn['data']
        for cat in categories:
            if cat['name'] == name:
                return cat
        
        cat_id = get_next_id(categories)
        category = {
            'id': cat_id,
            'name': name,
            'color': color,
            'icon': icon,
            'created_at': datetime.utcnow().isoformat()
        }
        categories.append(category)
        txn['modified'] = True
        return category

def delete_category(cat_id):
    with categories_storage.transaction() as txn_c:
        categories = txn_c['data']
        original_len = len(categories)
        categories[:] = [c for c in categories if c['id'] != cat_id]
        txn_c['modified'] = len(categories) != original_len
    
    with documents_storage.transaction() as txn_d:
        documents = txn_d['data']
        modified = False
        for doc in documents:
            if cat_id in doc.get('category_ids', []):
                doc['category_ids'].remove(cat_id)
                modified = True
        txn_d['modified'] = modified

def add_category_to_document(doc_id, cat_id):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        for doc in documents:
            if doc['id'] == doc_id:
                if 'category_ids' not in doc:
                    doc['category_ids'] = []
                if cat_id not in doc['category_ids']:
                    doc['category_ids'].append(cat_id)
                    txn['modified'] = True
                return True
        return False

def remove_category_from_document(doc_id, cat_id):
    with documents_storage.transaction() as txn:
        documents = txn['data']
        for doc in documents:
            if doc['id'] == doc_id:
                if 'category_ids' in doc and cat_id in doc['category_ids']:
                    doc['category_ids'].remove(cat_id)
                    txn['modified'] = True
                return True
        return False

def add_recent_file(doc_id):
    with recent_files_storage.transaction() as txn:
        recent_files = txn['data']
        recent_id = get_next_id(recent_files)
        recent = {
            'id': recent_id,
            'document_id': doc_id,
            'accessed_at': datetime.utcnow().isoformat()
        }
        recent_files.append(recent)
        
        if len(recent_files) > 50:
            recent_files[:] = recent_files[-50:]
        
        txn['modified'] = True
        return recent

def get_recent_files(limit=20):
    recent_files = recent_files_storage.load()
    recent_files = sorted(recent_files, key=lambda x: x['accessed_at'], reverse=True)
    return recent_files[:limit]
