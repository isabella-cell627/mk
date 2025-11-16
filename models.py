from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from app import db

document_tags = Table('document_tags', db.Model.metadata,
    Column('document_id', Integer, ForeignKey('document.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tag.id', ondelete='CASCADE'), primary_key=True)
)

document_categories = Table('document_categories', db.Model.metadata,
    Column('document_id', Integer, ForeignKey('document.id', ondelete='CASCADE'), primary_key=True),
    Column('category_id', Integer, ForeignKey('category.id', ondelete='CASCADE'), primary_key=True)
)

class Folder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, ForeignKey('folder.id', ondelete='CASCADE'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    color = db.Column(db.String(7), default='#6366f1')
    icon = db.Column(db.String(50), default='folder')
    position = db.Column(db.Integer, default=0)
    
    children = relationship('Folder', backref=db.backref('parent', remote_side=[id]))
    documents = relationship('Document', back_populates='folder', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'color': self.color,
            'icon': self.icon,
            'position': self.position,
            'children': [child.to_dict() for child in sorted(self.children, key=lambda x: x.position)],
            'document_count': len(self.documents)
        }

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, default='')
    folder_id = db.Column(db.Integer, ForeignKey('folder.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_favorite = db.Column(db.Boolean, default=False)
    is_pinned = db.Column(db.Boolean, default=False)
    last_opened_at = db.Column(db.DateTime, nullable=True)
    
    folder = relationship('Folder', back_populates='documents')
    tags = relationship('Tag', secondary=document_tags, back_populates='documents')
    categories = relationship('Category', secondary=document_categories, back_populates='documents')
    
    def to_dict(self, include_content=False):
        return {
            'id': self.id,
            'filename': self.filename,
            'content': self.content if include_content else None,
            'folder_id': self.folder_id,
            'folder_name': self.folder.name if self.folder else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_favorite': self.is_favorite,
            'is_pinned': self.is_pinned,
            'last_opened_at': self.last_opened_at.isoformat() if self.last_opened_at else None,
            'tags': [tag.to_dict() for tag in self.tags],
            'categories': [cat.to_dict() for cat in self.categories],
            'size': len(self.content.encode('utf-8')) if self.content else 0
        }

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    color = db.Column(db.String(7), default='#6366f1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    documents = relationship('Document', secondary=document_tags, back_populates='tags')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'document_count': len(self.documents)
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    color = db.Column(db.String(7), default='#ec4899')
    icon = db.Column(db.String(50), default='bookmark')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    documents = relationship('Document', secondary=document_categories, back_populates='categories')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'icon': self.icon,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'document_count': len(self.documents)
        }

class RecentFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, ForeignKey('document.id', ondelete='CASCADE'), nullable=False)
    accessed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    document = relationship('Document')
    
    def to_dict(self):
        return {
            'id': self.id,
            'document': self.document.to_dict() if self.document else None,
            'accessed_at': self.accessed_at.isoformat() if self.accessed_at else None
        }
