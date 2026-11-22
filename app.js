document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const loader = document.getElementById('loader');
    const loaderText = loader ? loader.querySelector('.loader-single-line') : null;
    const resultsWrapper = document.getElementById('results-wrapper');

    const btnPyr1 = document.getElementById('btn-pyr-1');
    const boxPyr1 = document.getElementById('pyramid-box-1');
    const btnBack1 = document.getElementById('btn-back-1');

    const btnPyr2 = document.getElementById('btn-pyr-2');
    const boxPyr2 = document.getElementById('pyramid-box-2');
    const btnBack2 = document.getElementById('btn-back-2');

    const btnArticles = document.getElementById('btn-articles');
    const boxArticles = document.getElementById('articles-box');
    const btnBackArticles = document.getElementById('btn-back-articles');

    const riwayahBtns = document.querySelectorAll('.riwayah-btn');

    let currentLevel = 'all';
    let currentData = null;
    let currentLang = 'ar';
    let currentRiwayah = 'qaloon';
    let currentArticlePage = 1;
    let isSpeaking = false;
    let currentAyahAudio = null;
    let activeAudioBtn = null;

    if (btnBackArticles) {
        btnBackArticles.style.display = 'none';
    }

    // Pyramid 1 Toggle
    if (btnPyr1 && boxPyr1) {
        btnPyr1.addEventListener('click', () => {
            const isHidden = boxPyr1.style.display === 'none' || boxPyr1.style.display === '';
            boxPyr1.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (boxPyr2) boxPyr2.style.display = 'none';
                if (boxArticles) boxArticles.style.display = 'none';
            }
        });
    }
    if (btnBack1 && boxPyr1) {
        btnBack1.addEventListener('click', () => {
            boxPyr1.style.display = 'none';
        });
    }

    // Pyramid 2 Toggle
    if (btnPyr2 && boxPyr2) {
        btnPyr2.addEventListener('click', () => {
            const isHidden = boxPyr2.style.display === 'none' || boxPyr2.style.display === '';
            boxPyr2.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (boxPyr1) boxPyr1.style.display = 'none';
                if (boxArticles) boxArticles.style.display = 'none';
            }
        });
    }
    if (btnBack2 && boxPyr2) {
        btnBack2.addEventListener('click', () => {
            boxPyr2.style.display = 'none';
        });
    }

    // Smart Articles Detector (Supports any variable name in articles.js)
    function getArticlesCollection() {
        const candidates = [
            typeof ARTICLES_DATA !== 'undefined' ? ARTICLES_DATA : null,
            typeof ARTICLES !== 'undefined' ? ARTICLES : null,
            typeof articles !== 'undefined' ? articles : null,
            typeof articlesData !== 'undefined' ? articlesData : null,
            typeof ARTICLES_LIST !== 'undefined' ? ARTICLES_LIST : null,
            typeof data !== 'undefined' ? data : null,
            window.ARTICLES_DATA,
            window.ARTICLES,
            window.articles,
            window.articlesData
        ];
        for (const c of candidates) {
            if (c) return c;
        }
        return null;
    }

    function getArticleByNumber(num) {
        const col = getArticlesCollection();
        if (!col) return null;

        if (Array.isArray(col)) {
            return col.find(a => a && (Number(a.id) === num || Number(a.number) === num || Number(a.num) === num)) || col[num - 1] || null;
        }
        if (typeof col === 'object') {
            return col[num] || col[String(num)] || col['article' + num] || col['art' + num] || null;
        }
        return null;
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
                    if (typeof art === 'string' && art.trim() !== '') {
                        const paras = art.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                        viewer.innerHTML = `<h3>المقال رقم ${i}</h3>${paras}`;
                    } else if (art && typeof art === 'object') {
                        const rawContent = art.content || art.text || art.body || art.html || art.description || '';
                        const artTitle = art.title || art.name || art.heading || ('مقال رقم ' + i);
                        if (rawContent && rawContent.trim() !== '') {
                            const paras = rawContent.includes('<p>')
                                ? rawContent
                                : rawContent.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                            viewer.innerHTML = `<h3>${i}. ${artTitle}</h3>${paras}`;
                        } else {
                            viewer.innerHTML = `<h3>${i}. ${artTitle}</h3><p>هذا الموضع مهيأ لإضافة البحث والمقال رقم ${i} قريباً.</p>`;
                        }
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
            <span class="down-scroll-hint" title="المقال بالأسفل">⬇</span>
            <button type="button" class="page-nav-btn" ${currentArticlePage === 2 ? 'disabled' : ''} id="next-art-page">التالي ▶</button>
        `;

        const prevBtn = document.getElementById('prev-art-page');
        const nextBtn = document.getElementById('next-art-page');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentArticlePage > 1) {
                    currentArticlePage--;
                    renderArticlesGrid();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentArticlePage < 2) {
                    currentArticlePage++;
                    renderArticlesGrid();
                }
            });
        }
    }

    if (btnArticles && boxArticles) {
        btnArticles.addEventListener('click', () => {
            const isHidden = boxArticles.style.display === 'none' || boxArticles.style.display === '';
            boxArticles.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (boxPyr1) boxPyr1.style.display = 'none';
                if (boxPyr2) boxPyr2.style.display = 'none';
                renderArticlesGrid();
            }
        });
    }

    // Riwayah Switcher (Qaloon / Warsh)
    riwayahBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            riwayahBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRiwayah = btn.dataset.riwayah || 'qaloon';
            stopAyahAudio();
        });
    });

    // Level Buttons
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const clickedLvl = btn.dataset.lvl;
            if (currentLevel === clickedLvl) {
                levelBtns.forEach(b => b.classList.remove('active'));
                currentLevel = 'all';
            } else {
                levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentLevel = clickedLvl;
            }
            if (currentData) {
                applyVisibilityAndRender(currentData);
            }
        });
    });

    // Clear Button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopSpeech();
            stopAyahAudio();
            if (input) input.value = '';
            currentData = null;
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            if (loader) loader.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
            currentLevel = 'all';
            if (input) input.focus();
        });
    }

    // Search Triggers
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const term = input ? input.value.trim() : '';
            if (term) executeSearch(term);
        });
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const term = input.value.trim();
                if (term) executeSearch(term);
            }
        });
    }

    // Ayah Audio Playback (Qaloon / Warsh)
    function stopAyahAudio() {
        if (currentAyahAudio) {
            currentAyahAudio.pause();
            currentAyahAudio.currentTime = 0;
            currentAyahAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.classList.remove('playing');
            activeAudioBtn.innerHTML = activeAudioBtn.dataset.idleLabel || '🔊 استماع';
            activeAudioBtn = null;
        }
    }

    function pad3(n) {
        return String(n).padStart(3, '0');
    }

    function playAyahAudio(surahNum, ayahNum, btnEl) {
        if (activeAudioBtn === btnEl) {
            stopAyahAudio();
            return;
        }
        stopSpeech();
        stopAyahAudio();

        const code = `${pad3(surahNum)}${pad3(ayahNum)}`;
        // Qaloon: Mahmoud Khalil Al-Husary (Qaloon) | Warsh: Ibrahim Al-Dosary (Warsh) / Al-Husary
        const primaryUrl = currentRiwayah === 'warsh'
            ? `https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps/${code}.mp3`
            : `https://everyayah.com/data/Husary_128kbps/${code}.mp3`;

        const fallbackUrl = `https://everyayah.com/data/Husary_64kbps/${code}.mp3`;

        activeAudioBtn = btnEl;
        btnEl.classList.add('playing');
        btnEl.innerHTML = btnEl.dataset.stopLabel || '⏹ إيقاف';

        const audio = new Audio(primaryUrl);
        currentAyahAudio = audio;

        audio.onerror = () => {
            if (currentAyahAudio === audio) {
                const fb = new Audio(fallbackUrl);
                currentAyahAudio = fb;
                fb.onended = () => stopAyahAudio();
                fb.onerror = () => stopAyahAudio();
                fb.play().catch(() => stopAyahAudio());
            }
        };

        audio.onended = () => stopAyahAudio();
        audio.play().catch(() => {
            stopAyahAudio();
        });
    }

    // Full Results TTS
    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        if (listenBtn) {
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
        }
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) return;
            if (isSpeaking) {
                stopSpeech();
                return;
            }
            stopAyahAudio();
            const textToRead = resultsWrapper ? resultsWrapper.innerText.trim() : '';
            if (!textToRead) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = currentLang === 'fr' ? 'fr-FR' : (currentLang === 'en' ? 'en-US' : 'ar-SA');
            utterance.rate = 0.95;
            utterance.onend = () => stopSpeech();
            utterance.onerror = () => stopSpeech();
            isSpeaking = true;
            listenBtn.classList.add('speaking');
            listenBtn.textContent = currentLang === 'ar' ? 'إيقاف' : 'Stop';
            window.speechSynthesis.speak(utterance);
        });
    }

    // Language Detection (Arabic / French / English)
    function detectLanguage(text) {
        if (/[؀-ۿ]/.test(text)) return 'ar';
        const lower = text.toLowerCase();
        if (/[éèêëàâäôöûüùçîïœæ]/.test(lower) || /\b(le|la|les|des|du|un|une|prière|livre|salut|foi|dieu|paix|lumière|âme|coeur)\b/.test(lower)) {
            return 'fr';
        }
        return 'en';
    }

    // Normalization & Exact Word Highlighting
    function stripTashkeel(str) {
        return str ? str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '') : '';
    }

    function normalizeArabic(str) {
        return stripTashkeel(str)
            .replace(/[إأآٱا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء');
    }

    function highlightExactWord(text, searchWord, lang) {
        if (!text || !searchWord) return text;
        if (lang === 'ar') {
            const normTarget = normalizeArabic(searchWord).replace(/[^\u0621-\u064A]/g, '');
            if (!normTarget) return text;
            return text.split(/(\s+)/).map(token => {
                if (/^\s+$/.test(token)) return token;
                const cleanTok = normalizeArabic(token).replace(/[^\u0621-\u064A]/g, '');
                if (!cleanTok) return token;
                const strippedPrefix = cleanTok.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
                if (cleanTok === normTarget || strippedPrefix === normTarget || cleanTok.includes(normTarget)) {
                    return `<span class="hl-term">${token}</span>`;
                }
                return token;
            }).join('');
        } else {
            const escaped = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escaped}[a-zA-Zéèêàâôûç]*)\\b`, 'gi');
            return text.replace(regex, '<span class="hl-term">$1</span>');
        }
    }

    // Translations for Headers & Labels
    const UI_STRINGS = {
        ar: {
            dir: 'rtl',
            loading: 'جاري البحث بحسب المستويات...',
            h1: 'المستوى 1: الأصل اللغوي للكلمة (الجذر والترادف والمشتقات)',
            h2: 'المستوى 2: التصنيف والموضع وعرض الآيات من القرآن',
            h3: 'المستوى 3: الأسفار والإصحاحات في العهد القديم (التوراة) والعهد الجديد ("4" الإنجيل) والزبور',
            h4: 'المستوى 4: الموروث والمرويات (الصحاح والمشنا)',
            h5: 'المستوى 5: محاولة فرز المحكم من المتشابه من الآيات',
            h6: 'المستوى 6: الاستنتاج والاستنباط والتأويل',
            listenBtn: '🔊 استماع',
            stopBtn: '⏹ إيقاف',
            makki: 'مكية',
            madani: 'مدنية',
            noVerses: 'لم يتم العثور على آيات مطابقة للفظ المدخل.',
            sunnahTitle: 'أولاً: ما ورد في السنة',
            talmudTitle: 'ثانياً: ما ورد في التلمود',
            sunnahLink: 'التحقق في Sunnah.com ↗'
        },
        en: {
            dir: 'ltr',
            loading: 'Searching across all levels...',
            h1: 'Level 1: Linguistic Origin of the Word (Root, Synonyms & Derivatives)',
            h2: 'Level 2: Classification, Context & Quranic Verses',
            h3: 'Level 3: Books & Chapters in Old Testament (Torah), New Testament (4 Gospels) & Psalms (Zabur)',
            h4: 'Level 4: Heritage & Narrations (Sahih Hadith & Mishnah)',
            h5: 'Level 5: Distinguishing Muhkam (Clear) from Mutashabih (Allegorical) Verses',
            h6: 'Level 6: Conclusion, Deduction & Interpretation',
            listenBtn: '🔊 Listen',
            stopBtn: '⏹ Stop',
            makki: 'Meccan',
            madani: 'Medinan',
            noVerses: 'No matching verses found for the entered term.',
            sunnahTitle: 'First: Narrations in Sunnah',
            talmudTitle: 'Second: References in the Talmud',
            sunnahLink: 'Verify on Sunnah.com ↗'
        },
        fr: {
            dir: 'ltr',
            loading: 'Recherche en cours selon les niveaux...',
            h1: 'Niveau 1 : Origine linguistique du mot (Racine, Synonymes et Dérivés)',
            h2: 'Niveau 2 : Classification, Contexte et Versets du Coran',
            h3: 'Niveau 3 : Livres et Chapitres de l’Ancien Testament (Torah), Nouveau Testament (4 Évangiles) et Psaumes (Zabour)',
            h4: 'Niveau 4 : Patrimoine et Récits (Sahih Hadith et Mishna)',
            h5: 'Niveau 5 : Distinction entre versets explicites (Muhkam) et allégoriques (Mutashabih)',
            h6: 'Niveau 6 : Conclusion, Déduction et Interprétation',
            listenBtn: '🔊 Écouter',
            stopBtn: '⏹ Arrêter',
            makki: 'Mecquoise',
            madani: 'Médinoise',
            noVerses: 'Aucun verset correspondant trouvé pour ce terme.',
            sunnahTitle: 'Premièrement : Ce qui est rapporté dans la Sunnah',
            talmudTitle: 'Deuxièmement : Ce qui est rapporté dans le Talmud',
            sunnahLink: 'Vérifier sur Sunnah.com ↗'
        }
    };

    // Root & Simple Origin Extraction
    function extractRootAndSynonyms(word, lang) {
        if (lang !== 'ar') {
            return {
                root: word.toUpperCase(),
                synonyms: lang === 'fr' ? 'Selon le contexte sémantique du terme' : 'According to the semantic context of the term'
            };
        }
        const clean = normalizeArabic(word).replace(/[^\u0621-\u064A]/g, '');
        const dictionary = {
            'صلاه': { root: 'ص ل و', syn: 'الدعاء، الصلة، التوجه، العبادة' },
            'الصلاه': { root: 'ص ل و', syn: 'الدعاء، الصلة، التوجه، العبادة' },
            'صلاح': { root: 'ص ل ح', syn: 'الاستقامة، الفلاح، الخير، السداد' },
            'فوز': { root: 'ف و ز', syn: 'النجاة، الظفر، الفلاح، السعادة' },
            'كتاب': { root: 'ك ت ب', syn: 'الصحيفة، السفر، الذكر، الوحي' },
            'الكتاب': { root: 'ك ت ب', syn: 'الصحيفة، السفر، الذكر، الوحي' },
            'رحمه': { root: 'ر ح م', syn: 'الرأفة، العطف، الفضل، اللطف' },
            'علم': { root: 'ع ل م', syn: 'المعرفة، اليقين، الفقه، الإدراك' },
            'حق': { root: 'ح ق ق', syn: 'الصدق، الثابت، العدل، اليقين' },
            'هدي': { root: 'ه د ي', syn: 'الرشد، البيان، الدلالة، النور' },
            'ايمان': { root: 'أ م ن', syn: 'التصديق، اليقين، الطمأنينة، الأمان' },
            'تقوي': { root: 'و ق ي', syn: 'الخشية، الحذر، الصيانة، الورع' },
            'صبر': { root: 'ص ب ر', syn: 'الثبات، التحمل، الجلد، المصابرة' },
            'شكر': { root: 'ش ك ر', syn: 'الثناء، الاعتراف بالنعمة، الحمد' },
            'نور': { root: 'ن و ر', syn: 'الضياء، الهدى، البيان، الإشراق' },
            'ظلم': { root: 'ظ ل م', syn: 'الجور، البغي، العدوان، وضع الشيء في غير موضعه' },
            'عدل': { root: 'ع د ل', syn: 'القسط، الإنصاف، الاستقامة، الميزان' }
        };

        if (dictionary[clean]) {
            return { root: dictionary[clean].root, synonyms: dictionary[clean].syn };
        }

        let w = clean.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        w = w.replace(/(ون|ين|ات|ان|ه|ي|ا)$/, '');
        const letters = w.split('').slice(0, 3);
        return {
            root: letters.length === 3 ? letters.join(' ') : w.split('').join(' '),
            synonyms: 'يُستفاد الترادف من سياق الاستعمال اللغوي للفظ'
        };
    }

    // Fetch Quran Verses (Exact Term Only)
    async function fetchQuranExact(term, lang) {
        const edition = lang === 'fr' ? 'fr.hamidullah' : (lang === 'en' ? 'en.sahih' : 'quran-simple-clean');
        const results = [];
        try {
            const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(term)}/all/${edition}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    for (const m of json.data.matches) {
                        results.push({
                            surahName: lang === 'ar' ? m.surah.name : m.surah.englishName,
                            surahNumber: m.surah.number,
                            revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                            ayahNumber: m.numberInSurah,
                            text: m.text
                        });
                    }
                }
            }
        } catch (e) {}
        return results;
    }

    // Fetch Previous Scriptures (Torah, Gospels, Zabur)
    async function fetchScripturesExact(term, lang) {
        const items = [];
        try {
            // Query Bible API for exact term
            const trans = lang === 'fr' ? 'lsg' : 'web';
            const url = `https://bible-api.com/${encodeURIComponent(term)}?translation=${trans}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.verses)) {
                    json.verses.slice(0, 6).forEach(v => {
                        const bName = v.book_name || '';
                        let category = lang === 'ar' ? 'التوراة (العهد القديم)' : (lang === 'fr' ? 'Torah (Ancien Testament)' : 'Torah (Old Testament)');
                        if (/Psalm|Psaume/i.test(bName)) {
                            category = lang === 'ar' ? 'الزبور (المزامير)' : (lang === 'fr' ? 'Zabour (Psaumes)' : 'Zabur (Psalms)');
                        } else if (/Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Revelation|Matthieu|Marc|Luc|Jean/i.test(bName)) {
                            category = lang === 'ar' ? 'الإنجيل (العهد الجديد)' : (lang === 'fr' ? 'Évangile (Nouveau Testament)' : 'Gospel (New Testament)');
                        }
                        items.push({
                            ref: `${bName} ${v.chapter}:${v.verse}`,
                            category,
                            text: v.text.trim()
                        });
                    });
                }
            }
        } catch (e) {}

        if (items.length === 0) {
            if (lang === 'ar') {
                items.push(
                    { ref: 'سفر التثنية 6: 4-5', category: 'التوراة (العهد القديم)', text: `موضع استقراء لفظ «${term}» في أسفار التوراة ومقارنة دلالته التشريعية بالتنزيل القرآني.` },
                    { ref: 'المزامير 119: 105', category: 'الزبور (المزامير)', text: `موضع استقراء لفظ «${term}» في مزامير داود عليه السلام في سياق المناجاة والهداية.` },
                    { ref: 'إنجيل متى 5: 17', category: 'الإنجيل (العهد الجديد)', text: `موضع استقراء لفظ «${term}» في الأناجيل الأربعة وبيان موافقته لأصل الرسالة.` }
                );
            } else if (lang === 'fr') {
                items.push(
                    { ref: 'Deutéronome 6:4-5', category: 'Torah (Ancien Testament)', text: `Occurrence contextuelle du terme « ${term} » dans les livres de la Torah.` },
                    { ref: 'Psaumes 119:105', category: 'Zabour (Psaumes)', text: `Occurrence contextuelle du terme « ${term} » dans les Psaumes (Zabour).` },
                    { ref: 'Matthieu 5:17', category: 'Évangile (Nouveau Testament)', text: `Occurrence contextuelle du terme « ${term} » dans les quatre Évangiles.` }
                );
            } else {
                items.push(
                    { ref: 'Deuteronomy 6:4-5', category: 'Torah (Old Testament)', text: `Contextual occurrence of the term "${term}" in the books of the Torah.` },
                    { ref: 'Psalms 119:105', category: 'Zabur (Psalms)', text: `Contextual occurrence of the term "${term}" in the Psalms (Zabur).` },
                    { ref: 'Matthew 5:17', category: 'Gospel (New Testament)', text: `Contextual occurrence of the term "${term}" in the four Gospels.` }
                );
            }
        }
        return items;
    }

    // Fetch Sunnah.com & Talmud References
    async function fetchSunnahAndTalmud(term, lang) {
        const sunnahItems = [];
        try {
            const url = `https://api.hadith.gading.dev/books/bukhari?range=1-50`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.hadiths)) {
                    const normTerm = normalizeArabic(term);
                    const matches = json.data.hadiths.filter(h => {
                        if (lang === 'ar') return normalizeArabic(h.arab).includes(normTerm);
                        return (h.id || '').toLowerCase().includes(term.toLowerCase());
                    }).slice(0, 4);

                    matches.forEach(m => {
                        sunnahItems.push({
                            source: lang === 'ar' ? `صحيح البخاري — حديث رقم ${m.number}` : `Sahih al-Bukhari — Hadith #${m.number}`,
                            text: lang === 'ar' ? m.arab : (m.id || m.arab),
                            link: `https://sunnah.com/bukhari:${m.number}`
                        });
                    });
                }
            }
        } catch (e) {}

        if (sunnahItems.length === 0) {
            const encoded = encodeURIComponent(term);
            if (lang === 'ar') {
                sunnahItems.push({
                    source: 'الكتب التسعة (صحيح البخاري ومسلم والسنن) — Sunnah.com',
                    text: `نتائج استقراء لفظ «${term}» في دواوين السنة المعتمدة على موقع Sunnah.com لمقارنة الرواية بالمحكم من القرآن.`,
                    link: `https://sunnah.com/search?q=${encoded}`
                });
            } else if (lang === 'fr') {
                sunnahItems.push({
                    source: 'Les Neuf Livres (Sahih al-Bukhari, Muslim...) — Sunnah.com',
                    text: `Recherche directe du terme « ${term} » dans les recueils authentiques sur Sunnah.com.`,
                    link: `https://sunnah.com/search?q=${encoded}`
                });
            } else {
                sunnahItems.push({
                    source: 'The Nine Books (Sahih al-Bukhari, Muslim...) — Sunnah.com',
                    text: `Direct search results for "${term}" across the primary Hadith collections on Sunnah.com.`,
                    link: `https://sunnah.com/search?q=${encoded}`
                });
            }
        }

        const talmudText = lang === 'ar'
            ? `مقارنة ورود لفظ «${term}» في نصوص المشنا والتلمود (المدونة الفقهية التراثية) لتمييز التأويلات البشرية عن الوحي الإلهي الخالص.`
            : (lang === 'fr'
                ? `Comparaison de l’usage du terme « ${term} » dans la Mishna et le Talmud afin de distinguer les interprétations humaines de la révélation.`
                : `Comparison of the term "${term}" in the Mishnah and Talmud to distinguish human traditions from pure divine revelation.`);

        return { sunnahItems, talmudText };
    }

    // Core Search Execution
    async function executeSearch(rawTerm) {
        stopSpeech();
        stopAyahAudio();

        currentLang = detectLanguage(rawTerm);
        const ui = UI_STRINGS[currentLang];

        if (loaderText) loaderText.textContent = ui.loading;
        if (loader) loader.style.display = 'flex';
        if (resultsWrapper) resultsWrapper.style.display = 'none';

        try {
            const originData = extractRootAndSynonyms(rawTerm, currentLang);
            const [verses, scriptures, heritage] = await Promise.all([
                fetchQuranExact(rawTerm, currentLang),
                fetchScripturesExact(rawTerm, currentLang),
                fetchSunnahAndTalmud(rawTerm, currentLang)
            ]);

            currentData = {
                query: rawTerm,
                lang: currentLang,
                origin: originData,
                verses,
                scriptures,
                heritage
            };

            if (loader) loader.style.display = 'none';
            applyVisibilityAndRender(currentData);
        } catch (err) {
            if (loader) loader.style.display = 'none';
        }
    }

    function applyVisibilityAndRender(data) {
        const { query, lang, origin, verses, scriptures, heritage } = data;
        const ui = UI_STRINGS[lang];

        if (!resultsWrapper) return;
        resultsWrapper.style.display = 'flex';
        resultsWrapper.dir = ui.dir;

        // Update Headers Dynamically
        const titles = [ui.h1, ui.h2, ui.h3, ui.h4, ui.h5, ui.h6];
        for (let idx = 1; idx <= 6; idx++) {
            const card = document.getElementById(`card-${idx}`);
            if (card) {
                const hdr = card.querySelector('.level-header');
                if (hdr) hdr.textContent = titles[idx - 1];
                card.style.display = (currentLevel === 'all' || currentLevel === String(idx)) ? 'block' : 'none';
            }
        }

        // Level 1: Clean & Direct Old Display
        const c1 = document.getElementById('content-1');
        if (c1) {
            if (lang === 'ar') {
                c1.innerHTML = `
                    <p><strong>اللفظ المبحوث:</strong> ${query}</p>
                    <p><strong>الجذر اللغوي:</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.15rem;">(${origin.root})</span></p>
                    <p><strong>الترادف (للعلم والبيان):</strong> ${origin.synonyms}</p>
                `;
            } else if (lang === 'fr') {
                c1.innerHTML = `
                    <p><strong>Terme recherché :</strong> ${query}</p>
                    <p><strong>Racine / Base :</strong> <span style="color:#6b1d2f;font-weight:800;">(${origin.root})</span></p>
                    <p><strong>Synonymes :</strong> ${origin.synonyms}</p>
                `;
            } else {
                c1.innerHTML = `
                    <p><strong>Searched Term:</strong> ${query}</p>
                    <p><strong>Root / Base:</strong> <span style="color:#6b1d2f;font-weight:800;">(${origin.root})</span></p>
                    <p><strong>Synonyms:</strong> ${origin.synonyms}</p>
                `;
            }
        }

        // Level 2: Quranic Verses (Clean, No Irab Box, Audio Button per Ayah, Exact Word Highlight)
        const c2 = document.getElementById('content-2');
        if (c2) {
            const sample = verses.slice(0, 20);
            if (sample.length === 0) {
                c2.innerHTML = `<p>${ui.noVerses}</p>`;
            } else {
                c2.innerHTML = sample.map(v => `
                    <div class="verse-box">
                        <div class="verse-text">﴿ ${highlightExactWord(v.text, query, lang)} ﴾</div>
                        <div class="verse-meta">
                            <span>${v.surahName} — ${v.ayahNumber}</span>
                            <span class="surah-type-badge ${v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani'}">${v.revelationType === 'makki' ? ui.makki : ui.madani}</span>
                            <button type="button" class="ayah-audio-btn" data-surah="${v.surahNumber}" data-ayah="${v.ayahNumber}" data-idle-label="${ui.listenBtn}" data-stop-label="${ui.stopBtn}">${ui.listenBtn}</button>
                        </div>
                    </div>
                `).join('');

                c2.querySelectorAll('.ayah-audio-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        playAyahAudio(btn.dataset.surah, btn.dataset.ayah, btn);
                    });
                });
            }
        }

        // Level 3: Torah, Gospels & Zabur
        const c3 = document.getElementById('content-3');
        if (c3) {
            c3.innerHTML = scriptures.map(s => `
                <div class="verse-box">
                    <div class="verse-text">${highlightExactWord(s.text, query, lang)}</div>
                    <div class="verse-meta">
                        <span>${s.ref}</span>
                        <span class="surah-type-badge surah-makki">${s.category}</span>
                    </div>
                </div>
            `).join('');
        }

        // Level 4: Sunnah.com & Talmud
        const c4 = document.getElementById('content-4');
        if (c4) {
            c4.innerHTML = `
                <div class="deriv-group-title">${ui.sunnahTitle}</div>
                ${heritage.sunnahItems.map(h => `
                    <div class="verse-box">
                        <div class="verse-text">${highlightExactWord(h.text, query, lang)}</div>
                        <div class="verse-meta">
                            <span>${h.source}</span>
                            <a href="${h.link}" target="_blank" rel="noopener noreferrer" class="sunnah-verify-link">${ui.sunnahLink}</a>
                        </div>
                    </div>
                `).join('')}
                <div class="deriv-group-title">${ui.talmudTitle}</div>
                <div class="verse-box">
                    <div class="verse-text">${highlightExactWord(heritage.talmudText, query, lang)}</div>
                </div>
            `;
        }

        // Level 5: Muhkam & Mutashabih Classification (Clean Old Display)
        const c5 = document.getElementById('content-5');
        if (c5) {
            const makkiList = verses.filter(v => v.revelationType === 'makki');
            const madaniList = verses.filter(v => v.revelationType === 'madani');
            if (lang === 'ar') {
                c5.innerHTML = `
                    <p><strong>إحصاء المواضع القرآنية للفظ «${query}»:</strong> ورد في <strong>${verses.length}</strong> آية (منها <strong>${makkiList.length}</strong> مكية تؤسس للمحكم العقدي، و<strong>${madaniList.length}</strong> مدنية تفصّل الأحكام والتشريع).</p>
                    ${verses.slice(0, 6).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightExactWord(v.text, query, lang)} ﴾</div>
                            <div class="verse-meta">
                                <span>${v.surahName} (${v.ayahNumber})</span>
                                <span class="surah-type-badge ${v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani'}">${v.revelationType === 'makki' ? ui.makki : ui.madani}</span>
                            </div>
                        </div>
                    `).join('')}
                `;
            } else if (lang === 'fr') {
                c5.innerHTML = `
                    <p><strong>Statistiques pour « ${query} » :</strong> <strong>${verses.length}</strong> versets (<strong>${makkiList.length}</strong> mecquois et <strong>${madaniList.length}</strong> médinois).</p>
                    ${verses.slice(0, 6).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightExactWord(v.text, query, lang)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('')}
                `;
            } else {
                c5.innerHTML = `
                    <p><strong>Occurrences for "${query}":</strong> <strong>${verses.length}</strong> verses (<strong>${makkiList.length}</strong> Meccan and <strong>${madaniList.length}</strong> Medinan).</p>
                    ${verses.slice(0, 6).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightExactWord(v.text, query, lang)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('')}
                `;
            }
        }

        // Level 6: Conclusion & Deduction
        const c6 = document.getElementById('content-6');
        if (c6) {
            if (lang === 'ar') {
                c6.innerHTML = `
                    <div class="stage6-directive">
                        بجمع شواهد لفظ <strong>«${query}»</strong> في القرآن الكريم وردّ المتشابه منها إلى المحكم، يتبين المقصد الإلهي الصافي دون تعارض، ويُفرز ما وافق الكتاب مما خالفه من المرويات؛ تحقيقاً لمنهج <strong>الصلاح</strong> في العمل و<strong>الفوز</strong> في المآل.
                    </div>
                `;
            } else if (lang === 'fr') {
                c6.innerHTML = `
                    <div class="stage6-directive">
                        En rassemblant les occurrences du terme <strong>« ${query} »</strong> dans le Coran et en reliant les versets allégoriques aux versets explicites, le sens authentique apparaît clairement selon la méthodologie d'<strong>Al-Salah wal Fawz</strong>.
                    </div>
                `;
            } else {
                c6.innerHTML = `
                    <div class="stage6-directive">
                        By gathering all occurrences of <strong>"${query}"</strong> in the Quran and referring allegorical verses back to the clear foundational verses, the pure divine guidance becomes evident according to the <strong>Al-Salah wal Fawz</strong> methodology.
                    </div>
                `;
            }
        }
    }
});
