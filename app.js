document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const loader = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');

    const btnPyr1 = document.getElementById('btn-pyr-1');
    const pyrBox1 = document.getElementById('pyramid-box-1');
    const btnBack1 = document.getElementById('btn-back-1');

    const btnPyr2 = document.getElementById('btn-pyr-2');
    const pyrBox2 = document.getElementById('pyramid-box-2');
    const btnBack2 = document.getElementById('btn-back-2');

    const btnArticles = document.getElementById('btn-articles');
    const articlesBox = document.getElementById('articles-box');
    const btnBackArticles = document.getElementById('btn-back-articles');

    let currentLevel = 'all';
    let currentData = null;
    let isSpeaking = false;
    let currentArticlePage = 1;
    let selectedRiwayah = 'qaloon'; // 'qaloon' or 'warsh'
    let activeAudio = null;
    let activeAudioBtn = null;

    // Riwayah Switcher Setup (under levels 1-6)
    function initRiwayahBar() {
        let bar = document.getElementById('riwayah-bar');
        if (!bar) {
            const levelsBar = document.getElementById('levels-bar');
            if (levelsBar && levelsBar.parentNode) {
                bar = document.createElement('div');
                bar.id = 'riwayah-bar';
                bar.className = 'riwayah-bar';
                bar.innerHTML = `
                    <span class="riwayah-label">تلاوة رواية</span>
                    <button type="button" class="riwayah-btn active" data-riwayah="qaloon">قالون</button>
                    <button type="button" class="riwayah-btn" data-riwayah="warsh">ورش</button>
                `;
                levelsBar.parentNode.insertBefore(bar, levelsBar.nextSibling);
            }
        }
        const rBtns = document.querySelectorAll('.riwayah-btn');
        rBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                rBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedRiwayah = btn.dataset.riwayah;
                stopAyahAudio();
            });
        });
    }
    initRiwayahBar();

    // Pyramids Toggles
    if (btnPyr1 && pyrBox1) {
        btnPyr1.addEventListener('click', () => {
            const show = pyrBox1.style.display === 'none' || pyrBox1.style.display === '';
            pyrBox1.style.display = show ? 'block' : 'none';
            if (show) {
                if (pyrBox2) pyrBox2.style.display = 'none';
                if (articlesBox) articlesBox.style.display = 'none';
            }
        });
    }
    if (btnBack1 && pyrBox1) {
        btnBack1.addEventListener('click', () => { pyrBox1.style.display = 'none'; });
    }

    if (btnPyr2 && pyrBox2) {
        btnPyr2.addEventListener('click', () => {
            const show = pyrBox2.style.display === 'none' || pyrBox2.style.display === '';
            pyrBox2.style.display = show ? 'block' : 'none';
            if (show) {
                if (pyrBox1) pyrBox1.style.display = 'none';
                if (articlesBox) articlesBox.style.display = 'none';
            }
        });
    }
    if (btnBack2 && pyrBox2) {
        btnBack2.addEventListener('click', () => { pyrBox2.style.display = 'none'; });
    }

    // Articles Toggle & 24 Grid (2 Pages x 12)
    function getArticleByNumber(num) {
        if (typeof ARTICLES_DATA !== 'undefined' && Array.isArray(ARTICLES_DATA)) {
            return ARTICLES_DATA.find(a => Number(a.id) === num || Number(a.number) === num) || ARTICLES_DATA[num - 1];
        }
        return null;
    }

    function renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        const viewer = document.getElementById('article-viewer');
        if (!grid) return;
        grid.innerHTML = '';

        if (btnBackArticles) {
            btnBackArticles.style.display = 'none';
        }

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
                    if (art && art.content && art.content.trim() !== '') {
                        const paras = art.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
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
            <span class="down-scroll-hint" title="المقال يظهر بالأسفل">⬇</span>
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

    if (btnArticles && articlesBox) {
        btnArticles.addEventListener('click', () => {
            const show = articlesBox.style.display === 'none' || articlesBox.style.display === '';
            articlesBox.style.display = show ? 'block' : 'none';
            if (show) {
                if (pyrBox1) pyrBox1.style.display = 'none';
                if (pyrBox2) pyrBox2.style.display = 'none';
                renderArticlesGrid();
            }
        });
    }

    // Level Buttons Filtering
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lvl = btn.dataset.lvl;
            if (currentLevel === lvl) {
                currentLevel = 'all';
                levelBtns.forEach(b => b.classList.remove('active'));
            } else {
                currentLevel = lvl;
                levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
            if (currentData) {
                renderResults(currentData);
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
            currentLevel = 'all';
            levelBtns.forEach(b => b.classList.remove('active'));
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            for (let i = 1; i <= 6; i++) {
                const c = document.getElementById(`card-${i}`);
                const body = document.getElementById(`content-${i}`);
                if (c) c.style.display = 'none';
                if (body) body.innerHTML = '';
            }
            if (loader) loader.style.display = 'none';
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

    // Full Result Speech
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
            const textToRead = resultsWrapper ? resultsWrapper.innerText.trim() : '';
            if (!textToRead) return;
            stopAyahAudio();
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = currentData && currentData.lang === 'en' ? 'en-US' : (currentData && currentData.lang === 'fr' ? 'fr-FR' : 'ar-SA');
            utterance.rate = 0.95;
            utterance.onend = () => stopSpeech();
            utterance.onerror = () => stopSpeech();
            isSpeaking = true;
            listenBtn.classList.add('speaking');
            listenBtn.textContent = 'إيقاف';
            window.speechSynthesis.speak(utterance);
        });
    }

    // Per-Ayah Audio Player (Qaloon & Warsh)
    function stopAyahAudio() {
        if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.classList.remove('playing');
            const lbl = activeAudioBtn.dataset.defaultLabel || '🔊 استماع';
            activeAudioBtn.textContent = lbl;
            activeAudioBtn = null;
        }
    }

    function pad3(n) {
        return String(n).padStart(3, '0');
    }

    window.playAyahRiwayah = function(btnEl, surahNum, ayahNum) {
        if (activeAudioBtn === btnEl) {
            stopAyahAudio();
            return;
        }
        stopSpeech();
        stopAyahAudio();

        const code = `${pad3(surahNum)}${pad3(ayahNum)}`;
        // EveryAyah high-speed servers for Qaloon (Husary) and Warsh (Yassin Al-Jazaery / Ibrahim Al-Dosary)
        const primaryUrl = selectedRiwayah === 'qaloon'
            ? `https://everyayah.com/data/Husary_128kbps/${code}.mp3`
            : `https://everyayah.com/data/warsh/warsh_yassin_al_jazaery_64kbps/${code}.mp3`;
        const fallbackUrl = `https://everyayah.com/data/Husary_64kbps/${code}.mp3`;

        const audio = new Audio(primaryUrl);
        activeAudio = audio;
        activeAudioBtn = btnEl;
        btnEl.classList.add('playing');
        btnEl.textContent = '⏹ إيقاف';

        audio.onended = () => stopAyahAudio();
        audio.onerror = () => {
            if (audio.src !== fallbackUrl) {
                audio.src = fallbackUrl;
                audio.play().catch(() => stopAyahAudio());
            } else {
                stopAyahAudio();
            }
        };
        audio.play().catch(() => stopAyahAudio());
    };

    // Language Detection (Arabic, French, English)
    function detectLanguage(text) {
        if (/[؀-ۿ]/.test(text)) return 'ar';
        const lower = text.toLowerCase();
        if (/[éèêëàâäîïôöùûüçœæ]/.test(lower) || /(tion|ment|ance|ence|ique|isme|eur|euse|oir|age)$/.test(lower) || /^(priere|prière|livre|salut|foi|paix|lumiere|lumière|verite|vérité|justice|misericorde|miséricorde|creation|création|ame|âme|coeur|cœur|ciel|terre|eau|vie|mort)$/.test(lower)) {
            return 'fr';
        }
        return 'en';
    }

    // Text Normalization & Exact Term Highlighting (Focused strictly on the searched word)
    function stripTashkeel(str) {
        return str ? str.replace(/[ً-ٰٟـۖ-ۭ]/g, '') : '';
    }

    function normalizeArabic(str) {
        return stripTashkeel(str)
            .replace(/[إأآٱا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء')
            .replace(/ة/g, 'ه');
    }

    function highlightExactWord(text, word, lang) {
        if (!text || !word) return text;
        if (lang === 'ar') {
            const normTarget = normalizeArabic(word.trim()).replace(/[^ء-ي]/g, '');
            if (!normTarget) return text;
            const bareTarget = normTarget.replace(/^ال/, '');
            return text.split(/(\s+)/).map(token => {
                if (/^\s+$/.test(token)) return token;
                const cleanTok = normalizeArabic(token).replace(/[^ء-ي]/g, '');
                if (!cleanTok) return token;
                if (cleanTok === normTarget || cleanTok === bareTarget || cleanTok === 'ال' + bareTarget) {
                    return `<span class="hl-term">${token}</span>`;
                }
                return token;
            }).join('');
        } else {
            const escaped = word.trim().replace(/[.*+?^${}()|[\]\]/g, '\$&');
            const regex = new RegExp(`(\b${escaped}\b)`, 'gi');
            return text.replace(regex, '<span class="hl-term">$1</span>');
        }
    }

    // Translations for Headers & Labels
    const UI_TEXT = {
        ar: {
            dir: 'rtl',
            headers: {
                1: 'المستوى 1: الأصل اللغوي للكلمة (الجذر والترادف والمشتقات)',
                2: 'المستوى 2: التصنيف والموضع وعرض الآيات من القرآن',
                3: 'المستوى 3: الأسفار والإصحاحات في العهد القديم (التوراة) والعهد الجديد ("4" الإنجيل) والزبور',
                4: 'المستوى 4: الموروث والمرويات (الصحاح والمشنا)',
                5: 'المستوى 5: محاولة فرز المحكم من المتشابه من الآيات',
                6: 'المستوى 6: الاستنتاج والاستنباط والتأويل'
            },
            wordLabel: 'اللفظ المبحوث عنه:',
            rootLabel: 'الجذر اللغوي:',
            makki: 'مكية',
            madani: 'مدنية',
            listenBtn: '🔊 استماع',
            noVerses: 'لم يُعثر على مواضع مطابقة لهذا اللفظ في القرآن الكريم.',
            versesCount: (n) => `عدد المواضع القرآنية المطابقة للفظ: ${n} موضعاً`,
            torah: 'التوراة (العهد القديم)',
            zabur: 'الزبور',
            injeel: 'الإنجيل (العهد الجديد)',
            noBooks: 'لا توجد شواهد نصية مطابقة للفظ في الأسفار المتاحة حالياً.',
            sunnahTitle: 'أولاً: ما ورد في السنة',
            talmudTitle: 'ثانياً: ما ورد في التلمود',
            sunnahSource: 'المصدر: Sunnah.com ↗',
            sunnahSearchAll: 'البحث الشامل في Sunnah.com ↗',
            makkiSection: 'أولاً: المواضع المكية (التأسيس العقدي وبناء التصور)',
            madaniSection: 'ثانياً: المواضع المدنية (التشريع والتطبيق المجتمعي)',
            stage6Text: (w) => `إن التدبر المباشر للفظ <strong>«${w}»</strong> في مواضعه القرآنية ومقابلتها بالكتب السابقة والمرويات يفتح للباحث أفق الفهم السليم؛ ليُثمر علماً نافعاً يورث <strong>الصلاح</strong> في القلب والسلوك، ويُحقق <strong>الفوز</strong> في الدنيا والآخرة.`
        },
        en: {
            dir: 'ltr',
            headers: {
                1: 'Level 1: Linguistic Origin of the Word (Root, Synonyms & Derivatives)',
                2: 'Level 2: Classification, Context & Quranic Verses',
                3: 'Level 3: Books & Chapters in the Old Testament (Torah), New Testament (4 Gospels) & Psalms (Zabur)',
                4: 'Level 4: Heritage & Narrations (Sahih Hadith & Mishnah)',
                5: 'Level 5: Attempt to Distinguish Decisive (Muhkam) from Allegorical (Mutashabih) Verses',
                6: 'Level 6: Deduction, Inference & Interpretation'
            },
            wordLabel: 'Searched Term:',
            rootLabel: 'Linguistic Root / Origin:',
            makki: 'Meccan',
            madani: 'Medinan',
            listenBtn: '🔊 Listen',
            noVerses: 'No exact occurrences found for this term in the Holy Quran.',
            versesCount: (n) => `Exact Quranic occurrences found: ${n} verses`,
            torah: 'Torah (Old Testament)',
            zabur: 'Psalms (Zabur)',
            injeel: 'Gospel (New Testament)',
            noBooks: 'No exact matching passages found in the previous scriptures for this term.',
            sunnahTitle: 'First: What is Reported in the Sunnah',
            talmudTitle: 'Second: What is Reported in the Talmud',
            sunnahSource: 'Source: Sunnah.com ↗',
            sunnahSearchAll: 'Search Full Collection on Sunnah.com ↗',
            makkiSection: 'First: Meccan Verses (Foundational Creed & Worldview)',
            madaniSection: 'Second: Medinan Verses (Legislation & Social Application)',
            stage6Text: (w) => `Direct contemplation of the term <strong>"${w}"</strong> across its Quranic occurrences, compared with previous scriptures and narrations, guides the researcher to sound understanding—yielding beneficial knowledge that brings <strong>Righteousness (As-Salah)</strong> in heart and action, and achieves <strong>Success (Al-Fawz)</strong> in this life and the Hereafter.`
        },
        fr: {
            dir: 'ltr',
            headers: {
                1: 'Niveau 1 : Origine Linguistique du Mot (Racine, Synonymes et Dérivés)',
                2: 'Niveau 2 : Classification, Contexte et Versets du Coran',
                3: 'Niveau 3 : Livres et Chapitres de l’Ancien Testament (Torah), Nouveau Testament (4 Évangiles) et Psaumes (Zabour)',
                4: 'Niveau 4 : Patrimoine et Récits (Sahih Hadith et Mishna)',
                5: 'Niveau 5 : Tentative de Distinction entre les Versets Explicites (Muhkam) et Allégoriques (Mutashabih)',
                6: 'Niveau 6 : Déduction, Inférence et Interprétation'
            },
            wordLabel: 'Terme recherché :',
            rootLabel: 'Racine linguistique :',
            makki: 'Mecquoise',
            madani: 'Médinoise',
            listenBtn: '🔊 Écouter',
            noVerses: 'Aucune occurrence exacte trouvée pour ce terme dans le Saint Coran.',
            versesCount: (n) => `Occurrences coraniques exactes trouvées : ${n} versets`,
            torah: 'Torah (Ancien Testament)',
            zabur: 'Psaumes (Zabour)',
            injeel: 'Évangile (Nouveau Testament)',
            noBooks: 'Aucun passage correspondant trouvé dans les Écritures antérieures pour ce terme.',
            sunnahTitle: 'Premièrement : Ce qui est rapporté dans la Sunnah',
            talmudTitle: 'Deuxièmement : Ce qui est rapporté dans le Talmud',
            sunnahSource: 'Source : Sunnah.com ↗',
            sunnahSearchAll: 'Recherche complète sur Sunnah.com ↗',
            makkiSection: 'Premièrement : Versets Mecquois (Fondement de la Foi)',
            madaniSection: 'Deuxièmement : Versets Médinois (Législation et Pratique)',
            stage6Text: (w) => `La méditation directe du terme <strong>« ${w} »</strong> à travers ses occurrences coraniques, confrontées aux Écritures antérieures et aux récits, éclaire la compréhension juste menant à la <strong>Droiture (As-Salah)</strong> et au <strong>Succès (Al-Fawz)</strong>.`
        }
    };

    // Fast Root & Basic Info Extractor (Clean & Concise like original design)
    function getWordLinguisticInfo(word, lang) {
        if (lang !== 'ar') {
            return {
                root: word.toLowerCase(),
                summary: lang === 'fr'
                    ? `Analyse directe du terme « ${word} » dans sa forme exacte sans dispersion.`
                    : `Direct analysis of the term "${word}" in its exact form without dispersion.`
            };
        }
        let w = normalizeArabic(word).split(/\s+/)[0] || '';
        const knownRoots = {
            'صلاح': 'ص ل ح', 'صلح': 'ص ل ح', 'صالح': 'ص ل ح', 'مصلح': 'ص ل ح', 'اصلاح': 'ص ل ح',
            'صلاه': 'ص ل و', 'صلاة': 'ص ل و', 'صلوات': 'ص ل و', 'يصلي': 'ص ل و', 'مصلين': 'ص ل و',
            'فوز': 'ف و ز', 'فاز': 'ف و ز', 'فائز': 'ف و ز', 'فائزون': 'ف و ز', 'مفازا': 'ف و ز',
            'كتاب': 'ك ت ب', 'كتب': 'ك ت ب', 'كاتب': 'ك ت ب', 'مكتوب': 'ك ت ب',
            'رحمه': 'ر ح م', 'رحمة': 'ر ح م', 'رحيم': 'ر ح م', 'رحمن': 'ر ح م',
            'علم': 'ع ل م', 'عالم': 'ع ل م', 'عليم': 'ع ل م', 'يعلم': 'ع ل م',
            'صدق': 'ص د ق', 'صادق': 'ص د ق', 'صديق': 'ص د ق', 'صدقه': 'ص د ق',
            'حق': 'ح ق ق', 'حقيقه': 'ح ق ق',
            'هدي': 'ه د ي', 'هدى': 'ه د ي', 'هادي': 'ه د ي', 'مهتدي': 'ه د ي',
            'ايمان': 'أ م ن', 'مؤمن': 'أ م ن', 'مؤمنون': 'أ م ن', 'امن': 'أ م ن',
            'تقوي': 'و ق ي', 'تقوى': 'و ق ي', 'متقين': 'و ق ي',
            'صبر': 'ص ب ر', 'صابر': 'ص ب ر', 'صابرين': 'ص ب ر',
            'شكر': 'ش ك ر', 'شاكر': 'ش ك ر', 'شكور': 'ش ك ر',
            'ذكر': 'ذ ك ر', 'تذكره': 'ذ ك ر', 'تذكرة': 'ذ ك ر',
            'قلب': 'ق ل ب', 'قلوب': 'ق ل ب',
            'نفس': 'ن ف س', 'انفس': 'ن ف س', 'نفوس': 'ن ف س',
            'عمل': 'ع م ل', 'اعمال': 'ع م ل',
            'نور': 'ن و ر', 'انوار': 'ن و ر',
            'ظلم': 'ظ ل م', 'ظالم': 'ظ ل م', 'ظلمات': 'ظ ل م',
            'عدل': 'ع د ل', 'عادل': 'ع د ل',
            'احسان': 'ح س ن', 'حسن': 'ح س ن', 'محسنين': 'ح س ن',
            'فلاح': 'ف ل ح', 'مفلحون': 'ف ل ح', 'افلح': 'ف ل ح'
        };
        if (knownRoots[w]) {
            return {
                root: knownRoots[w],
                summary: 'يمثل الجذر الأصلي للمادة اللغوية، ويُجرى الاستقراء في المستويات التالية على اللفظ المدخل نفسه بدقة.'
            };
        }
        let stripped = w.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        stripped = stripped.replace(/(ون|ين|ات|ان|ية|ه|ي|ا)$/, '');
        const letters = stripped.split('').slice(0, 3);
        return {
            root: letters.length >= 3 ? letters.join(' ') : stripped.split('').join(' '),
            summary: 'يمثل الأصل الحرفي للكلمة، ويُجرى الاستقراء في المستويات التالية على اللفظ المدخل نفسه بدقة.'
        };
    }

    // Fetch Quran Verses (Focused strictly on the searched word)
    async function fetchQuranExact(word, lang) {
        const cleanW = lang === 'ar' ? stripTashkeel(word).trim() : word.trim();
        const edition = lang === 'en' ? 'en.sahih' : (lang === 'fr' ? 'fr.hamidullah' : 'quran-simple-clean');
        const results = [];

        try {
            const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanW)}/all/${edition}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    const seen = new Set();
                    for (const m of json.data.matches) {
                        const key = `${m.surah.number}:${m.numberInSurah}`;
                        if (seen.has(key)) continue;
                        seen.add(key);

                        let arText = m.text;
                        let transText = null;
                        if (lang !== 'ar') {
                            transText = m.text;
                            try {
                                const arRes = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/quran-simple-clean`);
                                if (arRes.ok) {
                                    const arJson = await arRes.json();
                                    if (arJson && arJson.data) arText = arJson.data.text;
                                }
                            } catch (e) {}
                        }

                        results.push({
                            surahName: lang === 'ar' ? m.surah.name : `${m.surah.englishName} (${m.surah.name})`,
                            surahNumber: m.surah.number,
                            revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                            ayahNumber: m.numberInSurah,
                            arText,
                            transText
                        });
                        if (results.length >= 30) break;
                    }
                }
            }
        } catch (e) {}

        return results.sort((a, b) => (a.surahNumber - b.surahNumber) || (a.ayahNumber - b.ayahNumber));
    }

    // Fetch Previous Scriptures (Torah, Zabur, Injeel) focused on exact word
    async function fetchScripturesExact(word, lang) {
        const query = word.trim();
        const items = [];
        try {
            const bibleEdition = lang === 'fr' ? 'lsg' : 'web';
            const searchWord = lang === 'ar' ? translateBasicArToEn(query) : query;
            if (searchWord) {
                const url = `https://bible-api.com/${encodeURIComponent(searchWord)}?translation=${bibleEdition}`;
                // Use specific known key chapters or direct search fallback
                const samples = [
                    { ref: 'Genesis 1:1', book: 'Genesis', type: 'torah' },
                    { ref: 'Exodus 20:3', book: 'Exodus', type: 'torah' },
                    { ref: 'Deuteronomy 6:4', book: 'Deuteronomy', type: 'torah' },
                    { ref: 'Psalms 23:1', book: 'Psalms', type: 'zabur' },
                    { ref: 'Psalms 119:105', book: 'Psalms', type: 'zabur' },
                    { ref: 'Matthew 5:9', book: 'Matthew', type: 'injeel' },
                    { ref: 'Matthew 6:9', book: 'Matthew', type: 'injeel' },
                    { ref: 'John 1:1', book: 'John', type: 'injeel' }
                ];
                // Query Bolls.life open Bible search API (supports Arabic SVD, English KJV, French FRLSG)
                const transCode = lang === 'ar' ? 'SVD' : (lang === 'fr' ? 'FRLSG' : 'KJV');
                const searchApi = `https://bolls.life/v2/find/${transCode}?search=${encodeURIComponent(query)}&match_case=false&match_whole=true`;
                const res = await fetch(searchApi);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.results || []);
                    for (const v of list.slice(0, 12)) {
                        const bId = Number(v.book);
                        const bType = bId <= 5 ? 'torah' : (bId === 19 ? 'zabur' : (bId >= 40 ? 'injeel' : 'torah'));
                        const cleanText = (v.text || '').replace(/<[^>]+>/g, '').trim();
                        items.push({
                            bookName: getBibleBookName(bId, lang),
                            chapter: v.chapter,
                            verse: v.verse,
                            type: bType,
                            text: cleanText
                        });
                    }
                }
            }
        } catch (e) {}
        return items;
    }

    function translateBasicArToEn(w) {
        const clean = normalizeArabic(w);
        const map = { 'صلاه': 'prayer', 'صلاة': 'prayer', 'كتاب': 'book', 'سلام': 'peace', 'نور': 'light', 'حق': 'truth', 'رحمه': 'mercy', 'ايمان': 'faith', 'صبر': 'patience' };
        return map[clean] || w;
    }

    function getBibleBookName(id, lang) {
        const names = {
            1: { ar: 'التكوين', en: 'Genesis', fr: 'Genèse' },
            2: { ar: 'الخروج', en: 'Exodus', fr: 'Exode' },
            3: { ar: 'اللاويين', en: 'Leviticus', fr: 'Lévitique' },
            4: { ar: 'العدد', en: 'Numbers', fr: 'Nombres' },
            5: { ar: 'التثنية', en: 'Deuteronomy', fr: 'Deutéronome' },
            19: { ar: 'المزامير (الزبور)', en: 'Psalms (Zabur)', fr: 'Psaumes (Zabour)' },
            40: { ar: 'إنجيل متى', en: 'Gospel of Matthew', fr: 'Évangile selon Matthieu' },
            41: { ar: 'إنجيل مرقس', en: 'Gospel of Mark', fr: 'Évangile selon Marc' },
            42: { ar: 'إنجيل لوقا', en: 'Gospel of Luke', fr: 'Évangile selon Luc' },
            43: { ar: 'إنجيل يوحنا', en: 'Gospel of John', fr: 'Évangile selon Jean' }
        };
        if (names[id]) return names[id][lang] || names[id].ar;
        return lang === 'ar' ? `سفر رقم ${id}` : (lang === 'fr' ? `Livre ${id}` : `Book ${id}`);
    }

    // Fetch Sunnah.com & Talmud (Mishnah) focused on exact word
    async function fetchSunnahAndTalmudExact(word, lang) {
        const query = word.trim();
        const hadiths = [];
        try {
            // Dorar / HadithAPI search aligned with Sunnah.com Nine Books
            const res = await fetch(`https://hadithapi.com/public/api/hadiths?apiKey=$2y$10$7V6lK3w0yJ9p8qR5tN2xOuM4cB1vZ8nL6kH3jG2fD9sA4qW1eR7tY&hadithArabic=${encodeURIComponent(query)}&paginate=6`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.hadiths && Array.isArray(json.hadiths.data)) {
                    for (const h of json.hadiths.data) {
                        const text = lang === 'ar' ? h.hadithArabic : (h.hadithEnglish || h.hadithArabic);
                        const bookSlug = (h.bookSlug || 'bukhari').replace('sahih-', '');
                        hadiths.push({
                            book: lang === 'ar' ? (h.book ? h.book.bookName : 'صحيح البخاري') : (h.book ? h.book.bookName : 'Sahih al-Bukhari'),
                            number: h.hadithNumber || '',
                            text: text || '',
                            url: `https://sunnah.com/${bookSlug}:${h.hadithNumber || ''}`
                        });
                    }
                }
            }
        } catch (e) {}

        // Fallback curated & live Sefaria Mishnah search
        const mishnah = [];
        try {
            const sefQuery = lang === 'ar' ? translateBasicArToEn(query) : query;
            const res = await fetch(`https://www.sefaria.org/api/search-wrapper?query=${encodeURIComponent(sefQuery)}&type=text&field=exact&slop=0&size=4&filters[]=Mishnah`);
            if (res.ok) {
                const json = await res.json();
                const hits = (json && json.hits && json.hits.hits) ? json.hits.hits : [];
                for (const hit of hits) {
                    const src = hit._source || {};
                    const hl = (hit.highlight && hit.highlight.exact && hit.highlight.exact[0]) ? hit.highlight.exact[0].replace(/<[^>]+>/g, '') : '';
                    mishnah.push({
                        ref: src.ref || 'Mishnah',
                        text: hl || src.exact || ''
                    });
                }
            }
        } catch (e) {}

        return { hadiths, mishnah };
    }

    // Main Search Execution
    async function executeSearch(rawTerm) {
        stopSpeech();
        stopAyahAudio();
        if (resultsWrapper) resultsWrapper.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        const lang = detectLanguage(rawTerm);
        const t = UI_TEXT[lang];
        const lingInfo = getWordLinguisticInfo(rawTerm, lang);

        try {
            const [verses, scriptures, heritage] = await Promise.all([
                fetchQuranExact(rawTerm, lang),
                fetchScripturesExact(rawTerm, lang),
                fetchSunnahAndTalmudExact(rawTerm, lang)
            ]);

            currentData = {
                word: rawTerm,
                lang,
                lingInfo,
                verses,
                scriptures,
                heritage
            };

            if (loader) loader.style.display = 'none';
            renderResults(currentData);
        } catch (err) {
            if (loader) loader.style.display = 'none';
            if (resultsWrapper) {
                resultsWrapper.style.display = 'flex';
                const c1 = document.getElementById('card-1');
                const b1 = document.getElementById('content-1');
                if (c1 && b1) {
                    c1.style.display = 'block';
                    b1.innerHTML = `<p style="color:#b91c1c;font-weight:700;">حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.</p>`;
                }
            }
        }
    }

    // Render Clean Classic View
    function renderResults(data) {
        const { word, lang, lingInfo, verses, scriptures, heritage } = data;
        const t = UI_TEXT[lang];

        if (!resultsWrapper) return;
        resultsWrapper.style.display = 'flex';
        resultsWrapper.setAttribute('dir', t.dir);

        // Update all 6 headers in the user's search language
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) {
                const hdr = card.querySelector('.level-header');
                if (hdr) hdr.textContent = t.headers[i];
                card.style.display = (currentLevel === 'all' || currentLevel === String(i)) ? 'block' : 'none';
            }
        }

        // Level 1: Clean Linguistic Origin (Original simple style)
        const c1 = document.getElementById('content-1');
        if (c1) {
            c1.innerHTML = `
                <p><strong>${t.wordLabel}</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.15rem;">${word}</span></p>
                <p style="margin-top:6px;"><strong>${t.rootLabel}</strong> <span style="color:#1a2a4a;font-weight:800;font-size:1.15rem;">(${lingInfo.root})</span></p>
                <p style="margin-top:8px;color:#475569;">${lingInfo.summary}</p>
            `;
        }

        // Level 2: Quran Verses (Clean without irab-box, with Qaloon/Warsh play button)
        const c2 = document.getElementById('content-2');
        if (c2) {
            if (verses.length === 0) {
                c2.innerHTML = `<p>${t.noVerses}</p>`;
            } else {
                c2.innerHTML = `
                    <p style="margin-bottom:10px;font-weight:700;color:#1a2a4a;">${t.versesCount(verses.length)}</p>
                    ${verses.map(v => `
                        <div class="verse-box">
                            <div class="verse-top-row">
                                <div class="verse-text" dir="rtl">﴿ ${lang === 'ar' ? highlightExactWord(v.arText, word, 'ar') : v.arText} ﴾</div>
                                <button type="button" class="ayah-listen-btn" data-default-label="${t.listenBtn}" onclick="playAyahRiwayah(this, ${v.surahNumber}, ${v.ayahNumber})">${t.listenBtn}</button>
                            </div>
                            ${v.transText ? `<div class="verse-trans" dir="ltr" style="margin-top:6px;color:#1e293b;font-size:1rem;">${highlightExactWord(v.transText, word, lang)}</div>` : ''}
                            <div class="verse-meta">
                                <span>${v.surahName} — ${lang === 'ar' ? 'آية' : (lang === 'fr' ? 'verset' : 'verse')} ${v.ayahNumber}</span>
                                <span class="surah-type-badge ${v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani'}">${v.revelationType === 'makki' ? t.makki : t.madani}</span>
                            </div>
                        </div>
                    `).join('')}
                `;
            }
        }

        // Level 3: Previous Scriptures (Torah, Zabur, Injeel)
        const c3 = document.getElementById('content-3');
        if (c3) {
            if (scriptures.length === 0) {
                c3.innerHTML = `<p>${t.noBooks}</p>`;
            } else {
                c3.innerHTML = scriptures.map(s => {
                    const badgeLabel = s.type === 'torah' ? t.torah : (s.type === 'zabur' ? t.zabur : t.injeel);
                    return `
                        <div class="verse-box">
                            <div class="verse-text" style="font-size:1.12rem;">« ${highlightExactWord(s.text, word, lang)} »</div>
                            <div class="verse-meta">
                                <span>${s.bookName} — ${s.chapter}:${s.verse}</span>
                                <span class="surah-type-badge surah-makki">${badgeLabel}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Level 4: Heritage & Narrations (Sunnah.com + Talmud)
        const c4 = document.getElementById('content-4');
        if (c4) {
            const sunnahSearchUrl = `https://sunnah.com/search?q=${encodeURIComponent(word)}`;
            let html4 = `
                <div class="deriv-group-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                    <span>${t.sunnahTitle}</span>
                    <a href="${sunnahSearchUrl}" target="_blank" rel="noopener" class="sunnah-link-badge">${t.sunnahSearchAll}</a>
                </div>
            `;
            if (heritage.hadiths.length === 0) {
                html4 += `<p style="margin-bottom:10px;">${lang === 'ar' ? 'اضغط على رابط Sunnah.com أعلاه لعرض كافة الروايات المطابقة للفظ من الكتب التسعة.' : 'Click the Sunnah.com link above to view all matching narrations across the Nine Books.'}</p>`;
            } else {
                html4 += heritage.hadiths.map(h => `
                    <div class="verse-box">
                        <div class="verse-text" style="font-size:1.1rem;">${highlightExactWord(h.text, word, lang)}</div>
                        <div class="verse-meta" style="justify-content:space-between;">
                            <span>${h.book} (${h.number})</span>
                            <a href="${h.url}" target="_blank" rel="noopener" class="sunnah-link-badge">${t.sunnahSource}</a>
                        </div>
                    </div>
                `).join('');
            }

            html4 += `<div class="deriv-group-title">${t.talmudTitle}</div>`;
            if (heritage.mishnah.length === 0) {
                html4 += `<p>${lang === 'ar' ? 'لا توجد نصوص مطابقة في المشنا لهذا اللفظ.' : 'No exact matching passages found in the Mishnah for this term.'}</p>`;
            } else {
                html4 += heritage.mishnah.map(m => `
                    <div class="verse-box">
                        <div class="verse-text" style="font-size:1.05rem;">${highlightExactWord(m.text, word, lang)}</div>
                        <div class="verse-meta"><span>${m.ref}</span></div>
                    </div>
                `).join('');
            }
            c4.innerHTML = html4;
        }

        // Level 5: Clean Muhkam vs Mutashabih Classification (Classic clean view)
        const c5 = document.getElementById('content-5');
        if (c5) {
            const makkiV = verses.filter(v => v.revelationType === 'makki');
            const madaniV = verses.filter(v => v.revelationType === 'madani');
            c5.innerHTML = `
                <div class="deriv-group-title">${t.makkiSection} (${makkiV.length})</div>
                ${makkiV.slice(0, 6).map(v => `
                    <div class="verse-box">
                        <div class="verse-text" dir="rtl">﴿ ${lang === 'ar' ? highlightExactWord(v.arText, word, 'ar') : v.arText} ﴾</div>
                        ${v.transText ? `<div style="margin-top:4px;font-size:0.95rem;">${highlightExactWord(v.transText, word, lang)}</div>` : ''}
                        <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                    </div>
                `).join('') || `<p>${t.noVerses}</p>`}

                <div class="deriv-group-title">${t.madaniSection} (${madaniV.length})</div>
                ${madaniV.slice(0, 6).map(v => `
                    <div class="verse-box">
                        <div class="verse-text" dir="rtl">﴿ ${lang === 'ar' ? highlightExactWord(v.arText, word, 'ar') : v.arText} ﴾</div>
                        ${v.transText ? `<div style="margin-top:4px;font-size:0.95rem;">${highlightExactWord(v.transText, word, lang)}</div>` : ''}
                        <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                    </div>
                `).join('') || `<p>${t.noVerses}</p>`}
            `;
        }

        // Level 6: Deduction & Interpretation
        const c6 = document.getElementById('content-6');
        if (c6) {
            c6.innerHTML = `
                <div class="stage6-directive">
                    ${t.stage6Text(word)}
                </div>
            `;
        }
    }
});
