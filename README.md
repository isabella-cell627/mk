# Markdown Editor Pro

A complete, fully-featured professional Markdown editor with real-time preview, multi-tab sessions, export capabilities, and beautiful RTL/LTR support.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success) ![Python](https://img.shields.io/badge/Python-3.11-blue) ![Flask](https://img.shields.io/badge/Flask-Latest-green)

## Features

### ✨ Core Editing
- **Split-view Editor**: Real-time Markdown preview with resizable panels
- **Rich Toolbar**: Smart insertion buttons for all Markdown elements (headers, bold, italic, lists, tables, code blocks, links, images, quotes, and more)
- **Multi-Tab Sessions**: Open and edit multiple files simultaneously
- **Undo/Redo**: Full history management with Ctrl+Z / Ctrl+Y

### 📁 File Operations
- **New Document**: Create new tabs instantly (Ctrl+N or Ctrl+T)
- **Open Files**: Browse and open saved Markdown files (Ctrl+O)
- **Save**: Quick save current document (Ctrl+S)
- **Save As**: Save with a new filename (Ctrl+Shift+S)
- **Auto-save**: Optional automatic saving every 30 seconds

### 📤 Export Capabilities
- **Export to PDF**: Professional PDF output with proper formatting
- **Export to HTML**: Standalone HTML files with embedded styles
- **Export to Plain Text**: Raw Markdown text export

### 🎨 Interface & UX
- **Light & Dark Modes**: Beautiful themes for any preference (Ctrl+Shift+D)
- **RTL/LTR Support**: Full support for Arabic, Hebrew, and other RTL languages (Ctrl+Shift+T)
- **Arabic Fonts**: Professional Cairo & Tajawal fonts for beautiful Arabic typography
- **Fully Responsive**: Works perfectly on mobile, tablets, laptops, and ultra-wide monitors
- **Live Preview**: Real-time Markdown rendering as you type
- **Syntax Highlighting**: Code blocks with Highlight.js (190+ languages)
- **Word/Character/Line Count**: Live statistics in the status bar
- **Smooth Animations**: Professional transitions and hover effects
- **Resizable Panels**: Drag the divider to adjust editor/preview ratio

### ⌨️ Keyboard Shortcuts

#### File Operations
- `Ctrl+N` / `Ctrl+T` - New Tab
- `Ctrl+O` - Open File
- `Ctrl+S` - Save
- `Ctrl+Shift+S` - Save As

#### Editing
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Insert Link
- `Ctrl+1-6` - Insert Heading (H1-H6)

#### View
- `Ctrl+P` - Toggle Preview
- `Ctrl+Shift+D` - Toggle Theme (Light/Dark)
- `Ctrl+Shift+T` - Toggle Text Direction (LTR/RTL)

## Technology Stack

### Backend
- **Python 3.11** with Flask
- **WeasyPrint** for PDF generation
- **Markdown** library for server-side processing

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Marked.js** for client-side Markdown rendering
- **Highlight.js** for syntax highlighting (190+ languages)
- **Font Awesome 6** for beautiful icons
- **Google Fonts** (Cairo & Tajawal) for Arabic language support
- **Custom CSS Variables** for easy theming

## Running the Application

The application is already configured and running on port 5000. Simply open your browser and start editing!

## Security Features

- Path traversal protection on all file operations
- Secure filename sanitization
- Sandboxed file storage in uploads/ and exports/ directories

## Project Structure

```
├── app.py                  # Flask backend with API routes
├── templates/
│   └── index.html          # Main application template
├── static/
│   ├── css/
│   │   └── styles.css      # Complete styling with themes
│   └── js/
│       ├── editor.js       # Editor core with undo/redo
│       ├── preview.js      # Live preview with Marked.js
│       ├── sessions.js     # Multi-tab session management
│       ├── shortcuts.js    # Keyboard shortcuts handler
│       └── app.js          # Main app initialization
├── uploads/                # Stored markdown files
└── exports/                # Temporary export files
```

## Tips for Best Experience

1. **Use keyboard shortcuts** for faster workflow
2. **Enable auto-save** to never lose your work
3. **Try dark mode** for reduced eye strain
4. **Resize panels** by dragging the divider between editor and preview
5. **Use the heading selector** for quick heading insertion
6. **Export to PDF** for professional document sharing

## Browser Compatibility

Tested and optimized for:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Complete Feature List

✅ Split-view editor with resizable panels  
✅ Live preview with real-time rendering  
✅ Full Markdown syntax support  
✅ Toolbar with all formatting options  
✅ Undo/Redo with history management  
✅ Multi-tab sessions  
✅ Save, Save As, Open File  
✅ Auto-save with toggle  
✅ Export to PDF, HTML, Plain Text  
✅ Light and Dark themes  
✅ RTL/LTR text direction support  
✅ Arabic language support with professional fonts  
✅ Comprehensive keyboard shortcuts  
✅ Fully responsive design  
✅ Syntax highlighting for code blocks  
✅ Word/character/line count  
✅ File browser with metadata  
✅ Modified file indicators  
✅ Drag-to-resize panels  
✅ Smooth animations and transitions  

## Languages Supported

- **English** - Full support
- **العربية (Arabic)** - Full RTL support with Cairo & Tajawal fonts
- **עברית (Hebrew)** - Full RTL support
- **Any language** - Unicode support for all languages

## Installation

### Quick Start (Replit)
The application is pre-configured and ready to run. Just start the workflow!

### Local Installation
```bash
# Install dependencies
pip install flask flask-sqlalchemy psycopg2-binary gunicorn markdown weasyprint werkzeug email-validator

# Run the application
python app.py

# Open browser to http://localhost:5000
```

### Production Deployment
```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port main:app
```

## Advanced Features

### Session Management
- Each opened file becomes a separate session
- Switch between sessions with a single click
- Sessions preserve text direction (RTL/LTR)
- Modified indicators show unsaved changes
- Close confirmation prevents data loss

### Export Quality
- **PDF**: Professional formatting with proper page breaks
- **HTML**: Standalone files with embedded CSS
- **Text**: Clean Markdown source

### Security
- Path traversal protection
- Secure filename sanitization
- Sandboxed file storage
- XSS protection in preview

---

**Markdown Editor Pro** - Professional markdown editing made simple.

Built with ❤️ for writers, developers, and content creators worldwide.
