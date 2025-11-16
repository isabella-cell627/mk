class AdvancedFeaturesManager {
    constructor() {
        this.panel = document.getElementById('advancedFeaturesPanel');
        this.searchPanel = document.getElementById('advancedSearchPanel');
        this.modeIndicator = document.getElementById('modeIndicator');
        this.codemirrorSetup = null;
        
        this.init();
    }

    init() {
        this.setupPanelControls();
        this.setupEditorModeSelector();
        this.setupSearchControls();
        this.setupSettingsPersistence();
    }

    setupPanelControls() {
        const openBtn = document.getElementById('advancedSettingsBtn');
        const closeBtn = document.getElementById('closeAdvancedPanel');

        openBtn.addEventListener('click', () => {
            this.panel.classList.toggle('active');
        });

        closeBtn.addEventListener('click', () => {
            this.panel.classList.remove('active');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.panel.classList.remove('active');
                this.searchPanel.classList.remove('active');
            }
        });
    }

    setupEditorModeSelector() {
        const modeSelect = document.getElementById('editorModeSelect');
        
        const savedMode = localStorage.getItem('editorMode') || 'default';
        modeSelect.value = savedMode;

        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            this.setEditorMode(mode);
        });
    }

    setCodemirrorSetup(setup) {
        this.codemirrorSetup = setup;
        
        const savedMode = localStorage.getItem('editorMode') || 'default';
        if (savedMode !== 'default') {
            this.setEditorMode(savedMode);
        }
    }

    setEditorMode(mode) {
        if (this.codemirrorSetup) {
            this.codemirrorSetup.setMode(mode);
            
            if (mode !== 'default') {
                this.showModeIndicator(mode);
            }
            
            localStorage.setItem('editorMode', mode);
        }
    }

    showModeIndicator(mode) {
        const modeText = document.getElementById('modeText');
        const modeNames = {
            'vim': 'VIM Mode',
            'emacs': 'Emacs Mode',
            'sublime': 'Sublime Mode'
        };

        modeText.textContent = modeNames[mode] || mode.toUpperCase() + ' Mode';
        this.modeIndicator.classList.add('show');

        setTimeout(() => {
            this.modeIndicator.classList.remove('show');
        }, 3000);
    }

    setupSearchControls() {
        const openSearchBtn = document.getElementById('openAdvancedSearchBtn');
        const findBtn = document.getElementById('findBtn');
        const replaceBtn = document.getElementById('replaceBtn');
        const replaceAllBtn = document.getElementById('replaceAllBtn');

        openSearchBtn.addEventListener('click', () => {
            this.searchPanel.classList.toggle('active');
            if (this.searchPanel.classList.contains('active')) {
                document.getElementById('findInput').focus();
            }
        });

        findBtn.addEventListener('click', () => {
            this.performSearch();
        });

        replaceBtn.addEventListener('click', () => {
            this.performReplace();
        });

        replaceAllBtn.addEventListener('click', () => {
            this.performReplaceAll();
        });

        document.getElementById('findInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.performSearch();
            }
        });
    }

    openSearch() {
        this.searchPanel.classList.add('active');
        document.getElementById('findInput').focus();
    }

    performSearch() {
        const searchTerm = document.getElementById('findInput').value;

        if (!searchTerm || !this.codemirrorSetup || !this.codemirrorSetup.editor) return;

        const cm = this.codemirrorSetup.editor;
        const query = this.buildSearchQuery();
        const cursor = cm.getSearchCursor(query, cm.getCursor());
        
        if (cursor.findNext()) {
            cm.setSelection(cursor.from(), cursor.to());
            cm.scrollIntoView({from: cursor.from(), to: cursor.to()}, 20);
            
            let count = 1;
            const start = cursor.from();
            while (cursor.findNext()) {
                count++;
                if (cursor.from().line === start.line && cursor.from().ch === start.ch) break;
            }
            
            const resultsInfo = document.getElementById('searchResultsInfo');
            resultsInfo.textContent = `Found ${count} match${count !== 1 ? 'es' : ''}`;
            resultsInfo.style.display = 'block';
        } else {
            const resultsInfo = document.getElementById('searchResultsInfo');
            resultsInfo.textContent = 'No results found';
            resultsInfo.style.display = 'block';
        }
    }

    buildSearchQuery() {
        const searchTerm = document.getElementById('findInput').value;
        const caseSensitive = document.getElementById('caseSensitiveSearch').checked;
        const wholeWord = document.getElementById('wholeWordSearch').checked;
        const useRegex = document.getElementById('regexSearch').checked;

        if (useRegex) {
            return new RegExp(searchTerm, caseSensitive ? '' : 'i');
        } else {
            let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (wholeWord) {
                pattern = '\\b' + pattern + '\\b';
            }
            return new RegExp(pattern, caseSensitive ? '' : 'i');
        }
    }

    performReplace() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;

        if (!findText || !this.codemirrorSetup || !this.codemirrorSetup.editor) return;

        const cm = this.codemirrorSetup.editor;
        const query = this.buildSearchQuery();
        
        const startPos = cm.getCursor("from");
        const cursor = cm.getSearchCursor(query, startPos);

        if (cursor.findNext()) {
            cursor.replace(replaceText);
            const newEndPos = {line: cursor.from().line, ch: cursor.from().ch + replaceText.length};
            cm.setSelection(cursor.from(), newEndPos);
            cm.scrollIntoView({from: cursor.from(), to: newEndPos}, 20);
            
            const resultsInfo = document.getElementById('searchResultsInfo');
            resultsInfo.textContent = 'Replaced 1 occurrence';
            resultsInfo.style.display = 'block';
        } else {
            const resultsInfo = document.getElementById('searchResultsInfo');
            resultsInfo.textContent = 'No more occurrences to replace';
            resultsInfo.style.display = 'block';
        }
    }

    performReplaceAll() {
        const findText = document.getElementById('findInput').value;
        const replaceText = document.getElementById('replaceInput').value;

        if (!findText || !this.codemirrorSetup || !this.codemirrorSetup.editor) return;

        const cm = this.codemirrorSetup.editor;
        const query = this.buildSearchQuery();
        
        let count = 0;
        cm.operation(function() {
            let cursor = cm.getSearchCursor(query, CodeMirror.Pos(0, 0));
            while (cursor.findNext()) {
                cursor.replace(replaceText);
                count++;
            }
        });

        const resultsInfo = document.getElementById('searchResultsInfo');
        if (count > 0) {
            resultsInfo.textContent = `Replaced ${count} occurrence${count !== 1 ? 's' : ''}`;
        } else {
            resultsInfo.textContent = 'No occurrences found to replace';
        }
        resultsInfo.style.display = 'block';
    }

    setupSettingsPersistence() {
        const settings = [
            'lineNumbersToggle',
            'codeFoldingToggle',
            'activeLineToggle',
            'spellCheckEnglish',
            'spellCheckArabic',
            'grammarCheck',
            'autoCorrect',
            'multipleCursors',
            'columnSelection'
        ];

        settings.forEach(settingId => {
            const element = document.getElementById(settingId);
            if (element) {
                const saved = localStorage.getItem(settingId);
                if (saved !== null) {
                    element.checked = saved === 'true';
                }

                element.addEventListener('change', (e) => {
                    localStorage.setItem(settingId, e.target.checked);
                    this.applySettings();
                });
            }
        });
    }

    applySettings() {
        if (!this.codemirrorSetup || !this.codemirrorSetup.editor) return;

        const cm = this.codemirrorSetup.editor;
        
        const lineNumbers = document.getElementById('lineNumbersToggle').checked;
        const codeFolding = document.getElementById('codeFoldingToggle').checked;
        const activeLine = document.getElementById('activeLineToggle').checked;

        cm.setOption('lineNumbers', lineNumbers);
        cm.setOption('foldGutter', codeFolding);
        cm.setOption('styleActiveLine', activeLine);

        if (codeFolding) {
            cm.setOption('gutters', ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]);
        } else {
            cm.setOption('gutters', ["CodeMirror-linenumbers"]);
        }

        cm.refresh();
        console.log('Advanced settings applied to CodeMirror editor');
    }
}

window.AdvancedFeaturesManager = AdvancedFeaturesManager;
