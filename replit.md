# Markdown Editor Pro

## Overview
A complete, fully-featured professional Markdown editor application with a modern, elegant interface. Built with Python Flask backend and vanilla JavaScript frontend.

## Features

### Core Features
- **Split-view Editor**: Real-time Markdown preview with resizable panels
- **Rich Toolbar**: Smart insertion buttons for all Markdown elements
- **Multi-Tab Sessions**: Open and edit multiple files simultaneously
- **File Operations**: New, Open, Save, Save As with integrated file browser
- **Export Capabilities**: Export to PDF, HTML, and Plain Text
- **RTL/LTR Support**: Toggle text direction for multilingual content
- **Auto-save**: Configurable auto-save feature
- **Undo/Redo**: Full history management
- **Themes**: Light and Dark mode with beautiful styling
- **Keyboard Shortcuts**: Comprehensive shortcuts for all operations
- **Responsive Design**: Works on mobile, tablet, laptop, and ultra-wide screens
- **Syntax Highlighting**: Code blocks with Highlight.js

### Advanced Editor Features
- **CodeMirror 5 Integration**: Professional code editor with syntax highlighting
- **Line Numbers**: Display line numbers with active line highlighting
- **Code Folding**: Fold/unfold markdown sections (headers, code blocks)
- **Multiple Cursors**: Select next occurrence with Ctrl-D
- **Column Selection**: Alt+Click for rectangular/column selection
- **Advanced Editor Modes**:
  - **Vim Mode**: Full Vim keybindings for power users
  - **Emacs Mode**: Emacs-style keyboard shortcuts
  - **Sublime Text Mode**: Sublime Text keybindings
  - All modes preserve essential app shortcuts (Save, Preview, etc.)
- **Advanced Search & Replace**:
  - Regex support for complex patterns
  - Case-sensitive search option
  - Whole word matching
  - Find and replace with CodeMirror search cursor
- **Spell Checking**:
  - Browser-based spell checking
  - English language support
  - Arabic language support (togglable)
- **Advanced Settings Panel**: Sliding panel to configure all advanced features

## Project Structure
```
├── app.py                      # Flask backend with API routes
├── storage.py                  # JSON file storage management
├── models.py                   # Data models (file-based)
├── templates/
│   └── index.html              # Main application template with advanced UI
├── static/
│   ├── css/
│   │   └── styles.css          # Complete styling with themes and advanced features
│   └── js/
│       ├── editor.js           # Original editor core (legacy)
│       ├── codemirror-setup.js # CodeMirror 5 integration
│       ├── advanced-features.js # Advanced features manager
│       ├── spellcheck.js       # Spell checking manager
│       ├── preview.js          # Live preview with Marked.js
│       ├── sessions.js         # Multi-tab session management
│       ├── shortcuts.js        # Keyboard shortcuts handler
│       ├── file-manager.js     # File and folder management
│       └── app.js              # Main app initialization
├── data/                       # JSON storage for all data
│   ├── documents.json          # Document storage
│   ├── folders.json            # Folder structure
│   ├── tags.json               # Tags storage
│   ├── categories.json         # Categories storage
│   └── recent_files.json       # Recent files tracking
├── uploads/                    # Stored markdown files
└── exports/                    # Temporary export files
```

## Technology Stack
- **Backend**: Python 3.11, Flask
- **Storage**: JSON file-based storage system
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Editor**: CodeMirror 5 (with Vim, Emacs, Sublime keymaps)
- **Markdown Rendering**: Marked.js
- **Syntax Highlighting**: Highlight.js
- **PDF Export**: WeasyPrint
- **Icons**: Font Awesome 6

## Keyboard Shortcuts
- `Ctrl+S` - Save
- `Ctrl+Shift+S` - Save As
- `Ctrl+O` - Open File
- `Ctrl+N` / `Ctrl+T` - New Tab
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Insert Link
- `Ctrl+P` - Toggle Preview
- `Ctrl+Shift+D` - Toggle Theme
- `Ctrl+Shift+T` - Toggle Text Direction
- `Ctrl+1-6` - Insert Heading (H1-H6)
- `Ctrl+F` - Advanced Search
- `Ctrl+D` - Select Next Occurrence (Multiple Cursors)
- `Ctrl+Q` - Fold/Unfold Code at Cursor
- `Alt+Click` - Column Selection Mode

## Recent Changes
- **2025-11-17**: File-Based Storage Migration v4.0
  - Migrated from PostgreSQL database to JSON file-based storage
  - All data now stored locally in `data/` directory for easy backup and portability
  - Removed database dependencies (SQLAlchemy, psycopg2-binary, flask-sqlalchemy)
  - Created comprehensive storage.py module for file management
  - Updated models.py to use file-based storage instead of ORM
  - All features preserved: folders, documents, tags, categories, recent files
  - Thread-safe JSON file operations with locking mechanism
  - Automatic ID generation for all entities
  - Zero functionality lost - all API endpoints working correctly

- **2025-11-16**: Database Integration & Bug Fixes v3.1
  - Fixed all LSP errors in app.py and models.py with proper type annotations
  - Resolved SQLAlchemy constructor warnings with targeted type ignore comments
  - Fixed self-referential Folder relationship with proper backref configuration
  - Added missing API endpoints: /api/recent, /api/favorites, /api/pinned, /api/search
  - Added toggleDirection method to CodeMirrorSetup for RTL/LTR support
  - Successfully initialized PostgreSQL database with all required tables
  - Verified all JavaScript modules are properly integrated and working
  - Application fully tested and ready for production deployment

- **2025-11-15**: Advanced Editor Features v3.0
  - Integrated CodeMirror 5 for professional code editing experience
  - Added Vim, Emacs, and Sublime Text keyboard modes
  - Implemented line numbers and code folding for markdown
  - Added multiple cursors support (Ctrl-D to select next occurrence)
  - Implemented column selection mode (Alt+Click)
  - Advanced search and replace with regex and case-sensitive options
  - Added spell checking support for English and Arabic
  - Created advanced settings panel for feature configuration
  - Preserved app shortcuts when using editor modes
  - Enhanced search using CodeMirror search cursor for accurate navigation

- **2025-11-15**: Complete UI/UX Redesign v2.0
  - Brand new modern, elegant, and unique interface design
  - Custom gradient color scheme (Indigo + Pink) with MarkPro branding
  - Complete CSS rebuild with modern design tokens and animations
  - Smooth transitions and hover effects on all interactive elements
  - Enhanced dark/light theme with improved color contrast
  - Fully responsive design for all screen sizes (mobile, tablet, desktop, ultra-wide)
  - Updated fonts to Inter (UI) and JetBrains Mono (Editor)
  - Improved visual hierarchy and spacing throughout the app
  - Animated brand icon with floating effect
  - Tab switching animations and enhanced status indicators
  - All JavaScript functionality preserved and working perfectly
  - Production-ready with zero errors

- **2025-11-15**: Production-ready release v1.0
  - Fixed critical JSON handling with request.get_json(silent=True)
  - Enhanced Arabic language support with Google Fonts (Cairo & Tajawal)
  - Improved RTL CSS styling for lists, blockquotes, and text direction
  - Updated comprehensive README documentation
  - All LSP warnings resolved
  - Production security and error handling verified
  - Created future enhancements roadmap (FUTURE_ENHANCEMENTS.md)

- **2025-01-15**: Initial project creation
  - Complete Flask backend with file operations and export functionality
  - Full-featured frontend with editor, preview, and session management
  - Responsive design with Light/Dark themes
  - Comprehensive keyboard shortcuts system
  - Auto-save functionality
  - RTL/LTR text direction support

## Dependencies
- flask
- markdown
- weasyprint

## Running the Application
The application runs on `http://0.0.0.0:5000` with Flask development server.

## User Preferences
None specified yet.
