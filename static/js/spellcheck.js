class SpellCheckManager {
    constructor() {
        this.enabled = {
            english: true,
            arabic: false,
            grammar: false,
            autoCorrect: false
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        const settings = ['spellCheckEnglish', 'spellCheckArabic', 'grammarCheck', 'autoCorrect'];
        
        settings.forEach(setting => {
            const saved = localStorage.getItem(setting);
            if (saved !== null) {
                const key = this.getKeyFromId(setting);
                this.enabled[key] = saved === 'true';
            }
        });
    }

    getKeyFromId(id) {
        const map = {
            'spellCheckEnglish': 'english',
            'spellCheckArabic': 'arabic',
            'grammarCheck': 'grammar',
            'autoCorrect': 'autoCorrect'
        };
        return map[id] || id;
    }

    setupEventListeners() {
        const englishCheck = document.getElementById('spellCheckEnglish');
        const arabicCheck = document.getElementById('spellCheckArabic');
        const grammarCheck = document.getElementById('grammarCheck');
        const autoCorrectCheck = document.getElementById('autoCorrect');

        if (englishCheck) {
            englishCheck.addEventListener('change', (e) => {
                this.enabled.english = e.target.checked;
                localStorage.setItem('spellCheckEnglish', e.target.checked);
                this.updateSpellCheck();
            });
        }

        if (arabicCheck) {
            arabicCheck.addEventListener('change', (e) => {
                this.enabled.arabic = e.target.checked;
                localStorage.setItem('spellCheckArabic', e.target.checked);
                this.updateSpellCheck();
            });
        }

        if (grammarCheck) {
            grammarCheck.addEventListener('change', (e) => {
                this.enabled.grammar = e.target.checked;
                localStorage.setItem('grammarCheck', e.target.checked);
                this.updateSpellCheck();
            });
        }

        if (autoCorrectCheck) {
            autoCorrectCheck.addEventListener('change', (e) => {
                this.enabled.autoCorrect = e.target.checked;
                localStorage.setItem('autoCorrect', e.target.checked);
                this.updateSpellCheck();
            });
        }
    }

    updateSpellCheck() {
        if (!window.codemirrorSetup || !window.codemirrorSetup.editor) return;

        const cm = window.codemirrorSetup.editor;
        const wrapper = cm.getWrapperElement();
        const textarea = wrapper.querySelector('textarea');

        if (textarea) {
            textarea.spellcheck = this.enabled.english || this.enabled.arabic;
            
            if (this.enabled.english && this.enabled.arabic) {
                textarea.lang = 'en,ar';
            } else if (this.enabled.english) {
                textarea.lang = 'en';
            } else if (this.enabled.arabic) {
                textarea.lang = 'ar';
            }
        }

        cm.refresh();
        
        console.log('Spell check settings updated:', this.enabled);
    }

    setCodemirrorSetup(setup) {
        setTimeout(() => {
            this.updateSpellCheck();
        }, 500);
    }
}

window.SpellCheckManager = SpellCheckManager;
