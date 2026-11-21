document.addEventListener('DOMContentLoaded', () => {
    // 1. إدارة أزرار الأهرام والمقالات
    const btnPyr1 = document.getElementById('btn-pyr-1');
    const btnPyr2 = document.getElementById('btn-pyr-2');
    const btnArticles = document.getElementById('btn-articles');
    const boxPyr1 = document.getElementById('pyramid-box-1');
    const boxPyr2 = document.getElementById('pyramid-box-2');
    const boxArticles = document.getElementById('articles-box');
    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBackArticles = document.getElementById('btn-back-articles');

    function closeAllPanels() {
        if (boxPyr1) boxPyr1.style.display = 'none';
        if (boxPyr2) boxPyr2.style.display = 'none';
        if (boxArticles) boxArticles.style.display = 'none';
    }

    if (btnPyr1 && boxPyr1) {
        btnPyr1.addEventListener('click', () => {
            const isHidden = boxPyr1.style.display === 'none' || boxPyr1.style.display === '';
            closeAllPanels();
            if (isHidden) boxPyr1.style.display = 'block';
        });
    }
    if (btnPyr2 && boxPyr2) {
        btnPyr2.addEventListener('click', () => {
            const isHidden = boxPyr2.style.display === 'none' || boxPyr2.style.display === '';
            closeAllPanels();
            if (isHidden) boxPyr2.style.display = 'block';
        });
    }
    if (btnArticles && boxArticles) {
        btnArticles.addEventListener('click', () => {
            const isHidden = boxArticles.style.display === 'none' || boxArticles.style.display === '';
            closeAllPanels();
            if (isHidden) {
                boxArticles.style.display = 'block';
                renderArticlesGrid();
            }
        });
    }

    if (btnBack1) btnBack1.addEventListener('click', closeAllPanels);
    if (btnBack2) btnBack2.addEventListener('click', closeAllPanels);
    if (btnBackArticles) btnBackArticles.addEventListener('click', closeAllPanels);

    // 2. بناء شبكة المقالات (1 إلى 30)
    function renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        const viewer = document.getElementById('article-viewer');
        if (!grid) return;
        grid.innerHTML = '';
        if (viewer) viewer.style.display = 'none';

        const articlesList = (typeof ARTICLES_DATA !== 'undefined') ? ARTICLES_DATA : [];
        for (let i = 1; i <= 30; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'article-num-btn';
            btn.textContent = i;
            const art = articlesList.find(a => a.id === i);
            if (art && art.content && !art.content.includes('مساحة مخصصة للمقال')) {
                btn.classList.add('has-content');
            }
            btn.addEventListener('click', () => openArticle(i));
            grid.appendChild(btn);
        }
    }

    function openArticle(id) {
        const articlesList = (typeof ARTICLES_DATA !== 'undefined') ? ARTICLES_DATA : [];
        const art = articlesList.find(a => a.id === id) || {
            id: id,
            title: `مقال رقم (${id})`,
            content: 'هذا المقال قيد الإعداد والنشر قريباً إن شاء الله.'
        };
        const viewer = document.getElementById('article-viewer');
        const titleEl = document.getElementById('article-title');
        const bodyEl = document.getElementById('article-body');
        if (!viewer || !titleEl || !bodyEl) return;

        titleEl.textContent = `${art.id}. ${art.title}`;
        bodyEl.innerHTML = art.content
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(p => `<p class="article-para">${p}</p>`)
            .join('');
        viewer.style.display = 'block';
        viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const btnCloseArticle = document.getElementById('btn-close-article');
    if (btnCloseArticle) {
        btnCloseArticle.addEventListener('click', () => {
            const viewer = document.getElementById('article-viewer');
            if (viewer) viewer.style.display = 'none';
            stopSpeech();
        });
    }

    // 3. إدارة القراءة الصوتية (زر استماع)
    const listenBtn = document.getElementById('listen-btn');
    let isSpeaking = false;

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        if (listenBtn) {
            listenBtn.textContent = 'استماع';
            listenBtn.classList.remove('speaking');
        }
    }

    function toggleSpeech() {
        if (!('speechSynthesis' in window)) {
            alert('عذراً، متصفحك لا يدعم ميزة القراءة الصوتية.');
            return;
        }
        if (isSpeaking) {
            stopSpeech();
            return;
        }

        let textToRead = '';
        const viewer = document.getElementById('article-viewer');
        if (viewer && viewer.style.display === 'block') {
            textToRead = viewer.innerText;
        } else {
            const activeCard = document.querySelector('.level-card.active-level');
            if (activeCard) {
                textToRead = activeCard.innerText;
            }
        }

        if (!textToRead || textToRead.trim().length < 2) {
            alert('يرجى إجراء بحث واختيار مستوى أو فتح مقال للاستماع إليه.');
            return;
        }

        stopSpeech();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        const isArabic = /[\u0600-\u06FF]/.test(textToRead);
        utterance.lang = isArabic ? 'ar-SA' : 'en-US';
        utterance.rate = 0.95;

        utterance.onend = () => stopSpeech();
        utterance.onerror = () => stopSpeech();

        isSpeaking = true;
        if (listenBtn) {
            listenBtn.textContent = 'إيقاف';
            listenBtn.classList.add('speaking');
        }
        window.speechSynthesis.speak(utterance);
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', toggleSpeech);
    }

    // 4. أدوات توحيد النصوص العربية والإملاء الحديث والتظليل الشامل
    function normalizeArabic(text) {
        if (!text) return '';
        return text
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function toModernImlaei(text) {
        if (!text) return '';
        return text
            .replace(/ٱ/g, 'ا')
            .replace(/الصلوة|ٱلصلوة|الصلوٰة|ٱلصلوٰة|الصَّلَوٰةِ|الصَّلَوٰةَ|الصَّلَوٰةُ|ٱلصَّلَوٰةَ|ٱلصَّلَوٰةِ|ٱلصَّلَوٰةُ/g, 'الصلاة')
            .replace(/صلوة|صلوٰة|صَلَوٰةً|صَلَوٰةٍ|صَلَوٰةٌ/g, 'صلاة')
            .replace(/الزكوة|ٱلزكوة|الزكوٰة|ٱلزكوٰة|الزَّكَوٰةَ|الزَّكَوٰةِ|الزَّكَوٰةُ|ٱلزَّكَوٰةَ|ٱلزَّكَوٰةِ|ٱلزَّكَوٰةُ/g, 'الزكاة')
            .replace(/زكوة|زكوٰة|زَكَوٰةً|زَكَوٰةٍ|زَكَوٰةٌ/g, 'زكاة')
            .replace(/الحيوة|ٱلحيوة|الحيوٰة|ٱلحيوٰة|الْحَيَوٰةِ|الْحَيَوٰةَ|الْحَيَوٰةُ|ٱلْحَيَوٰةِ|ٱلْحَيَوٰةَ|ٱلْحَيَوٰةُ/g, 'الحياة')
            .replace(/حيوة|حيوٰة|حَيَوٰةً|حَيَوٰةٍ|حَيَوٰةٌ/g, 'حياة')
            .replace(/الربوا|ٱلربوا|الرِّبَوٰا۟|ٱلرِّبَوٰا۟/g, 'الربا')
            .replace(/مشكوة|مشكوٰة/g, 'مشكاة')
            .replace(/نجوة|نجوٰة/g, 'نجاة')
            .replace(/منوة|منوٰة/g, 'مناة')
            .replace(/الغدوة|ٱلغدوة/g, 'الغداة');
    }

    // بناء تعبير نمطي مرن يطابق الكلمة مع التشكيل والهمزات والتاء/الهاء والسوابق واللواحق
    function buildWordRegexPart(cleanTerm) {
        const diacritics = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
        let pattern = '';
        for (let i = 0; i < cleanTerm.length; i++) {
            const ch = cleanTerm[i];
            if (ch === ' ') {
                pattern += '\\s+';
            } else if ('اأإآٱ'.includes(ch)) {
                pattern += '[اأإآٱ]' + diacritics;
            } else if ('ةه'.includes(ch)) {
                pattern += '[ةه]' + diacritics;
            } else if ('يى'.includes(ch)) {
                pattern += '[يى]' + diacritics;
            } else if ('وؤ'.includes(ch)) {
                pattern += '[وؤ]' + diacritics;
            } else {
                const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                pattern += escaped + diacritics;
            }
        }
        return pattern;
    }

    // تظليل شامل لجميع الألفاظ الثمانية المستنتجة دون إغفال أي لفظ منها
    function highlightStrictTerms(text, strictTokens, englishQuery) {
        if (!text) return '';
        let result = text;

        if (englishQuery) {
            const escEn = englishQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const enRegex = new RegExp(`(${escEn}\\w*)`, 'gi');
            result = result.replace(enRegex, '<mark class="hl-term">$1</mark>');
            return result;
        }

        if (!strictTokens || strictTokens.length === 0) return result;

        // ترتيب الألفاظ من الأطول للأقصر لضمان تظليل العبارات المركبة (مثل "سوف يصلي" و"مصلى عليه") كاملة قبل المفردة
        const sortedTokens = [...new Set(strictTokens)]
            .map(t => t.trim())
            .filter(t => t.length >= 2)
            .sort((a, b) => b.length - a.length);

        const parts = sortedTokens.map(tok => {
            const normTok = normalizeArabic(tok);
            // السماح بسوابق متصلة شائعة ولواحق تصريفية متصلة للكلمة نفسها دون الخروج عن حدود الكلمة
            const prefix = '(?:[وفبكلس]|ال|لل|وال|فال|بال|كال)?[\\u064B-\\u065F\\u0670]*';
            const suffix = '(?:[\\u064B-\\u065F\\u0670]*(?:ون|ين|ان|ات|وا|تم|تن|نا|ها|هم|هن|كم|كن|[هكيتنا]))?';
            if (normTok.includes(' ')) {
                return buildWordRegexPart(normTok);
            }
            return `${prefix}${buildWordRegexPart(normTok)}${suffix}`;
        });

        try {
            const fullRegex = new RegExp(`(^|[^\\u0621-\\u064A])(${parts.join('|')})(?=[^\\u0621-\\u064A]|$)`, 'g');
            result = result.replace(fullRegex, '$1<mark class="hl-term">$2</mark>');
        } catch (e) {
            console.error('Highlight error:', e);
        }
        return result;
    }

    // 5. محرك استخراج الجذر والمشتقات الثمانية المعتمدة حصراً في المستوى الأول
    const DERIVATIVE_CATEGORIES = [
        { key: 'past', label: '1. الفعل في الماضي' },
        { key: 'present', label: '2. الفعل في الحاضر' },
        { key: 'future', label: '3. الفعل في المستقبل' },
        { key: 'imperative', label: '4. فعل الأمر' },
        { key: 'active_participle', label: '5. اسم الفاعل' },
        { key: 'passive_participle', label: '6. اسم المفعول' },
        { key: 'masdar', label: '7. المصدر' },
        { key: 'place', label: '8. اسم المكان' }
    ];

    const KNOWN_ROOT_LEXICON = {
        'صلو': {
            root: 'ص - ل - و',
            makhraj: 'الصاد (أسليّة صفيرية) ← اللام (ذلقية) ← الواو (شفوية)',
            eyeNote: 'ذكر الخليل في كتاب العين أن أصل (ص ل و) يدل على الدعاء والتعظيم واللزوم والاتباع، ومنه الصلاة والمصلّي في السباق.',
            derivatives: {
                past: ['صلى', 'صلت', 'صلوا', 'صليت', 'صلينا'],
                present: ['يصلي', 'تصلي', 'يصلون', 'تصلون', 'نصلي', 'اصلي'],
                future: ['سيصلي', 'ستصلي', 'سيصلون', 'ستصلون', 'سنصلي', 'ساصلي', 'سوف يصلي', 'سوف تصلي', 'سوف يصلون', 'سوف نصلي'],
                imperative: ['صل', 'صلي', 'صلوا'],
                active_participle: ['مصل', 'مصلي', 'المصلي', 'مصلين', 'المصلين', 'مصلون', 'المصلون', 'مصلية', 'مصليات'],
                passive_participle: ['مصلى عليه', 'مصلى عليها', 'مصلى عليهم', 'مصلى'],
                masdar: ['صلاة', 'الصلاة', 'صلوات', 'الصلوات', 'صلاتي', 'صلاتك', 'صلاتهم', 'تصلية'],
                place: ['مصلى', 'المصلى', 'مصليات']
            }
        },
        'صلي': { alias: 'صلو' },
        'صلا': { alias: 'صلو' },
        'كتب': {
            root: 'ك - ت - ب',
            makhraj: 'الكاف (لهوية) ← التاء (نطعية) ← الباء (شفوية)',
            eyeNote: 'ذكر الخليل في كتاب العين أن أصل (ك ت ب) يدل على الجمع والشد والخط والتدوين، ومنه الكتيبة والكتاب.',
            derivatives: {
                past: ['كتب', 'كتبت', 'كتبوا', 'كتبنا', 'كتبتما', 'كتبتم'],
                present: ['يكتب', 'تكتب', 'يكتبون', 'تكتبون', 'نكتب', 'اكتب'],
                future: ['سيكتب', 'ستكتب', 'سيكتبون', 'ستكتبون', 'سنكتب', 'ساكتب', 'سوف يكتب', 'سوف تكتب', 'سوف يكتبون', 'سوف نكتب'],
                imperative: ['اكتب', 'اكتبي', 'اكتبوا', 'اكتبا'],
                active_participle: ['كاتب', 'الكاتب', 'كاتبين', 'الكاتبين', 'كاتبون', 'الكاتبون', 'كتبة', 'كاتبة'],
                passive_participle: ['مكتوب', 'المكتوب', 'مكتوبة', 'المكتوبة', 'مكتوبين', 'مكتوبات'],
                masdar: ['كتاب', 'الكتاب', 'كتب', 'الكتب', 'كتابة', 'الكتابة', 'كتابي', 'كتابك', 'كتابهم'],
                place: ['مكتب', 'المكتب', 'مكاتب', 'المكاتب', 'مكتبة']
            }
        },
        'حقق': {
            root: 'ح - ق - ق',
            makhraj: 'الحاء (حلقية) ← القاف (لهوية)',
            eyeNote: 'ذكر الخليل في كتاب العين أن (ح ق ق) يدل على الثبات والوجوب والصدق، والحق نقيض الباطل.',
            derivatives: {
                past: ['حق', 'حقت', 'حقق', 'حققت', 'حققوا'],
                present: ['يحق', 'تحق', 'يحقق', 'تحقق', 'يحققون', 'نحقق'],
                future: ['سيحق', 'ستحق', 'سيحقق', 'ستحقق', 'سيحققون', 'سوف يحق', 'سوف يحقق', 'سوف نتحقق'],
                imperative: ['حقق', 'حققي', 'حققوا'],
                active_participle: ['محقق', 'المحقق', 'محققون', 'محققين', 'حاق', 'الحاق', 'حاقة', 'الحاقة'],
                passive_participle: ['محقق', 'محققة', 'محقوق'],
                masdar: ['حق', 'الحق', 'حقوق', 'الحقوق', 'تحقيق', 'حقيقة', 'الحقيقة'],
                place: ['محق', 'محقق']
            }
        },
        'دين': {
            root: 'د - ي - ن',
            makhraj: 'الدال (نطعية) ← الياء (شجرية) ← النون (ذلقية)',
            eyeNote: 'ذكر الخليل في كتاب العين أن (د ي ن) يدل على الطاعة والجزاء والحساب والملة والانقياد.',
            derivatives: {
                past: ['دان', 'دانت', 'دانوا', 'دنا', 'تدين'],
                present: ['يدين', 'تدين', 'يدينون', 'تدينون', 'ندين'],
                future: ['سيدين', 'ستدين', 'سيدينون', 'سوف يدين', 'سوف تدين', 'سوف يدينون'],
                imperative: ['دن', 'دينوا'],
                active_participle: ['مدين', 'المدين', 'داين', 'الدائن', 'متدين', 'متدينين'],
                passive_participle: ['مدين', 'مديون', 'المديون'],
                masdar: ['دين', 'الدين', 'ديون', 'الديون', 'ديني', 'دينك', 'دينهم', 'تدين'],
                place: ['مدينة', 'المدينة', 'مدائن', 'المدائن']
            }
        },
        'زكو': {
            root: 'ز - ك - و',
            makhraj: 'الزاي (أسليّة صفيرية) ← الكاف (لهوية) ← الواو (شفوية)',
            eyeNote: 'ذكر الخليل في كتاب العين أن (ز ك و) يدل على النماء والطهارة والزيادة والبركة.',
            derivatives: {
                past: ['زكى', 'زكت', 'زكوا', 'تزكى', 'تزكوا'],
                present: ['يزكي', 'تزكي', 'يزكون', 'تزكون', 'نزكي', 'يتزكى', 'تتزكى'],
                future: ['سيزكي', 'ستزكي', 'سيزكون', 'سيتزكى', 'سوف يزكي', 'سوف يتزكى'],
                imperative: ['زك', 'زكوا', 'تزك', 'تزكوا'],
                active_participle: ['مزك', 'مزكي', 'المزكي', 'متزك', 'المتزكي', 'زاك', 'زاكية'],
                passive_participle: ['مزكى', 'المزكى', 'مزكاة'],
                masdar: ['زكاة', 'الزكاة', 'تزكية', 'التزكية'],
                place: ['مزكى', 'المزكى']
            }
        },
        'زكي': { alias: 'زكو' },
        'زكا': { alias: 'زكو' }
    };

    function extractRootAndStrictDerivatives(query) {
        const norm = normalizeArabic(query);
        // تجريد السوابق واللواحق للوصول إلى الجذر الثلاثي
        let stem = norm
            .replace(/^(ال|لل|وال|فال|بال|كال|و|ف|ب|ل|ك|س|سي|ست|سن|سا)/, '')
            .replace(/(ون|ين|ان|ات|وا|تم|تن|نا|ها|هم|هن|كم|كن|ة|ه|ي)$/, '');
        if (stem.length > 3 && stem.startsWith('م')) stem = stem.slice(1);
        if (stem.length > 3 && stem.startsWith('ت')) stem = stem.slice(1);
        if (stem.length > 3 && stem.startsWith('ا')) stem = stem.slice(1);
        if (stem.length > 3 && stem.includes('ا')) stem = stem.replace('ا', '');

        const rootKey = stem.slice(0, 3);
        let entry = KNOWN_ROOT_LEXICON[rootKey];
        if (entry && entry.alias) {
            entry = KNOWN_ROOT_LEXICON[entry.alias];
        }

        if (entry) {
            const allTokens = [];
            DERIVATIVE_CATEGORIES.forEach(cat => {
                const list = entry.derivatives[cat.key] || [];
                list.forEach(item => allTokens.push(item));
            });
            return {
                root: entry.root,
                makhraj: entry.makhraj,
                eyeNote: entry.eyeNote,
                derivatives: entry.derivatives,
                allStrictTokens: [...new Set(allTokens)]
            };
        }

        // توليد قياسي آلي دقيق للمشتقات الثمانية لأي جذر ثلاثي
        const c1 = rootKey[0] || 'ف';
        const c2 = rootKey[1] || 'ع';
        const c3 = rootKey[2] || 'ل';
        const isWeakEnd = (c3 === 'و' || c3 === 'ي' || c3 === 'ا');

        const pastBase = isWeakEnd ? `${c1}${c2}ى` : `${c1}${c2}${c3}`;
        const presBase = isWeakEnd ? `ي${c1}${c2}ي` : `ي${c1}${c2}${c3}`;
        const impBase = isWeakEnd ? `${c1}${c2}` : `ا${c1}${c2}${c3}`;
        const actBase = isWeakEnd ? `${c1}ا${c2}ي` : `${c1}ا${c2}${c3}`;
        const pasBase = isWeakEnd ? `م${c1}${c2}ي` : `م${c1}${c2}و${c3}`;
        const masdarBase = norm.replace(/^ال/, '');
        const placeBase = isWeakEnd ? `م${c1}${c2}ى` : `م${c1}${c2}${c3}`;

        const generated = {
            past: [pastBase, `${pastBase}ت`, `${pastBase}وا`, `${pastBase}نا`],
            present: [presBase, `ت${presBase.slice(1)}`, `${presBase}ون`, `ت${presBase.slice(1)}ون`, `ن${presBase.slice(1)}`],
            future: [`س${presBase}`, `ست${presBase.slice(1)}`, `س${presBase}ون`, `سن${presBase.slice(1)}`, `سوف ${presBase}`, `سوف ت${presBase.slice(1)}`, `سوف ${presBase}ون`, `سوف ن${presBase.slice(1)}`],
            imperative: [impBase, `${impBase}ي`, `${impBase}وا`],
            active_participle: [actBase, `ال${actBase}`, `${actBase}ون`, `ال${actBase}ون`, `${actBase}ين`, `ال${actBase}ين`, `${actBase}ة`],
            passive_participle: [pasBase, `ال${pasBase}`, `${pasBase}ة`, `ال${pasBase}ة`, `${pasBase}ين`, `${pasBase}ون`],
            masdar: [...new Set([masdarBase, `ال${masdarBase}`, `${c1}${c2}${c3}`, `ال${c1}${c2}${c3}`, `${c1}${c2}ا${c3}`, `ال${c1}${c2}ا${c3}`])],
            place: [placeBase, `ال${placeBase}`, `${placeBase}ة`, `ال${placeBase}ة`]
        };

        const allTokens = [];
        DERIVATIVE_CATEGORIES.forEach(cat => {
            generated[cat.key].forEach(item => allTokens.push(item));
        });

        return {
            root: `${c1} - ${c2} - ${c3}`,
            makhraj: `تتبع مخارج حروف الجذر (${c1}، ${c2}، ${c3}) وفق ترتيب الحلق واللسان والشفتين في كتاب العين.`,
            eyeNote: `استنباط الجذر (${c1} ${c2} ${c3}) وتقليباته الصوتية والاشتقاقية وفق منهج الخليل بن أحمد الفراهيدي في كتاب العين.`,
            derivatives: generated,
            allStrictTokens: [...new Set(allTokens)]
        };
    }

    // التحقق الصارم من أن النص يحتوي على أحد الألفاظ الثمانية المستنتجة في المستوى الأول حصراً لا غير
    function matchStrictDerivativeCategories(text, morphData) {
        const cleanText = toModernImlaei(text);
        const normText = normalizeArabic(cleanText);
        const words = normText.split(/[^ا-ي]+/).filter(Boolean);
        const matchedCats = new Set();

        DERIVATIVE_CATEGORIES.forEach(cat => {
            const allowedList = morphData.derivatives[cat.key] || [];
            for (const rawAllowed of allowedList) {
                const normAllowed = normalizeArabic(rawAllowed);
                if (!normAllowed) continue;

                // مطابقة العبارات المركبة (مثل "سوف يصلي" أو "مصلى عليه")
                if (normAllowed.includes(' ')) {
                    if (normText.includes(normAllowed)) {
                        matchedCats.add(cat.key);
                        break;
                    }
                } else {
                    // مطابقة الكلمة المستقلة أو مع سوابق ولواحق متصلة لنفس اللفظ حصراً
                    const found = words.some(w => {
                        if (w === normAllowed) return true;
                        const stripped = w
                            .replace(/^(ال|لل|وال|فال|بال|كال|و|ف|ب|ل|ك)/, '')
                            .replace(/(ون|ين|ان|ات|وا|تم|تن|نا|ها|هم|هن|كم|كن|ه|ك|ي)$/, '');
                        return stripped === normAllowed || w === `ال${normAllowed}` || w === `و${normAllowed}` || w === `ف${normAllowed}` || w === `ب${normAllowed}`;
                    });
                    if (found) {
                        matchedCats.add(cat.key);
                        break;
                    }
                }
            }
        });

        return Array.from(matchedCats);
    }

    // 6. بيانات السور (مكية / مدنية) وإعراب اللفظ وفق الكتاب لسيبويه
    const MEDINAN_SURAHS = new Set([2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110]);
    const AHKAM_SURAHS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 16, 17, 22, 24, 33, 42, 47, 48, 49, 58, 59, 60, 62, 64, 65, 66]);

    function getSurahTypeLabel(surahNum) {
        return MEDINAN_SURAHS.has(surahNum) ? 'مدنية' : 'مكية';
    }

    function analyzeGrammarSibawayh(ayahText, matchedCatKey, strictTokens) {
        const clean = toModernImlaei(ayahText);
        if (matchedCatKey === 'past') {
            return 'إعراب اللفظ (الكتاب لسيبويه): فعل ماضٍ مبني يدل على تحقق الحدث في الزمن الماضي، وفاعله متصل أو ظاهر بعده.';
        }
        if (matchedCatKey === 'present') {
            return 'إعراب اللفظ (الكتاب لسيبويه): فعل مضارع مرفوع لتجرده من الناصب والجازم (أو منصوب/مجزوم بحسب العامل قبله)، يفيد التجدد والاستمرار.';
        }
        if (matchedCatKey === 'future') {
            return 'إعراب اللفظ (الكتاب لسيبويه): فعل مضارع مقترن بحرف التنفيس/الاستقبال (السين أو سوف)، مرفوع، يدل على وقوع الفعل مستقبلاً.';
        }
        if (matchedCatKey === 'imperative') {
            return 'إعراب اللفظ (الكتاب لسيبويه): فعل أمر مبني على حذف حرف العلة أو السكون أو حذف النون، يفيد الطلب والإلزام.';
        }
        if (matchedCatKey === 'active_participle') {
            return 'إعراب اللفظ (الكتاب لسيبويه): اسم فاعل مشتق يدل على من قام بالفعل أو اتصف به، ويُعرب بحسب موقعه في الجملة (رفعاً أو نصباً أو جراً).';
        }
        if (matchedCatKey === 'passive_participle') {
            return 'إعراب اللفظ (الكتاب لسيبويه): اسم مفعول مشتق يدل على من وقع عليه الفعل، ويُعرب بحسب موقعه في التركيب النحوي.';
        }
        if (matchedCatKey === 'place') {
            return 'إعراب اللفظ (الكتاب لسيبويه): اسم مكان على وزن (مَفْعَل) يدل على موضع وقوع الفعل، ويُعرب بحسب العامل الداخل عليه.';
        }
        // المصدر
        if (/ِ\s*$/.test(clean) || /(في|من|إلى|على|عن|ب|ل)\s+[^\s]*صل[او]ة|كتاب|حق|دين|زك[او]ة/.test(normalizeArabic(clean))) {
            return 'إعراب اللفظ (الكتاب لسيبويه): اسم مصدر مجرور بحرف الجر أو بالإضافة، وعلامة جره الكسرة الظاهرة.';
        }
        return 'إعراب اللفظ (الكتاب لسيبويه): اسم مصدر صريح معرب بحسب موقعه في الجملة (مبتدأ، فاعل، أو مفعول به منصوب).';
    }

    // 7. تصنيف مصادر الأسفار (التوراة - الزبور - الأنبياء - الإنجيل)
    function classifyBiblicalSource(bookId, bookName) {
        const id = Number(bookId);
        if (id >= 1 && id <= 5) return `التوراة — ${bookName}`;
        if (id === 19) return `الزبور — ${bookName}`;
        if (id >= 6 && id <= 39) return `أسفار الأنبياء والكتب — ${bookName}`;
        if (id >= 40 && id <= 66) return `الإنجيل — ${bookName}`;
        return bookName;
    }

    // 8. تنفيذ البحث الشامل في المستويات الستة
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const inputEl = document.getElementById('quran-word');
    const loaderEl = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');
    const levelBtns = document.querySelectorAll('.level-btn');
    const levelCards = document.querySelectorAll('.level-card');

    let cachedQuran = null;

    async function loadQuranData() {
        if (cachedQuran) return cachedQuran;
        const urls = [
            'https://api.alquran.cloud/v1/quran/quran-simple-enhanced',
            'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmani.json'
        ];
        for (const url of urls) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.data && data.data.surahs) {
                    const list = [];
                    data.data.surahs.forEach(s => {
                        s.ayahs.forEach(a => {
                            list.push({
                                surahNum: s.number,
                                surahName: s.name,
                                ayahNum: a.numberInSurah,
                                text: toModernImlaei(a.text)
                            });
                        });
                    });
                    cachedQuran = list;
                    return cachedQuran;
                }
            } catch (e) {
                console.warn('Quran source fallback:', e);
            }
        }
        return [];
    }

    function renderGroupedResults(groupedMap, morphData, englishQuery, rendererFn) {
        let html = '';
        let totalFound = 0;

        DERIVATIVE_CATEGORIES.forEach(cat => {
            const items = groupedMap[cat.key] || [];
            const allowedSample = (morphData.derivatives[cat.key] || []).slice(0, 4).join(' ، ');
            if (items.length > 0) {
                totalFound += items.length;
                html += `<div class="deriv-group">
                    <div class="deriv-group-title">${cat.label} <span class="deriv-badge">(${allowedSample}) — ${items.length} نتيجة</span></div>`;
                items.forEach(item => {
                    html += rendererFn(item, cat.key);
                });
                html += `</div>`;
            }
        });

        if (totalFound === 0) {
            return '<div class="empty-note">لم يتم العثور على نصوص تطابق الألفاظ الثمانية المستنتجة في المستوى الأول داخل هذا المصدر.</div>';
        }
        return html;
    }

    async function runFullContemplation() {
        const rawQuery = (inputEl ? inputEl.value : '').trim();
        if (!rawQuery) {
            alert('يرجى كتابة اللفظ المراد تدبره أولاً.');
            return;
        }

        stopSpeech();
        if (loaderEl) loaderEl.style.display = 'block';
        if (resultsWrapper) resultsWrapper.style.display = 'none';

        const isEnglish = /^[A-Za-z\s'-]+$/.test(rawQuery);
        const morphData = extractRootAndStrictDerivatives(rawQuery);

        // --- المستوى الأول: الجذر والمشتقات الثمانية المعتمدة حصراً ---
        let html1 = `
            <div class="source-box">
                <div class="source-tag">المستوى الأول: الجذر والاشتقاق (كتاب العين للفراهيدي)</div>
                <p><strong>الجذر اللغوي المستنبط:</strong> <span class="root-highlight">${morphData.root}</span></p>
                <p><strong>مخارج الحروف وتقليباتها الصوتية:</strong> ${morphData.makhraj}</p>
                <p><strong>البيان المعجمي (كتاب العين):</strong> ${morphData.eyeNote}</p>
            </div>
            <div class="strict-notice">الألفاظ الثمانية المستنتجة أدناه هي المرجع الحصري المقيد للبحث في كافة المستويات التالية لا غير:</div>
            <table class="deriv-table">
                <thead>
                    <tr>
                        <th>التصنيف الصرفي</th>
                        <th>الألفاظ المعتمدة حصراً في البحث</th>
                    </tr>
                </thead>
                <tbody>
        `;

        DERIVATIVE_CATEGORIES.forEach(cat => {
            const wordsList = (morphData.derivatives[cat.key] || []).join(' ، ');
            html1 += `
                <tr>
                    <td><strong>${cat.label}</strong></td>
                    <td>${wordsList}</td>
                </tr>
            `;
        });
        html1 += `</tbody></table>`;
        document.getElementById('content-1').innerHTML = html1;

        // --- المستوى الثاني والخامس: القرآن الكريم بالإملاء الحديث مقيداً بالمشتقات الثمانية ---
        const quranList = await loadQuranData();
        const groupedQuran2 = {};
        const groupedQuran5 = {};
        DERIVATIVE_CATEGORIES.forEach(c => {
            groupedQuran2[c.key] = [];
            groupedQuran5[c.key] = [];
        });

        let totalQuranCount = 0;

        if (!isEnglish && quranList.length > 0) {
            quranList.forEach(ayah => {
                const matchedKeys = matchStrictDerivativeCategories(ayah.text, morphData);
                if (matchedKeys.length > 0) {
                    totalQuranCount++;
                    matchedKeys.forEach(k => {
                        groupedQuran2[k].push(ayah);
                        if (AHKAM_SURAHS.has(ayah.surahNum)) {
                            groupedQuran5[k].push(ayah);
                        }
                    });
                }
            });
        }

        const html2 = renderGroupedResults(groupedQuran2, morphData, isEnglish ? rawQuery : null, (ayah, catKey) => {
            const surahType = getSurahTypeLabel(ayah.surahNum);
            const highlightedAyah = highlightStrictTerms(ayah.text, morphData.allStrictTokens, isEnglish ? rawQuery : null);
            const grammarNote = analyzeGrammarSibawayh(ayah.text, catKey, morphData.allStrictTokens);
            return `
                <div class="verse-item">
                    <div class="verse-meta">
                        <span>[${ayah.surahName} : ${ayah.ayahNum}]</span>
                        <span class="surah-type-badge ${surahType === 'مدنية' ? 'medinan' : 'makkan'}">${surahType}</span>
                    </div>
                    <div class="verse-text">${highlightedAyah}</div>
                    <div class="grammar-box">${grammarNote}</div>
                </div>
            `;
        });
        document.getElementById('content-2').innerHTML = html2;

        const html5 = renderGroupedResults(groupedQuran5, morphData, isEnglish ? rawQuery : null, (ayah, catKey) => {
            const surahType = getSurahTypeLabel(ayah.surahNum);
            const highlightedAyah = highlightStrictTerms(ayah.text, morphData.allStrictTokens, isEnglish ? rawQuery : null);
            const grammarNote = analyzeGrammarSibawayh(ayah.text, catKey, morphData.allStrictTokens);
            return `
                <div class="verse-item">
                    <div class="verse-meta">
                        <span>[${ayah.surahName} : ${ayah.ayahNum}]</span>
                        <span class="surah-type-badge ${surahType === 'مدنية' ? 'medinan' : 'makkan'}">${surahType}</span>
                    </div>
                    <div class="verse-text">${highlightedAyah}</div>
                    <div class="grammar-box">${grammarNote}</div>
                </div>
            `;
        });
        document.getElementById('content-5').innerHTML = html5;

        // --- المستوى الثالث: الكتب السابقة (العهد القديم والزبور والأنبياء والعهد الجديد) مقيدة بالمشتقات الثمانية ---
        const groupedBible = {};
        DERIVATIVE_CATEGORIES.forEach(c => { groupedBible[c.key] = []; });
        let totalBibleCount = 0;

        try {
            const translation = isEnglish ? 'KJV' : 'SVD';
            // جلب نتائج المشتقات الأساسية من قاعدة البيانات لضمان شمول الماضي والمضارع والأمر والفاعل والمصدر
            const searchSeeds = isEnglish
                ? [rawQuery]
                : [...new Set([
                    rawQuery.replace(/^ال/, ''),
                    ...(morphData.derivatives.past || []).slice(0, 2),
                    ...(morphData.derivatives.present || []).slice(0, 2),
                    ...(morphData.derivatives.imperative || []).slice(0, 1),
                    ...(morphData.derivatives.active_participle || []).slice(0, 2),
                    ...(morphData.derivatives.masdar || []).slice(0, 2)
                ])].filter(w => w && !w.includes(' ')).slice(0, 7);

            const seenBibleKeys = new Set();
            const fetches = searchSeeds.map(seed =>
                fetch(`https://bolls.life/v2/find/${translation}?search=${encodeURIComponent(seed)}&match_case=false&match_whole=false`)
                    .then(r => r.ok ? r.json() : { results: [] })
                    .catch(() => ({ results: [] }))
            );

            const responses = await Promise.all(fetches);
            responses.forEach(res => {
                const list = Array.isArray(res) ? res : (res.results || []);
                list.forEach(item => {
                    const uniqueKey = `${item.book}-${item.chapter}-${item.verse}`;
                    if (seenBibleKeys.has(uniqueKey)) return;
                    seenBibleKeys.add(uniqueKey);

                    const plainText = (item.text || '').replace(/<[^>]*>/g, '');
                    const bookLabel = classifyBiblicalSource(item.book, item.book_name || `سفر ${item.book}`);
                    const entryObj = {
                        source: bookLabel,
                        chapter: item.chapter,
                        verse: item.verse,
                        text: plainText
                    };

                    if (isEnglish) {
                        groupedBible.masdar.push(entryObj);
                        totalBibleCount++;
                    } else {
                        const matchedKeys = matchStrictDerivativeCategories(plainText, morphData);
                        if (matchedKeys.length > 0) {
                            totalBibleCount++;
                            matchedKeys.forEach(k => groupedBible[k].push(entryObj));
                        }
                    }
                });
            });
        } catch (e) {
            console.warn('Bible search error:', e);
        }

        const html3 = renderGroupedResults(groupedBible, morphData, isEnglish ? rawQuery : null, (item) => {
            const highlighted = highlightStrictTerms(item.text, morphData.allStrictTokens, isEnglish ? rawQuery : null);
            return `
                <div class="verse-item">
                    <div class="verse-meta"><span>[${item.source} — إصحاح ${item.chapter} : آية ${item.verse}]</span></div>
                    <div class="verse-text">${highlighted}</div>
                </div>
            `;
        });
        document.getElementById('content-3').innerHTML = html3;

        // --- المستوى الرابع: المرويات الحديثية (مقيدة بالمشتقات الثمانية) + التلمود (المشنا) ---
        const groupedHadith = {};
        DERIVATIVE_CATEGORIES.forEach(c => { groupedHadith[c.key] = []; });
        let totalHadithCount = 0;

        if (!isEnglish) {
            try {
                const bukhariRes = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json');
                if (bukhariRes.ok) {
                    const bukhariData = await bukhariRes.json();
                    const hadiths = bukhariData.hadiths || [];
                    for (let i = 0; i < hadiths.length; i++) {
                        const hText = hadiths[i].text || '';
                        const matchedKeys = matchStrictDerivativeCategories(hText, morphData);
                        if (matchedKeys.length > 0) {
                            totalHadithCount++;
                            matchedKeys.forEach(k => {
                                if (groupedHadith[k].length < 8) {
                                    groupedHadith[k].push({
                                        source: `صحيح البخاري — حديث رقم ${hadiths[i].hadithnumber}`,
                                        text: hText
                                    });
                                }
                            });
                        }
                        if (totalHadithCount >= 35) break;
                    }
                }
            } catch (e) {
                console.warn('Hadith fetch error:', e);
            }
        }

        let html4 = `<div class="section-sub-header">أولاً: المرويات الحديثية (وفق الألفاظ الثمانية المعتمدة)</div>`;
        html4 += renderGroupedResults(groupedHadith, morphData, isEnglish ? rawQuery : null, (item) => {
            const highlighted = highlightStrictTerms(item.text, morphData.allStrictTokens, isEnglish ? rawQuery : null);
            return `
                <div class="verse-item">
                    <div class="verse-meta"><span>[${item.source}]</span></div>
                    <div class="verse-text">${highlighted}</div>
                </div>
            `;
        });

        // قسم التلمود (المشنا) أسفل الأحاديث مباشرة
        html4 += `<div class="section-sub-header talmud-header">ثانياً: ما ورد في التلمود (المشنا - Mishnah / Talmud)</div>`;
        try {
            const enMap = {
                'الصلاة': 'prayer', 'صلاة': 'prayer',
                'الكتاب': 'book', 'كتاب': 'book',
                'الحق': 'truth', 'حق': 'truth',
                'الدين': 'religion', 'دين': 'religion',
                'الزكاة': 'charity', 'زكاة': 'charity'
            };
            const talmudQuery = isEnglish ? rawQuery : (enMap[rawQuery] || enMap[rawQuery.replace(/^ال/, '')] || rawQuery);
            const sefariaRes = await fetch(`https://www.sefaria.org/api/search-wrapper?q=${encodeURIComponent(talmudQuery)}&type=text&field=naive_lemmatizer&filters[]=Mishnah&size=5`);
            if (sefariaRes.ok) {
                const sefData = await sefariaRes.json();
                const hits = (sefData.hits && sefData.hits.hits) ? sefData.hits.hits : [];
                if (hits.length > 0) {
                    hits.forEach(hit => {
                        const ref = hit._source ? hit._source.ref : 'Mishnah';
                        const snippet = (hit.highlight && hit.highlight.naive_lemmatizer)
                            ? hit.highlight.naive_lemmatizer.join(' ... ').replace(/<[^>]*>/g, '')
                            : (hit._source ? hit._source.exact : '');
                        const hlSnippet = highlightStrictTerms(snippet, morphData.allStrictTokens, talmudQuery);
                        html4 += `
                            <div class="verse-item talmud-item">
                                <div class="verse-meta"><span>[التلمود / المشنا — ${ref}]</span></div>
                                <div class="verse-text" dir="ltr">${hlSnippet}</div>
                            </div>
                        `;
                    });
                } else {
                    html4 += `<div class="empty-note">لم يتم العثور على نصوص مطابقة في المشنا لهذا اللفظ.</div>`;
                }
            }
        } catch (e) {
            html4 += `<div class="empty-note">تعذر الاتصال بقاعدة بيانات المشنا حالياً.</div>`;
        }
        document.getElementById('content-4').innerHTML = html4;

        // --- المستوى السادس: الفقرة التوجيهية الثابتة أولاً ثم الخلاصة التحليلية ---
        const mandatoryIntro6 = `
            <div class="guidance-box-6">
                في هذه المرحلة عليك بالتعويل على نفسك وإحكام عقلك لاستخلاص واستنتاج واستنباط الأحكام التي لا تتعارض مع قول الله، واستعن بأهل الذكر في هذا، ولا تنسَ أنك ستحاسب على اختياراتك؛ فأنت هنا مخيّر ولست مسيّراً، فكل نفس لها ما كسبت وعليها ما اكتسبت، فالحلال بيّن والحرام بيّن، والحق لا يُعلى عليه.
            </div>
        `;

        const summaryHtml6 = `
            ${mandatoryIntro6}
            <div class="summary-box">
                <h3>الخلاصة التدبرية للفظ: (${rawQuery})</h3>
                <ul>
                    <li><strong>الأصل اللغوي والاشتقاقي (المستوى 1):</strong> يعود اللفظ إلى الجذر <strong>(${morphData.root})</strong>، وقد حُصر البحث في كافة المصادر بالألفاظ الثمانية المستنتجة في الجدول الصرفي حصراً دون غيرها.</li>
                    <li><strong>في القرآن الكريم (المستوى 2 و 5):</strong> وردت الألفاظ الثمانية المعتمدة في <strong>${totalQuranCount}</strong> موضعاً قرآنياً بالإملاء الحديث الواضح، وتوزعت بين الصيغ الفعلية والاسمية مع بيان نوع السور (مكية/مدنية) ومواقعها الإعرابية.</li>
                    <li><strong>في الكتب السابقة (المستوى 3):</strong> ظهرت الألفاظ المعتمدة في <strong>${totalBibleCount}</strong> موضعاً عبر التوراة والزبور وأسفار الأنبياء والإنجيل.</li>
                    <li><strong>في المرويات والتلمود (المستوى 4):</strong> رُصدت الألفاظ المعتمدة في المرويات الحديثية مع مقارنة ما ورد في المشنا (التلمود).</li>
                </ul>
            </div>
        `;
        document.getElementById('content-6').innerHTML = summaryHtml6;

        if (loaderEl) loaderEl.style.display = 'none';
        if (resultsWrapper) resultsWrapper.style.display = 'block';
        selectLevelTab(1);
    }

    function selectLevelTab(lvl) {
        levelBtns.forEach(b => {
            b.classList.toggle('active', Number(b.dataset.lvl) === lvl);
        });
        levelCards.forEach(c => {
            const isTarget = c.id === `card-${lvl}`;
            c.style.display = isTarget ? 'block' : 'none';
            c.classList.toggle('active-level', isTarget);
        });
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            stopSpeech();
            selectLevelTab(Number(btn.dataset.lvl));
        });
    });

    if (submitBtn) submitBtn.addEventListener('click', runFullContemplation);
    if (inputEl) {
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') runFullContemplation();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopSpeech();
            if (inputEl) inputEl.value = '';
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
        });
    }
});
