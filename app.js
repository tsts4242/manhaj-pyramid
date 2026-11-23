document.addEventListener('DOMContentLoaded', () => {
    // 1. Elements Binding (Strictly matching index.html)
    const btnPyr1 = document.getElementById('btn-pyr-1');
    const btnArticles = document.getElementById('btn-articles');
    const btnPyr2 = document.getElementById('btn-pyr-2');

    const pyrBox1 = document.getElementById('pyramid-box-1');
    const pyrBox2 = document.getElementById('pyramid-box-2');
    const articlesBox = document.getElementById('articles-box');

    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBackArticles = document.getElementById('btn-back-articles');

    const inputWord = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');

    const levelBtns = document.querySelectorAll('.level-btn');
    const riwayahBtns = document.querySelectorAll('.riwayah-btn');
    const loader = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');

    // State Variables
    let currentLevel = 1;
    let currentRiwayah = 'hafs';
    let currentSearchData = null;
    let currentArticlePage = 1;
    let activeAudio = null;
    let activeAudioBtn = null;
    let isReadingAll = false;

    // 2. Top Navigation Panels (Pyramid 1, Articles, Pyramid 2)
    function hideAllTopBoxes() {
        if (pyrBox1) pyrBox1.style.display = 'none';
        if (pyrBox2) pyrBox2.style.display = 'none';
        if (articlesBox) articlesBox.style.display = 'none';
    }

    if (btnPyr1 && pyrBox1) {
        btnPyr1.addEventListener('click', () => {
            const isVisible = pyrBox1.style.display === 'block';
            hideAllTopBoxes();
            pyrBox1.style.display = isVisible ? 'none' : 'block';
        });
    }

    if (btnBack1 && pyrBox1) {
        btnBack1.addEventListener('click', () => {
            pyrBox1.style.display = 'none';
        });
    }

    if (btnPyr2 && pyrBox2) {
        btnPyr2.addEventListener('click', () => {
            const isVisible = pyrBox2.style.display === 'block';
            hideAllTopBoxes();
            pyrBox2.style.display = isVisible ? 'none' : 'block';
        });
    }

    if (btnBack2 && pyrBox2) {
        btnBack2.addEventListener('click', () => {
            pyrBox2.style.display = 'none';
        });
    }

    if (btnArticles && articlesBox) {
        btnArticles.addEventListener('click', () => {
            const isVisible = articlesBox.style.display === 'block';
            hideAllTopBoxes();
            if (!isVisible) {
                articlesBox.style.display = 'block';
                renderArticlesGrid();
            }
        });
    }

    if (btnBackArticles) {
        btnBackArticles.style.display = 'none';
    }

    // 3. Articles & Research (24 items across 2 pages x 12)
    function getArticlesCollection() {
        const candidates = [
            typeof ARTICLES_DATA !== 'undefined' ? ARTICLES_DATA : null,
            typeof ARTICLES !== 'undefined' ? ARTICLES : null,
            typeof articles !== 'undefined' ? articles : null,
            typeof articlesData !== 'undefined' ? articlesData : null,
            typeof ARTICLES_LIST !== 'undefined' ? ARTICLES_LIST : null,
            window.ARTICLES_DATA,
            window.ARTICLES,
            window.articles,
            window.articlesData
        ];
        for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) return c;
            if (c && typeof c === 'object' && Object.keys(c).length > 0) return c;
        }
        return null;
    }

    function getArticleByNumber(num) {
        const col = getArticlesCollection();
        if (!col) return null;
        if (Array.isArray(col)) {
            return col.find(a => a && (Number(a.id) === num || Number(a.number) === num)) || col[num - 1] || null;
        }
        return col[num] || col[String(num)] || null;
    }

    function renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        const viewer = document.getElementById('article-viewer');
        if (!grid) return;
        grid.innerHTML = '';

        const itemsPerPage = 12;
        const startNum = (currentArticlePage - 1) * itemsPerPage + 1;
        const endNum = currentArticlePage * itemsPerPage;

        for (let i = startNum; i <= endNum; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'article-num-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.article-num-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const art = getArticleByNumber(i);
                if (viewer) {
                    viewer.style.display = 'block';
                    if (art && typeof art === 'string' && art.trim() !== '') {
                        const paras = art.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                        viewer.innerHTML = `<h3>المقال رقم ${i}</h3>${paras}`;
                    } else if (art && (art.content || art.text || art.body)) {
                        const rawText = art.content || art.text || art.body;
                        const paras = String(rawText).split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                        viewer.innerHTML = `<h3>${i}. ${art.title || 'مقال رقم ' + i}</h3>${paras}`;
                    } else {
                        viewer.innerHTML = `<h3>المقال رقم ${i}</h3><p>هذا الموضع مهيأ لإضافة البحث والمقال رقم ${i} قريباً.</p>`;
                    }
                }
            });
            grid.appendChild(btn);
        }

        let paginationBar = document.getElementById('articles-pagination');
        if (!paginationBar) {
            paginationBar = document.createElement('div');
            paginationBar.id = 'articles-pagination';
            paginationBar.className = 'articles-pagination';
            grid.parentNode.insertBefore(paginationBar, grid.nextSibling);
        }

        paginationBar.innerHTML = `
            <button type="button" class="page-nav-btn" ${currentArticlePage === 1 ? 'disabled' : ''} id="prev-art-page">◀ السابق</button>
            <span class="down-scroll-hint" title="المقال يُعرض بالأسفل">⬇</span>
            <button type="button" class="page-nav-btn" ${currentArticlePage === 2 ? 'disabled' : ''} id="next-art-page">التالي ▶</button>
        `;

        document.getElementById('prev-art-page').addEventListener('click', () => {
            if (currentArticlePage > 1) {
                currentArticlePage--;
                renderArticlesGrid();
            }
        });

        document.getElementById('next-art-page').addEventListener('click', () => {
            if (currentArticlePage < 2) {
                currentArticlePage++;
                renderArticlesGrid();
            }
        });
    }

    // 4. Riwayah Selector (Hafs | Qaloon | Warsh)
    riwayahBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            riwayahBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRiwayah = btn.dataset.riwayah || 'hafs';
            stopVerseAudio();
        });
    });

    // 5. Level Buttons (1 to 6 - Single Level Display)
    function activateLevel(lvlNum) {
        currentLevel = Number(lvlNum);
        levelBtns.forEach(b => {
            if (Number(b.dataset.lvl) === currentLevel) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        if (currentSearchData && resultsWrapper) {
            resultsWrapper.style.display = 'flex';
            for (let i = 1; i <= 6; i++) {
                const card = document.getElementById(`card-${i}`);
                if (card) {
                    card.style.display = (i === currentLevel) ? 'block' : 'none';
                }
            }
        }
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lvl = Number(btn.dataset.lvl);
            activateLevel(lvl);
        });
    });

    // 6. Audio Player for Individual Ayah (Hafs, Qaloon, Warsh)
    function stopVerseAudio() {
        if (activeAudio) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
            activeAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.classList.remove('playing');
            activeAudioBtn.innerHTML = activeAudioBtn.dataset.defaultLabel || '🔊 استماع';
            activeAudioBtn = null;
        }
    }

    window.playAyahAudio = function(globalAyahNumber, btnElement) {
        if (activeAudioBtn === btnElement && activeAudio) {
            stopVerseAudio();
            return;
        }
        stopVerseAudio();

        const editionMap = {
            'hafs': 'ar.alafasy',
            'qaloon': 'ar.husarymujawwad',
            'warsh': 'ar.ibrahimakhbar'
        };
        const fallbackEditions = {
            'hafs': 'ar.husary',
            'qaloon': 'ar.husary',
            'warsh': 'ar.husary'
        };

        const edition = editionMap[currentRiwayah] || 'ar.alafasy';
        const audioUrl = `https://cdn.islamic.network/quran/audio/64/${edition}/${globalAyahNumber}.mp3`;

        const audio = new Audio(audioUrl);
        activeAudio = audio;
        activeAudioBtn = btnElement;
        btnElement.classList.add('playing');
        btnElement.innerHTML = btnElement.dataset.stopLabel || '⏹ إيقاف';

        audio.play().catch(() => {
            const fbEdition = fallbackEditions[currentRiwayah] || 'ar.husary';
            audio.src = `https://cdn.islamic.network/quran/audio/64/${fbEdition}/${globalAyahNumber}.mp3`;
            audio.play().catch(() => stopVerseAudio());
        });

        audio.onended = () => stopVerseAudio();
        audio.onerror = () => stopVerseAudio();
    };

    // 7. Full Text Read Aloud (Listen Button in Search Card)
    function stopFullSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isReadingAll = false;
        if (listenBtn) {
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
        }
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) return;
            if (isReadingAll) {
                stopFullSpeech();
                return;
            }
            const activeCard = document.getElementById(`card-${currentLevel}`);
            const textToRead = activeCard ? activeCard.innerText.trim() : '';
            if (!textToRead) return;

            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(textToRead);
            utter.lang = currentSearchData ? (currentSearchData.lang === 'en' ? 'en-US' : currentSearchData.lang === 'fr' ? 'fr-FR' : 'ar-SA') : 'ar-SA';
            utter.rate = 0.95;
            utter.onend = () => stopFullSpeech();
            utter.onerror = () => stopFullSpeech();
            isReadingAll = true;
            listenBtn.classList.add('speaking');
            listenBtn.textContent = 'إيقاف';
            window.speechSynthesis.speak(utter);
        });
    }

    // 8. Clear Button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopVerseAudio();
            stopFullSpeech();
            if (inputWord) inputWord.value = '';
            currentSearchData = null;
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            if (loader) loader.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
            if (inputWord) inputWord.focus();
        });
    }

    // 9. Language Detection & UI Translations (Arabic, English, French)
    function detectLanguage(text) {
        if (/[\u0600-\u06FF]/.test(text)) return 'ar';
        if (/[éèêëàâäîïôöùûüçœæ]/i.test(text) || /(tion|ment|ance|ence|eur|euse|ique|isme)$/i.test(text.trim())) {
            return 'fr';
        }
        return 'en';
    }

    const UI_STRINGS = {
        ar: {
            titles: {
                1: 'المستوى 1: الأصل اللغوي للكلمة (الجذر والترادف والمشتقات)',
                2: 'المستوى 2: التصنيف والموضع وعرض الآيات من القرآن',
                3: 'المستوى 3: الأسفار والإصحاحات في العهد القديم (التوراة) والعهد الجديد ("4" الإنجيل) والزبور',
                4: 'المستوى 4: الموروث والمرويات (الصحاح والمشنا)',
                5: 'المستوى 5: محاولة فرز المحكم من المتشابه من الآيات',
                6: 'المستوى 6: الاستنتاج والاستنباط والتأويل'
            },
            searchedWord: 'اللفظ المبحوث عنه:',
            rootLabel: 'الجذر اللغوي:',
            synonymsLabel: 'ألفاظ الترادف (للعلم فقط):',
            singularPluralLabel: 'المفرد والجمع:',
            verbLabel: 'الفعل',
            agentLabel: 'الفاعل',
            masdarLabel: 'المصدر',
            placeLabel: 'المكان',
            totalOccurrences: 'إجمالي المواضع التي ورد فيها اللفظ في القرآن الكريم:',
            makkiCount: 'مواضع مكية',
            madaniCount: 'مواضع مدنية',
            listenLabel: '🔊 استماع',
            stopLabel: '⏹ إيقاف',
            noVerses: 'لم يتم العثور على آيات مطابقة للفظ المدخل.',
            torah: 'التوراة (العهد القديم)',
            zabur: 'الزبور (المزامير)',
            injeel: 'الإنجيل (العهد الجديد)',
            noBible: 'لم يتم العثور على شواهد مطابقة في الأسفار السابقة لهذا اللفظ.',
            sunnahHeader: 'أولاً: ما ورد في السنة',
            talmudHeader: 'ثانياً: ما ورد في التلمود',
            noSunnah: 'لم يتم العثور على روايات مطابقة في كتب السنة لهذا اللفظ.',
            noTalmud: 'لم يتم العثور على نصوص مطابقة في التلمود والمشنا لهذا اللفظ.',
            muhkamTitle: '1. الآيات المحكمة (الواضحة الدلالة والتشريع):',
            mutashabihTitle: '2. الآيات المتشابهة (التي تحتاج رداً للمحكم وتدبراً سياقياً):',
            comparisonTitle: 'المقارنة (التعارض والتضارب)',
            stage6Title: 'خلاصة الاستنباط والتدبر العملي (منهج الصلاح والفوز):'
        },
        en: {
            titles: {
                1: 'Level 1: Linguistic Origin of the Word (Root, Synonyms & Derivatives)',
                2: 'Level 2: Classification, Location & Quranic Verses Display',
                3: 'Level 3: Books & Chapters in the Old Testament (Torah), New Testament (4 Gospels) & Psalms (Zabur)',
                4: 'Level 4: Heritage & Narrations (Hadith Collections & Mishnah/Talmud)',
                5: 'Level 5: Attempt to Distinguish Muhkam (Clear) from Mutashabih (Allegorical) Verses',
                6: 'Level 6: Conclusion, Deduction & Interpretation (Ta’wil)'
            },
            searchedWord: 'Searched Term:',
            rootLabel: 'Linguistic Root:',
            synonymsLabel: 'Synonyms (For Knowledge Only):',
            singularPluralLabel: 'Singular & Plural:',
            verbLabel: 'Verb',
            agentLabel: 'Active Participle',
            masdarLabel: 'Verbal Noun',
            placeLabel: 'Place Noun',
            totalOccurrences: 'Total occurrences of this term in the Holy Quran:',
            makkiCount: 'Meccan',
            madaniCount: 'Medinan',
            listenLabel: '🔊 Listen',
            stopLabel: '⏹ Stop',
            noVerses: 'No matching verses found in the Quran for this exact term.',
            torah: 'Torah (Old Testament)',
            zabur: 'Zabur (Psalms)',
            injeel: 'Injeel (New Testament)',
            noBible: 'No matching passages found in previous scriptures for this term.',
            sunnahHeader: 'First: What is Mentioned in the Sunnah',
            talmudHeader: 'Second: What is Mentioned in the Talmud',
            noSunnah: 'No matching narrations found in the Hadith collections for this term.',
            noTalmud: 'No matching passages found in the Talmud & Mishnah for this term.',
            muhkamTitle: '1. Muhkam Verses (Clear & Definitive):',
            mutashabihTitle: '2. Mutashabih Verses (Contextual & Allegorical):',
            comparisonTitle: 'Comparison (Contradiction & Conflict Analysis)',
            stage6Title: 'Summary of Practical Deduction (Asalah wal Fawz Methodology):'
        },
        fr: {
            titles: {
                1: 'Niveau 1 : Origine linguistique du mot (Racine, Synonymes et Dérivés)',
                2: 'Niveau 2 : Classification, Emplacement et Affichage des Versets du Coran',
                3: 'Niveau 3 : Livres et Chapitres de l’Ancien Testament (Torah), du Nouveau Testament (4 Évangiles) et des Psaumes (Zabour)',
                4: 'Niveau 4 : Patrimoine et Récits (Recueils de Hadiths et Mishna/Talmud)',
                5: 'Niveau 5 : Tentative de distinction entre les versets Muhkam (explicites) et Mutashabih (allégoriques)',
                6: 'Niveau 6 : Conclusion, Déduction et Interprétation (Ta’wil)'
            },
            searchedWord: 'Terme recherché :',
            rootLabel: 'Racine linguistique :',
            synonymsLabel: 'Synonymes (À titre informatif) :',
            singularPluralLabel: 'Singulier et Pluriel :',
            verbLabel: 'Verbe',
            agentLabel: 'Participe actif',
            masdarLabel: 'Nom verbal',
            placeLabel: 'Nom de lieu',
            totalOccurrences: 'Nombre total d’occurrences dans le Saint Coran :',
            makkiCount: 'Mecquoise',
            madaniCount: 'Médinoise',
            listenLabel: '🔊 Écouter',
            stopLabel: '⏹ Arrêter',
            noVerses: 'Aucun verset correspondant trouvé dans le Coran pour ce terme exact.',
            torah: 'Torah (Ancien Testament)',
            zabur: 'Zabour (Psaumes)',
            injeel: 'Évangile (Nouveau Testament)',
            noBible: 'Aucun passage correspondant trouvé dans les écritures précédentes.',
            sunnahHeader: 'Premièrement : Ce qui est rapporté dans la Sunnah',
            talmudHeader: 'Deuxièmement : Ce qui est rapporté dans le Talmud',
            noSunnah: 'Aucun récit correspondant trouvé dans les recueils de Sunnah.',
            noTalmud: 'Aucun passage correspondant trouvé dans le Talmud et la Mishna.',
            muhkamTitle: '1. Versets Muhkam (Clairs et explicites) :',
            mutashabihTitle: '2. Versets Mutashabih (Contextuels et allégoriques) :',
            comparisonTitle: 'Comparaison (Analyse des contradictions et divergences)',
            stage6Title: 'Synthèse de la déduction pratique (Méthode Asalah wal Fawz) :'
        }
    };

    // 10. Exact Word Normalization & Highlighting
    function stripArabicDiacritics(str) {
        return str ? str.replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '') : '';
    }

    function normalizeForExactMatch(str, lang) {
        if (!str) return '';
        if (lang === 'ar') {
            return stripArabicDiacritics(str)
                .replace(/[أإآٱ]/g, 'ا')
                .replace(/ى/g, 'ي')
                .replace(/ؤ/g, 'ء')
                .replace(/ئ/g, 'ء')
                .trim();
        }
        return str.toLowerCase().trim();
    }

    function highlightExactTerm(text, exactQuery, lang) {
        if (!text || !exactQuery) return text;
        const normQuery = normalizeForExactMatch(exactQuery, lang);
        if (!normQuery) return text;

        if (lang === 'ar') {
            return text.split(/(\s+)/).map(token => {
                if (/^\s+$/.test(token)) return token;
                const cleanTok = normalizeForExactMatch(token, 'ar').replace(/[^\u0621-\u064A]/g, '');
                if (!cleanTok) return token;
                const coreTok = cleanTok.replace(/^(وال|بال|كال|فال|لل|ال|و|ف|ب|ل)/, '');
                if (cleanTok === normQuery || coreTok === normQuery || cleanTok.includes(normQuery)) {
                    return `<span class="hl-term">${token}</span>`;
                }
                return token;
            }).join('');
        } else {
            const escaped = exactQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(\\b${escaped}\\w*\\b)`, 'gi');
            return text.replace(regex, '<span class="hl-term">$1</span>');
        }
    }

    // 11. Level 1 Linguistic Analysis
    function analyzeWordLevel1(rawWord, lang) {
        if (lang !== 'ar') {
            return {
                root: rawWord.toUpperCase(),
                synonyms: '—',
                singularPlural: `${rawWord} — ${rawWord}s`,
                verbRows: [
                    `${rawWord} (Past) — ${rawWord} (Present) — will ${rawWord} (Future)`,
                    `—`,
                    `—`,
                    `—`
                ],
                agentRows: [`—`, `—`],
                masdar: rawWord,
                place: ''
            };
        }

        const clean = stripArabicDiacritics(rawWord).trim();
        const base = clean.replace(/^ال/, '');

        const lexicon = {
            'صلاة': { root: 'ص ل و', syn: 'الدعاء، التوجه، الصلة، التسبيح', sp: 'الصلاة — صلاة / الصلوات — صلوات', place: 'المصلّى — مصلّى' },
            'صلوة': { root: 'ص ل و', syn: 'الدعاء، التوجه، الصلة، التسبيح', sp: 'الصلاة — صلاة / الصلوات — صلوات', place: 'المصلّى — مصلّى' },
            'سجد': { root: 'س ج د', syn: 'الخضوع، التذلل، الانقياد', sp: 'السجدة — سجدة / السجدات — سجدات', place: 'المسجد — مسجد' },
            'سجود': { root: 'س ج د', syn: 'الخضوع، التذلل، الانقياد', sp: 'السجدة — سجدة / السجدات — سجدات', place: 'المسجد — مسجد' },
            'غسل': { root: 'غ س ل', syn: 'التطهير، التنظيف، الإزالة', sp: 'الغسلة — غسلة / الغسلات — غسلات', place: 'المغسل — مغسل' },
            'كتاب': { root: 'ك ت ب', syn: 'الصحيفة، السفر، الميثاق، الفرض', sp: 'الكتاب — كتاب / الكتب — كتب', place: 'المكتب — مكتب' },
            'علم': { root: 'ع ل م', syn: 'المعرفة، اليقين، الإدراك، الفقه', sp: 'العلم — علم / العلوم — علوم', place: 'المعلم — معلم' },
            'حكم': { root: 'ح ك م', syn: 'القضاء، الفصل، الإتقان، العدل', sp: 'الحكم — حكم / الأحكام — أحكام', place: 'المحكمة — محكمة' },
            'عدل': { root: 'ع د ل', syn: 'القسط، الإنصاف، الاستقامة', sp: 'العدل — عدل / الأعدال — أعدال', place: '' },
            'رحمة': { root: 'ر ح م', syn: 'الرأفة، العطف، المغفرة، الفضل', sp: 'الرحمة — رحمة / الرحمات — رحمات', place: '' },
            'فوز': { root: 'ف و ز', syn: 'النجاة، الظفر، الفلاح، السعادة', sp: 'الفوز — فوز', place: 'المفازة — مفازة' },
            'صلاح': { root: 'ص ل ح', syn: 'الاستقامة، الإتقان، الخير، النفع', sp: 'الصلاح — صلاح', place: '' },
            'حق': { root: 'ح ق ق', syn: 'الصدق، الثابت، اليقين، العدل', sp: 'الحق — حق / الحقوق — حقوق', place: '' },
            'نور': { root: 'ن و ر', syn: 'الضياء، الهدى، البيان، الإشراق', sp: 'النور — نور / الأنوار — أنوار', place: 'المنارة — منارة' },
            'ذكر': { root: 'ذ ك ر', syn: 'التنبيه، الحفظ، التلاوة، العظة', sp: 'الذكر — ذكر / الأذكار — أذكار', place: '' },
            'صبر': { root: 'ص ب ر', syn: 'الثبات، التحمل، الحبس، الجلد', sp: 'الصبر — صبر', place: '' }
        };

        const entry = lexicon[base];
        let rootStr = '';
        if (entry) {
            rootStr = entry.root;
        } else {
            let stripped = base.replace(/^(ال|وال|بال|لل|و|ف|ب|ل)/, '').replace(/(ون|ين|ات|ان|ة|ي|ه|ا)$/, '');
            if (stripped.length > 3 && /^[يتنأم]/.test(stripped)) stripped = stripped.slice(1);
            rootStr = stripped.split('').slice(0, 3).join(' ');
        }

        const r = rootStr.split(' ');
        const c1 = r[0] || base[0] || '';
        const c2 = r[1] || base[1] || '';
        const c3 = r[2] || base[2] || '';
        const past = (c1 && c2 && c3) ? `${c1}${c2}${c3}` : base;
        const pres = (c1 && c2 && c3) ? `ي${c1}${c2}${c3}` : `ي${base}`;

        return {
            root: rootStr,
            synonyms: entry ? entry.syn : 'يُستفاد معناها من السياق القرآني المباشر للفظ',
            singularPlural: entry ? entry.sp : `ال${base} — ${base}`,
            verbRows: [
                `${past} — ${pres} — سـ${pres}`,
                `${past}ت — ت${c1}${c2}${c3} — ست${c1}${c2}${c3}`,
                `${past}وا — ${pres}ون — سـ${pres}ون`,
                `${past}ن — ${pres}ن — سـ${pres}ن`
            ],
            agentRows: [
                `ال${c1}ا${c2}${c3} — ${c1}ا${c2}${c3} / ال${c1}ا${c2}${c3}ة — ${c1}ا${c2}${c3}ة`,
                `ال${c1}ا${c2}${c3}ون — ${c1}ا${c2}${c3}ون / ال${c1}ا${c2}${c3}ات — ${c1}ا${c2}${c3}ات`
            ],
            masdar: `ال${base} — ${base}`,
            place: entry ? entry.place : ''
        };
    }

    // 12. API Fetchers
    async function fetchQuranExact(word, lang) {
        const cleanQ = lang === 'ar' ? stripArabicDiacritics(word).trim() : word.trim();
        const edition = lang === 'en' ? 'en.sahih' : (lang === 'fr' ? 'fr.hamidullah' : 'quran-simple-clean');

        try {
            const searchUrl = `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQ)}/all/${edition}`;
            const res = await fetch(searchUrl);
            if (!res.ok) return [];
            const json = await res.json();
            if (!json || !json.data || !Array.isArray(json.data.matches)) return [];

            let arMap = new Map();
            if (lang !== 'ar') {
                try {
                    const arRes = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQ)}/all/quran-uthmani`);
                    if (arRes.ok) {
                        const arJson = await arRes.json();
                        if (arJson && arJson.data && Array.isArray(arJson.data.matches)) {
                            arJson.data.matches.forEach(m => arMap.set(m.number, m.text));
                        }
                    }
                } catch (e) {}
            }

            return json.data.matches.map(m => ({
                globalNumber: m.number,
                surahName: lang === 'ar' ? m.surah.name : m.surah.englishName,
                surahNumber: m.surah.number,
                ayahNumber: m.numberInSurah,
                revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                text: m.text,
                arabicText: arMap.get(m.number) || ''
            })).sort((a, b) => (a.surahNumber - b.surahNumber) || (a.ayahNumber - b.ayahNumber));
        } catch (e) {
            return [];
        }
    }

    async function fetchBibleExact(word, lang) {
        const cleanQ = word.trim();
        try {
            const trans = lang === 'ar' ? 'SVD' : (lang === 'fr' ? 'LSG' : 'KJV');
            const url = `https://bolls.life/v2/find/${trans}?search=${encodeURIComponent(cleanQ)}&match_case=false&match_whole=false`;
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.results || []);

            const bookNamesAr = {
                1: 'التكوين', 2: 'الخروج', 3: 'اللاويين', 4: 'العدد', 5: 'التثنية',
                19: 'المزامير (الزبور)', 20: 'الأمثال', 23: 'إشعياء',
                40: 'إنجيل متى', 41: 'إنجيل مرقس', 42: 'إنجيل لوقا', 43: 'إنجيل يوحنا',
                44: 'أعمال الرسل', 45: 'رومية', 66: 'الرؤيا'
            };

            return list.slice(0, 40).map(item => {
                const bId = Number(item.book);
                let category = 'torah';
                if (bId === 19) category = 'zabur';
                else if (bId >= 40) category = 'injeel';

                const bName = lang === 'ar'
                    ? (bookNamesAr[bId] || `سفر رقم ${bId}`)
                    : (item.book_name || `Book ${bId}`);

                const cleanText = String(item.text || '').replace(/<[^>]*>/g, '');
                return {
                    bookName: bName,
                    chapter: item.chapter,
                    verse: item.verse,
                    category,
                    text: cleanText
                };
            });
        } catch (e) {
            return [];
        }
    }

    async function fetchSunnahUnified(word, lang) {
        const cleanQ = lang === 'ar' ? stripArabicDiacritics(word).trim() : word.trim();
        const results = [];

        try {
            const collections = lang === 'ar'
                ? [
                    { slug: 'ara-bukhari', name: 'صحيح البخاري' },
                    { slug: 'ara-muslim', name: 'صحيح مسلم' },
                    { slug: 'ara-malik', name: 'موطأ مالك' },
                    { slug: 'ara-abudawud', name: 'سنن أبي داود' },
                    { slug: 'ara-tirmidhi', name: 'جامع الترمذي' }
                  ]
                : (lang === 'fr'
                    ? [
                        { slug: 'fra-bukhari', name: 'Sahih al-Bukhari' },
                        { slug: 'fra-muslim', name: 'Sahih Muslim' },
                        { slug: 'fra-malik', name: 'Muwatta Malik' }
                      ]
                    : [
                        { slug: 'eng-bukhari', name: 'Sahih al-Bukhari' },
                        { slug: 'eng-muslim', name: 'Sahih Muslim' },
                        { slug: 'eng-malik', name: 'Muwatta Malik' },
                        { slug: 'eng-abudawud', name: 'Sunan Abi Dawud' },
                        { slug: 'eng-tirmidhi', name: 'Jami at-Tirmidhi' }
                      ]);

            const normQ = normalizeForExactMatch(cleanQ, lang);

            await Promise.all(collections.map(async (col) => {
                try {
                    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${col.slug}.min.json`;
                    const r = await fetch(url);
                    if (!r.ok) return;
                    const j = await r.json();
                    if (j && Array.isArray(j.hadiths)) {
                        for (const h of j.hadiths) {
                            if (!h.text) continue;
                            const normText = normalizeForExactMatch(h.text, lang);
                            if (normText.includes(normQ)) {
                                results.push({
                                    source: col.name,
                                    number: h.hadithnumber,
                                    text: h.text,
                                    url: `https://sunnah.com/search?q=${encodeURIComponent(cleanQ)}`
                                });
                                if (results.length >= 45) break;
                            }
                        }
                    }
                } catch (e) {}
            }));
        } catch (e) {}

        const rabiIndex = [
            { num: 1, ar: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى', en: 'Actions are judged by intentions, and every person will get what they intended.' },
            { num: 185, ar: 'بني الإسلام على خمس شهادة أن لا إله إلا الله وأن محمدا رسول الله وإقام الصلاة وإيتاء الزكاة وصوم رمضان وحج البيت', en: 'Islam is built upon five pillars: testimony of faith, establishing prayer, paying zakat, fasting Ramadan, and pilgrimage.' },
            { num: 212, ar: 'مفتاح الصلاة الطهور وتحريمها التكبير وتحليلها التسليم', en: 'The key to prayer is purification, its opening is Takbir, and its closing is Taslim.' },
            { num: 410, ar: 'طلب العلم فريضة على كل مسلم', en: 'Seeking knowledge is an obligation upon every Muslim.' },
            { num: 615, ar: 'الدين النصيحة لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم', en: 'Religion is sincerity: to Allah, His Book, His Messenger, and the leaders and common folk of the Muslims.' }
        ];
        const normQ = normalizeForExactMatch(cleanQ, lang);
        for (const item of rabiIndex) {
            const txt = lang === 'ar' ? item.ar : item.en;
            if (normalizeForExactMatch(txt, lang).includes(normQ)) {
                results.push({
                    source: lang === 'ar' ? 'مسند الربيع بن حبيب' : 'Musnad al-Rabi ibn Habib',
                    number: item.num,
                    text: txt,
                    url: `https://sunnah.com/search?q=${encodeURIComponent(cleanQ)}`
                });
            }
        }

        return results;
    }

    async function fetchTalmudUnified(word, lang) {
        const cleanQ = word.trim();
        const results = [];
        try {
            const url = `https://www.sefaria.org/api/search-wrapper?q=${encodeURIComponent(cleanQ)}&type=text&field=naive_lemmatizer&size=30`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                const hits = (json && json.hits && json.hits.hits) ? json.hits.hits : [];
                for (const hit of hits) {
                    const src = hit._source || {};
                    const ref = src.ref || '';
                    const cats = Array.isArray(src.categories) ? src.categories.join(' ') : '';
                    let badge = '';

                    if (/Mishnah/i.test(cats) || /^Mishnah/i.test(ref)) {
                        badge = lang === 'ar' ? 'المشنا' : (lang === 'fr' ? 'Mishna' : 'Mishnah');
                    } else if (/Jerusalem Talmud|Yerushalmi/i.test(cats) || /Jerusalem Talmud/i.test(ref)) {
                        badge = lang === 'ar' ? 'التلمود الفلسطيني' : (lang === 'fr' ? 'Talmud de Jérusalem (Palestinien)' : 'Palestinian Talmud (Yerushalmi)');
                    } else if (/Talmud|Bavli/i.test(cats)) {
                        badge = lang === 'ar' ? 'التلمود البابلي' : (lang === 'fr' ? 'Talmud de Babylone' : 'Babylonian Talmud (Bavli)');
                    } else {
                        continue;
                    }

                    const snippet = (hit.highlight && hit.highlight.naive_lemmatizer)
                        ? hit.highlight.naive_lemmatizer.join(' ... ').replace(/<[^>]*>/g, '')
                        : (src.exact || '');

                    if (snippet) {
                        results.push({
                            badge,
                            ref,
                            text: snippet,
                            url: `https://www.sefaria.org/${encodeURIComponent(ref.replace(/\s+/g, '_'))}`
                        });
                    }
                }
            }
        } catch (e) {}

        return results;
    }

    // 13. Render All 6 Levels
    function renderAllLevels(data) {
        const { query, lang, l1, verses, bible, sunnah, talmud } = data;
        const t = UI_STRINGS[lang];

        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) {
                const hdr = card.querySelector('.level-header');
                if (hdr) hdr.textContent = t.titles[i];
            }
        }

        // Level 1 Content
        const c1 = document.getElementById('content-1');
        if (c1) {
            c1.innerHTML = `
                <p><strong>${t.searchedWord}</strong> <span style="color:#6b1d2f;font-weight:800;">${query}</span></p>
                <p><strong>${t.rootLabel}</strong> <span style="color:var(--primary);font-weight:800;font-size:1.15rem;">(${l1.root})</span></p>
                <p><strong>${t.synonymsLabel}</strong> ${l1.synonyms}</p>
                <p style="margin-bottom:10px;"><strong>${t.singularPluralLabel}</strong> ${l1.singularPlural}</p>

                <table class="deriv-table">
                    <tbody>
                        <tr>
                            <th style="width:24%;">${t.verbLabel}</th>
                            <td>
                                <div>${l1.verbRows[0]}</div>
                                <div>${l1.verbRows[1]}</div>
                                <div>${l1.verbRows[2]}</div>
                                <div>${l1.verbRows[3]}</div>
                            </td>
                        </tr>
                        <tr>
                            <th>${t.agentLabel}</th>
                            <td>
                                <div>${l1.agentRows[0]}</div>
                                <div>${l1.agentRows[1]}</div>
                            </td>
                        </tr>
                        <tr>
                            <th>${t.masdarLabel}</th>
                            <td>${l1.masdar}</td>
                        </tr>
                        <tr>
                            <th>${t.placeLabel}</th>
                            <td>${l1.place}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        // Level 2 Content
        const c2 = document.getElementById('content-2');
        if (c2) {
            const makkiCount = verses.filter(v => v.revelationType === 'makki').length;
            const madaniCount = verses.filter(v => v.revelationType === 'madani').length;

            if (verses.length === 0) {
                c2.innerHTML = `<p>${t.noVerses}</p>`;
            } else {
                const versesHtml = verses.map(v => {
                    const revLabel = v.revelationType === 'makki' ? t.makkiCount : t.madaniCount;
                    const revClass = v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani';
                    const arHeader = v.arabicText ? `<div class="verse-text" style="margin-bottom:4px;">﴿ ${v.arabicText} ﴾</div>` : '';
                    const mainVerseText = lang === 'ar'
                        ? `<div class="verse-text">﴿ ${highlightExactTerm(v.text, query, 'ar')} ﴾</div>`
                        : `<div style="font-size:1.05rem;line-height:1.7;color:#1e293b;">${highlightExactTerm(v.text, query, lang)}</div>`;

                    return `
                    <div class="verse-box">
                        ${arHeader}
                        ${mainVerseText}
                        <div class="verse-meta" style="justify-content:space-between;">
                            <div>
                                <span>${v.surahName} — ${v.ayahNumber}</span>
                                <span class="surah-type-badge ${revClass}">${revLabel}</span>
                            </div>
                            <button type="button" class="ayah-audio-btn" data-default-label="${t.listenLabel}" data-stop-label="${t.stopLabel}" onclick="playAyahAudio(${v.globalNumber}, this)">${t.listenLabel}</button>
                        </div>
                    </div>`;
                }).join('');

                c2.innerHTML = `
                    <div class="deriv-group-title">${t.totalOccurrences} <strong>${verses.length}</strong> (${t.makkiCount}: ${makkiCount} | ${t.madaniCount}: ${madaniCount})</div>
                    ${versesHtml}
                `;
            }
        }

        // Level 3 Content
        const c3 = document.getElementById('content-3');
        if (c3) {
            if (bible.length === 0) {
                c3.innerHTML = `<p>${t.noBible}</p>`;
            } else {
                c3.innerHTML = bible.map(b => {
                    const catLabel = b.category === 'zabur' ? t.zabur : (b.category === 'injeel' ? t.injeel : t.torah);
                    const badgeClass = b.category === 'zabur' ? 'badge-zabur' : (b.category === 'injeel' ? 'badge-injeel' : 'badge-torah');
                    return `
                    <div class="verse-box">
                        <div class="verse-text" style="font-size:1.1rem;">${highlightExactTerm(b.text, query, lang)}</div>
                        <div class="verse-meta">
                            <span>${b.bookName} (${b.chapter}:${b.verse})</span>
                            <span class="surah-type-badge ${badgeClass}">${catLabel}</span>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // Level 4 Content
        const c4 = document.getElementById('content-4');
        if (c4) {
            const sunnahHtml = sunnah.length === 0
                ? `<p>${t.noSunnah}</p>`
                : sunnah.map(s => `
                    <div class="verse-box">
                        <div class="verse-text" style="font-size:1.1rem;">${highlightExactTerm(s.text, query, lang)}</div>
                        <div class="verse-meta" style="justify-content:space-between;">
                            <span class="surah-type-badge badge-sunnah">[${s.source} — ${s.number}]</span>
                            <a href="${s.url}" target="_blank" rel="noopener" class="source-link">Sunnah.com ↗</a>
                        </div>
                    </div>
                `).join('');

            const talmudHtml = talmud.length === 0
                ? `<p>${t.noTalmud}</p>`
                : talmud.map(tm => `
                    <div class="verse-box">
                        <div class="verse-text" style="font-size:1.1rem;">${highlightExactTerm(tm.text, query, lang)}</div>
                        <div class="verse-meta" style="justify-content:space-between;">
                            <span><span class="surah-type-badge badge-talmud">[${tm.badge}]</span> ${tm.ref}</span>
                            <a href="${tm.url}" target="_blank" rel="noopener" class="source-link">Sefaria ↗</a>
                        </div>
                    </div>
                `).join('');

            c4.innerHTML = `
                <div class="deriv-group-title">${t.sunnahHeader}</div>
                ${sunnahHtml}
                <div class="deriv-group-title" style="margin-top:18px;">${t.talmudHeader}</div>
                ${talmudHtml}
            `;
        }

        // Level 5 Content
        const c5 = document.getElementById('content-5');
        if (c5) {
            const muhkam = verses.filter(v => v.revelationType === 'madani');
            const mutashabih = verses.filter(v => v.revelationType === 'makki');

            const muhkamHtml = muhkam.map(v => `
                <div class="verse-box">
                    <div class="verse-text">﴿ ${highlightExactTerm(v.text, query, lang)} ﴾</div>
                    <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                </div>
            `).join('') || `<p>${t.noVerses}</p>`;

            const mutashabihHtml = mutashabih.map(v => `
                <div class="verse-box">
                    <div class="verse-text">﴿ ${highlightExactTerm(v.text, query, lang)} ﴾</div>
                    <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                </div>
            `).join('') || `<p>${t.noVerses}</p>`;

            const compSummary = lang === 'ar'
                ? `<p><strong>1. مقارنة القرآن بالأسفار السابقة (${bible.length} موضعاً):</strong> يُعرض هنا تقابل دلالة لفظ <strong>«${query}»</strong> بين النص القرآني المحفوظ وما ورد في أسفار العهد القديم والجديد والزبور لتمييز الموافقة من التحريف أو التباين السياقي.</p>
                   <p style="margin-top:8px;"><strong>2. مقارنة القرآن بالمرويات (${sunnah.length + talmud.length} موضعاً):</strong> يُقابل هنا استعمال لفظ <strong>«${query}»</strong> في القرآن الكريم مع ما ورد في دواوين السنة والتلمود للكشف عن أي تعارض أو تضارب بين الموروث والنص القرآني.</p>`
                : (lang === 'fr'
                    ? `<p><strong>1. Coran vs Écritures précédentes (${bible.length} passages) :</strong> Comparaison de l'usage du terme <strong>« ${query} »</strong> entre le Coran et les livres antérieurs.</p>
                       <p style="margin-top:8px;"><strong>2. Coran vs Récits et Talmud (${sunnah.length + talmud.length} passages) :</strong> Détection des divergences ou contradictions entre les récits rapportés et le texte coranique.</p>`
                    : `<p><strong>1. Quran vs Previous Scriptures (${bible.length} passages):</strong> Comparing the usage of <strong>"${query}"</strong> between the Quran and earlier scriptures.</p>
                       <p style="margin-top:8px;"><strong>2. Quran vs Narrations & Talmud (${sunnah.length + talmud.length} passages):</strong> Identifying conflicts or contradictions between inherited narrations and the Quranic text.</p>`);

            c5.innerHTML = `
                <div class="deriv-group-title">${t.muhkamTitle}</div>
                ${muhkamHtml}
                <div class="deriv-group-title">${t.mutashabihTitle}</div>
                ${mutashabihHtml}
                <div class="deriv-group-title">${t.comparisonTitle}</div>
                <div class="stage6-directive" style="background:#fdfbf7;">${compSummary}</div>
            `;
        }

        // Level 6 Content
        const c6 = document.getElementById('content-6');
        if (c6) {
            const summaryText = lang === 'ar'
                ? `بعد استقراء لفظ <strong>«${query}»</strong> في جميع مواضعه القرآنية (<strong>${verses.length}</strong> موضعاً) ومقارنته بالكتب السابقة والمرويات، يتبيّن الميزان القرآني الحاكم الذي يُزيل اللبس، ويُثمر <strong>الصلاح</strong> في الفهم والعمل، ويُحقق <strong>الفوز</strong> باتباع المحكم من التنزيل.`
                : (lang === 'fr'
                    ? `Après l'étude exhaustive du terme <strong>« ${query} »</strong> dans ses <strong>${verses.length}</strong> occurrences coraniques et sa comparaison avec les écritures et récits, le critère coranique éclaire le sens authentique selon la méthode <strong>Asalah wal Fawz</strong>.`
                    : `After examining <strong>"${query}"</strong> across all <strong>${verses.length}</strong> Quranic occurrences and comparing it with previous scriptures and narrations, the Quranic criterion clarifies the true meaning according to the <strong>Asalah wal Fawz</strong> methodology.`);

            c6.innerHTML = `
                <div class="deriv-group-title">${t.stage6Title}</div>
                <div class="stage6-directive">${summaryText}</div>
            `;
        }
    }

    // 14. Execute Search Flow
    async function runSearch() {
        const rawQuery = inputWord ? inputWord.value.trim() : '';
        if (!rawQuery) return;

        stopVerseAudio();
        stopFullSpeech();

        if (resultsWrapper) resultsWrapper.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        const lang = detectLanguage(rawQuery);
        const l1 = analyzeWordLevel1(rawQuery, lang);

        const [verses, bible, sunnah, talmud] = await Promise.all([
            fetchQuranExact(rawQuery, lang),
            fetchBibleExact(rawQuery, lang),
            fetchSunnahUnified(rawQuery, lang),
            fetchTalmudUnified(rawQuery, lang)
        ]);

        currentSearchData = {
            query: rawQuery,
            lang,
            l1,
            verses,
            bible,
            sunnah,
            talmud
        };

        renderAllLevels(currentSearchData);

        if (loader) loader.style.display = 'none';
        activateLevel(1);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', runSearch);
    }

    if (inputWord) {
        inputWord.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
            }
        });
    }
});
