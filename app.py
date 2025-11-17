from flask import Flask, render_template, request, jsonify, send_file
import os
from datetime import datetime
import markdown
from weasyprint import HTML
from io import BytesIO
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from models import Document, Folder, Tag, Category, RecentFile

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

UPLOADS_DIR = 'uploads'
EXPORTS_DIR = 'exports'

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(EXPORTS_DIR, exist_ok=True)

def safe_join_path(base_dir, filename):
    safe_name = secure_filename(filename)
    if not safe_name:
        raise ValueError("Invalid filename")
    
    full_path = os.path.abspath(os.path.join(base_dir, safe_name))
    base_path = os.path.abspath(base_dir)
    
    if not full_path.startswith(base_path + os.sep):
        raise ValueError("Path traversal attempt detected")
    
    return full_path, safe_name

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save', methods=['POST'])
def save_file():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        filename = data.get('filename', 'untitled.md')
        content = data.get('content', '')
        folder_id = data.get('folder_id')
        document_id = data.get('document_id')
        
        if not filename.endswith('.md'):
            filename += '.md'
        
        if document_id:
            document = Document.get_by_id(document_id)
            if document:
                Document.update(document_id, 
                               filename=filename, 
                               content=content, 
                               folder_id=folder_id)
                document = Document.get_by_id(document_id)
            else:
                document = Document.create(filename, content, folder_id)
        else:
            all_docs = Document.get_all()
            existing = None
            for doc in all_docs:
                if doc['filename'] == filename and doc.get('folder_id') == folder_id:
                    existing = doc
                    break
            
            if existing:
                Document.update(existing['id'], content=content)
                document = Document.get_by_id(existing['id'])
            else:
                document = Document.create(filename, content, folder_id)
        
        return jsonify({
            'success': True,
            'message': 'File saved successfully',
            'filename': filename,
            'document_id': document['id'],
            'document': Document.to_dict(document, include_content=True)
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/open', methods=['POST'])
def open_file():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        filename = data.get('filename')
        document_id = data.get('document_id')
        
        if document_id:
            document = Document.get_by_id(document_id)
            if not document:
                return jsonify({'success': False, 'error': 'Document not found'}), 404
        elif filename:
            all_docs = Document.get_all()
            document = None
            for doc in all_docs:
                if doc['filename'] == filename:
                    document = doc
                    break
            if not document:
                return jsonify({'success': False, 'error': 'Document not found'}), 404
        else:
            return jsonify({'success': False, 'error': 'No filename or document_id provided'}), 400
        
        Document.update(document['id'], last_opened_at=datetime.utcnow().isoformat())
        RecentFile.add(document['id'])
        
        document = Document.get_by_id(document['id'])
        
        return jsonify({
            'success': True,
            'content': document.get('content', ''),
            'filename': document['filename'],
            'document_id': document['id'],
            'document': Document.to_dict(document, include_content=True)
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        documents = Document.get_all()
        documents_sorted = sorted(documents, key=lambda x: x.get('updated_at', ''), reverse=True)
        
        files = [{
            'filename': doc['filename'],
            'size': len(doc.get('content', '').encode('utf-8')),
            'modified': doc.get('updated_at'),
            'document_id': doc['id'],
            'folder_id': doc.get('folder_id'),
            'is_favorite': doc.get('is_favorite', False),
            'is_pinned': doc.get('is_pinned', False)
        } for doc in documents_sorted]
        
        return jsonify({'success': True, 'files': files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/html', methods=['POST'])
def export_html():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        content = data.get('content', '')
        filename = data.get('filename', 'document')
        
        html_content = markdown.markdown(
            content,
            extensions=['extra', 'codehilite', 'tables', 'fenced_code']
        )
        
        safe_title = secure_filename(filename.replace('.md', ''))
        
        full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{safe_title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }}
        h1, h2, h3, h4, h5, h6 {{
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }}
        code {{
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }}
        pre code {{
            background: none;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin-left: 0;
            padding-left: 1em;
            color: #666;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 0.5em;
            text-align: left;
        }}
        th {{
            background: #f4f4f4;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
"""
        
        export_filename = f"{safe_title}_export.html"
        export_path, _ = safe_join_path(EXPORTS_DIR, export_filename)
        
        with open(export_path, 'w', encoding='utf-8') as f:
            f.write(full_html)
        
        return send_file(
            export_path,
            as_attachment=True,
            download_name=export_filename,
            mimetype='text/html'
        )
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        content = data.get('content', '')
        filename = data.get('filename', 'document')
        
        html_content = markdown.markdown(
            content,
            extensions=['extra', 'codehilite', 'tables', 'fenced_code']
        )
        
        full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}
        body {{
            font-family: 'DejaVu Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        h1, h2, h3, h4, h5, h6 {{
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }}
        code {{
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
        }}
        pre code {{
            background: none;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin-left: 0;
            padding-left: 1em;
            color: #666;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            page-break-inside: avoid;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 0.5em;
            text-align: left;
        }}
        th {{
            background: #f4f4f4;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
"""
        
        pdf_buffer = BytesIO()
        HTML(string=full_html).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        safe_filename = secure_filename(filename.replace('.md', ''))
        export_filename = f"{safe_filename}_export.pdf"
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=export_filename,
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/txt', methods=['POST'])
def export_txt():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        content = data.get('content', '')
        filename = data.get('filename', 'document')
        
        safe_filename = secure_filename(filename.replace('.md', ''))
        export_filename = f"{safe_filename}_export.txt"
        export_path, _ = safe_join_path(EXPORTS_DIR, export_filename)
        
        with open(export_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return send_file(
            export_path,
            as_attachment=True,
            download_name=export_filename,
            mimetype='text/plain'
        )
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/folders', methods=['GET'])
def get_folders():
    try:
        root_folders = [f for f in Folder.get_all() if f.get('parent_id') is None]
        root_folders_sorted = sorted(root_folders, key=lambda x: x.get('position', 0))
        return jsonify({
            'success': True,
            'folders': [Folder.to_dict(folder) for folder in root_folders_sorted]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/folders', methods=['POST'])
def create_folder():
    try:
        data = request.get_json()
        folder = Folder.create(
            name=data.get('name', 'New Folder'),
            parent_id=data.get('parent_id'),
            color=data.get('color', '#6366f1'),
            icon=data.get('icon', 'folder')
        )
        return jsonify({'success': True, 'folder': Folder.to_dict(folder)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/folders/<int:folder_id>', methods=['PUT'])
def update_folder(folder_id):
    try:
        folder = Folder.get_by_id(folder_id)
        if not folder:
            return jsonify({'success': False, 'error': 'Folder not found'}), 404
        
        data = request.get_json()
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name']
        if 'parent_id' in data:
            update_data['parent_id'] = data['parent_id']
        if 'color' in data:
            update_data['color'] = data['color']
        if 'icon' in data:
            update_data['icon'] = data['icon']
        if 'position' in data:
            update_data['position'] = data['position']
        
        folder = Folder.update(folder_id, **update_data)
        return jsonify({'success': True, 'folder': Folder.to_dict(folder)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/folders/<int:folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    try:
        folder = Folder.get_by_id(folder_id)
        if not folder:
            return jsonify({'success': False, 'error': 'Folder not found'}), 404
        
        Folder.delete(folder_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents', methods=['GET'])
def get_documents():
    try:
        folder_id = request.args.get('folder_id', type=int)
        
        if folder_id is not None:
            documents = Document.get_by_folder(folder_id)
        else:
            documents = Document.get_all()
        
        documents_sorted = sorted(documents, key=lambda x: x.get('updated_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'documents': [Document.to_dict(doc) for doc in documents_sorted]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents', methods=['POST'])
def create_document():
    try:
        data = request.get_json()
        document = Document.create(
            filename=data.get('filename', 'untitled.md'),
            content=data.get('content', ''),
            folder_id=data.get('folder_id')
        )
        return jsonify({'success': True, 'document': Document.to_dict(document, include_content=True)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        Document.update(doc_id, last_opened_at=datetime.utcnow().isoformat())
        RecentFile.add(doc_id)
        
        document = Document.get_by_id(doc_id)
        
        return jsonify({'success': True, 'document': Document.to_dict(document, include_content=True)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>', methods=['PUT'])
def update_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        data = request.get_json()
        update_data = {}
        
        if 'filename' in data:
            update_data['filename'] = data['filename']
        if 'content' in data:
            update_data['content'] = data['content']
        if 'folder_id' in data:
            update_data['folder_id'] = data['folder_id']
        if 'is_favorite' in data:
            update_data['is_favorite'] = data['is_favorite']
        if 'is_pinned' in data:
            update_data['is_pinned'] = data['is_pinned']
        
        document = Document.update(doc_id, **update_data)
        return jsonify({'success': True, 'document': Document.to_dict(document, include_content=True)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        Document.delete(doc_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags', methods=['GET'])
def get_tags():
    try:
        tags = Tag.get_all()
        tags_sorted = sorted(tags, key=lambda x: x.get('name', ''))
        return jsonify({
            'success': True,
            'tags': [Tag.to_dict(tag) for tag in tags_sorted]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags', methods=['POST'])
def create_tag():
    try:
        data = request.get_json()
        tag = Tag.create(
            name=data.get('name'),
            color=data.get('color', '#6366f1')
        )
        return jsonify({'success': True, 'tag': Tag.to_dict(tag)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    try:
        tag = Tag.get_by_id(tag_id)
        if not tag:
            return jsonify({'success': False, 'error': 'Tag not found'}), 404
        
        Tag.delete(tag_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>/tags', methods=['POST'])
def add_tag_to_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        data = request.get_json()
        tag_id = data.get('tag_id')
        
        tag = Tag.get_by_id(tag_id)
        if not tag:
            return jsonify({'success': False, 'error': 'Tag not found'}), 404
        
        Tag.add_to_document(doc_id, tag_id)
        document = Document.get_by_id(doc_id)
        
        return jsonify({'success': True, 'document': Document.to_dict(document)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>/tags/<int:tag_id>', methods=['DELETE'])
def remove_tag_from_document(doc_id, tag_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        tag = Tag.get_by_id(tag_id)
        if not tag:
            return jsonify({'success': False, 'error': 'Tag not found'}), 404
        
        Tag.remove_from_document(doc_id, tag_id)
        document = Document.get_by_id(doc_id)
        
        return jsonify({'success': True, 'document': Document.to_dict(document)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.get_all()
        categories_sorted = sorted(categories, key=lambda x: x.get('name', ''))
        return jsonify({
            'success': True,
            'categories': [Category.to_dict(cat) for cat in categories_sorted]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def create_category():
    try:
        data = request.get_json()
        category = Category.create(
            name=data.get('name'),
            color=data.get('color', '#ec4899'),
            icon=data.get('icon', 'bookmark')
        )
        return jsonify({'success': True, 'category': Category.to_dict(category)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    try:
        category = Category.get_by_id(cat_id)
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        Category.delete(cat_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>/categories', methods=['POST'])
def add_category_to_document(doc_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        data = request.get_json()
        cat_id = data.get('category_id')
        
        category = Category.get_by_id(cat_id)
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        Category.add_to_document(doc_id, cat_id)
        document = Document.get_by_id(doc_id)
        
        return jsonify({'success': True, 'document': Document.to_dict(document)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/documents/<int:doc_id>/categories/<int:cat_id>', methods=['DELETE'])
def remove_category_from_document(doc_id, cat_id):
    try:
        document = Document.get_by_id(doc_id)
        if not document:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
        
        category = Category.get_by_id(cat_id)
        if not category:
            return jsonify({'success': False, 'error': 'Category not found'}), 404
        
        Category.remove_from_document(doc_id, cat_id)
        document = Document.get_by_id(doc_id)
        
        return jsonify({'success': True, 'document': Document.to_dict(document)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recent', methods=['GET'])
def get_recent_files():
    try:
        limit = request.args.get('limit', 20, type=int)
        recent = RecentFile.get_recent(limit)
        
        return jsonify({
            'success': True,
            'recent': [RecentFile.to_dict(r) for r in recent]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_documents():
    try:
        query = request.args.get('q', '').lower()
        if not query:
            return jsonify({'success': True, 'results': []})
        
        documents = Document.get_all()
        results = []
        
        for doc in documents:
            if (query in doc.get('filename', '').lower() or 
                query in doc.get('content', '').lower()):
                results.append(Document.to_dict(doc))
        
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
