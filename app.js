// منهج الصلاح والفوز - app.js (النسخة المحدثة والمطابقة بالكامل)
document.addEventListener('DOMContentLoaded', function() {
    // 1. أزرار الهرم والمقالات
    const btnPyr1 = document.getElementById('btn-pyr-1');
    const btnPyr2 = document.getElementById('btn-pyr-2');
    const btnArticles = document.getElementById('btn-articles');
    const boxPyr1 = document.getElementById('pyramid-box-1');
    const boxPyr2 = document.getElementById('pyramid-box-2');
    const boxArticles = document.getElementById('articles-box');
    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBackArticles = document.getElementById('btn-back-articles');

    function hideAllOverlays() {
        if (boxPyr1) boxPyr1.style.display = 'none';
        if (boxPyr2) boxPyr2.style.display = 'none';
        if (boxArticles) boxArticles.style.display = 'none';
    }

    if (btnPyr1 && boxPyr1) {
        btnPyr1.addEventListener('click', function() {
            const isVisible = boxPyr1.style.display === 'block';
            hideAllOverlays();
            boxPyr1.style.display = isVisible ? 'none' : 'block';
        });
    }
    if (btnPyr2 && boxPyr2) {
        btnPyr2.addEventListener('click', function() {
            const isVisible = boxPyr2.style.display === 'block';
            hideAllOverlays();
            boxPyr2.style.display = isVisible ? 'none' : 'block';
        });
    }
    if (btnArticles && boxArticles) {
        btnArticles.addEventListener('click', function() {
            const isVisible = boxArticles.style.display === 'block';
            hideAllOverlays();
            boxArticles.style.display = isVisible ? 'none' : 'block';
            renderArticlesGrid();
        });
    }
    if (btnBack1) btnBack1.addEventListener('click', hideAllOverlays);
    if (btnBack2) btnBack2.addEventListener('click', hideAllOverlays);
    if (btnBackArticles) btnBackArticles.addEventListener('click', hideAllOverlays);

    // 2. شبكة المقالات (1 إلى 30)
    function renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        const viewer = document.getElementById('article-viewer');
        if (!grid) return;
        grid.innerHTML = '';
        const list = (typeof ARTICLES_DATA !== 'undefined') ? ARTICLES_DATA : {};
        for (let i = 1; i <= 30; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'art-num-btn';
            btn.textContent = i;
            if (list[i] && list[i].content && !list[i].content.includes('مساحة مخصصة')) {
                btn.classList.add('has-content');
            }
            btn.addEventListener('click', function() {
                document.querySelectorAll('.art-num-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const item = list[i] || { title: 'مقال رقم ' + i, content: 'لم يتم إدراج نص هذا المقال بعد.' };
                if (viewer) {
                    viewer.style.display = 'block';
                    viewer.innerHTML = '<h3 class="art-view-title">' + item.title + '</h3><div class="art-view-body">' + item.content.replace(/\n/g, '<br>') + '</div>';
                    viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
            grid.appendChild(btn);
        }
    }

    // 3. عناصر البحث والمستويات
    const inputWord = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const loader = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');
    const levelBtns = document.querySelectorAll('.level-btn');

    let currentActiveLevel = 1;
    let isSpeaking = false;

    function showLevel(lvl) {
        currentActiveLevel = lvl;
        levelBtns.forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-lvl')) === lvl);
        });
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById('card-' + i);
            if (card) card.style.display = (i === lvl) ? 'block' : 'none';
        }
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lvl = parseInt(this.getAttribute('data-lvl'));
            if (resultsWrapper && resultsWrapper.style.display === 'block') {
                showLevel(lvl);
            } else if (inputWord && inputWord.value.trim()) {
                currentActiveLevel = lvl;
                runSearch();
            } else {
                showLevel(lvl);
            }
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            isSpeaking = false;
            if (listenBtn) listenBtn.textContent = 'استماع';
            if (inputWord) inputWord.value = '';
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            if (loader) loader.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
        });
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', function() {
            if (!window.speechSynthesis) return;
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
                listenBtn.textContent = 'استماع';
                return;
            }
            let textToRead = '';
            const viewer = document.getElementById('article-viewer');
            if (boxArticles && boxArticles.style.display === 'block' && viewer && viewer.style.display === 'block') {
                textToRead = viewer.innerText;
            } else {
                const activeContent = document.getElementById('content-' + currentActiveLevel);
                if (activeContent) textToRead = activeContent.innerText;
            }
            if (!textToRead.trim()) return;
            const utter = new SpeechSynthesisUtterance(textToRead);
            utter.lang = /[\u0600-\u06FF]/.test(textToRead) ? 'ar-SA' : 'en-US';
            utter.rate = 0.95;
            utter.onend = function() {
                isSpeaking = false;
                listenBtn.textContent = 'استماع';
            };
            isSpeaking = true;
            listenBtn.textContent = 'إيقاف';
            window.speechSynthesis.speak(utter);
        });
    }

    if (submitBtn) submitBtn.addEventListener('click', runSearch);
    if (inputWord) {
        inputWord.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') runSearch();
        });
    }

    // 4. أدوات المعالجة العربية والمشتقات السبعة
    function normalizeAr(str) {
        if (!str) return '';
        return str
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .trim();
    }

    function toModernImlaei(text) {
        if (!text) return '';
        return text
            .replace(/ٱلصَّلَوٰة/g, 'الصَّلَاة')
            .replace(/صَلَوٰة/g, 'صَلَاة')
            .replace(/الصلوة/g, 'الصلاة')
            .replace(/صلوة/g, 'صلاة')
            .replace(/ٱلزَّكَوٰة/g, 'الزَّكَاة')
            .replace(/زَكَوٰة/g, 'زَكَاة')
            .replace(/الزكوة/g, 'الزكاة')
            .replace(/زكوة/g, 'زكاة')
            .replace(/ٱلْحَيَوٰة/g, 'الْحَيَاة')
            .replace(/حَيَوٰة/g, 'حَيَاة')
            .replace(/الحيوة/g, 'الحياة')
            .replace(/حيوة/g, 'حياة')
            .replace(/ٱلرِّبَوٰا۟/g, 'الرِّبَا')
            .replace(/الربوا/g, 'الربا');
    }

    function extractRootAndDerivatives(word) {
        const clean = normalizeAr(word).replace(/^ال/, '');
        let root = clean;
        if (clean.length > 3) {
            root = clean.replace(/^[يتنمأ]/, '').replace(/[ةهواين]$/, '');
            if (root.length > 3) root = root.slice(0, 3);
        }
        const f = root[0] || 'ف';
        const a = root[1] || 'ع';
        const l = root[2] || 'ل';

        if (clean.includes('صلا') || clean.includes('صلو') || root === 'صل') {
            return {
                root: 'ص - ل - و',
                derivatives: [
                    { type: 'الفعل الماضي', form: 'صَلَّى', patterns: ['صلي', 'صلوا', 'صليت', 'صلينا', 'صليتم'] },
                    { type: 'الفعل المضارع', form: 'يُصَلِّي', patterns: ['يصلي', 'يصلون', 'تصلي', 'تصلون', 'نصلي', 'اصلي', 'يصل'] },
                    { type: 'فعل الأمر', form: 'صَلِّ', patterns: ['صل', 'صلوا', 'صلي'] },
                    { type: 'اسم الفاعل', form: 'مُصَلٍّ / الْمُصَلِّي', patterns: ['مصلين', 'المصلين', 'مصلي', 'المصلي', 'مصلون', 'المصلون'] },
                    { type: 'اسم المفعول', form: 'مُصَلًّى (عليه)', patterns: ['مصلي عليه'] },
                    { type: 'اسم المكان', form: 'مُصَلًّى', patterns: ['مصلي'] },
                    { type: 'المصدر والاسم الجامد', form: 'صَلَاة / تَصْلِيَة', patterns: ['صلاه', 'الصلاه', 'صلوات', 'الصلوات', 'صلاتهم', 'صلاتك', 'صلاتكم', 'صلاتي', 'صلاته'] }
                ]
            };
        }

        const isDefective = (l === 'ي' || l === 'و' || l === 'ا');
        const past = isDefective ? (f + 'َ' + a + 'َى') : (f + 'َ' + a + 'َ' + l + 'َ');
        const pres = isDefective ? ('يَ' + f + 'ْ' + a + 'ِي') : ('يَ' + f + 'ْ' + a + 'ُ' + l + 'ُ');
        const imp = isDefective ? ('اِ' + f + 'ْ' + a + 'ِ') : ('اِ' + f + 'ْ' + a + 'َ' + l + 'ْ');
        const activeP = f + 'َا' + a + 'ِ' + l;
        const passiveP = 'مَ' + f + 'ْ' + a + 'ُو' + l;
        const placeN = 'مَ' + f + 'ْ' + a + 'َ' + l;
        const masdar = clean;

        return {
            root: f + ' - ' + a + ' - ' + l,
            derivatives: [
                { type: 'الفعل الماضي', form: past, patterns: [f + a + l, f + a + l + 'وا', f + a + l + 'ت', f + a + l + 'نا', f + a + l + 'تم'] },
                { type: 'الفعل المضارع', form: pres, patterns: ['ي' + f + a + l, 'ت' + f + a + l, 'ن' + f + a + l, 'ا' + f + a + l, 'ي' + f + a + l + 'ون', 'ت' + f + a + l + 'ون', 'ي' + f + a + l + 'ين'] },
                { type: 'فعل الأمر', form: imp, patterns: ['ا' + f + a + l, 'ا' + f + a + l + 'وا', f + a + l + 'وا'] },
                { type: 'اسم الفاعل', form: activeP, patterns: [f + 'ا' + a + l, f + 'ا' + a + l + 'ون', f + 'ا' + a + l + 'ين', f + 'ا' + a + l + 'ه', 'م' + f + a + l, 'م' + f + a + l + 'ون', 'م' + f + a + l + 'ين'] },
                { type: 'اسم المفعول', form: passiveP, patterns: ['م' + f + a + 'و' + l, 'م' + f + a + 'و' + l + 'ه', 'م' + f + a + 'و' + l + 'ون', 'م' + f + a + 'و' + l + 'ين'] },
                { type: 'اسم المكان', form: placeN, patterns: ['م' + f + a + l, 'م' + f + a + l + 'ه', 'م' + f + 'ا' + a + l] },
                { type: 'المصدر والاسم الجامد', form: masdar, patterns: [clean, root, f + a + l + 'ه', f + 'ا' + a + l + 'ه'] }
            ]
        };
    }

    // مطابقة دقيقة للكلمات العربية داخل النص بتقسيم الكلمات ومقارنة الجذور واللواصق
    function classifyArabicTextByDerivative(normText, derivInfo, normQ) {
        const words = normText.split(/[\s،؛:.؟!«»"()\[\]{}-]+/).filter(Boolean);
        const stripPrefixes = w => w.replace(/^(و|ف|ب|ك|ل|ال|وال|فال|بال|كال|لل|سي|ست|سن|سا)/, '');

        for (const d of derivInfo.derivatives) {
            for (const w of words) {
                const coreW = stripPrefixes(w);
                for (const pat of d.patterns) {
                    if (pat.length >= 2 && (coreW === pat || coreW.startsWith(pat) || (pat.length >= 3 && coreW.includes(pat)))) {
                        return d.type;
                    }
                }
            }
        }
        if (normQ.length >= 2 && normText.includes(normQ)) {
            return 'المصدر والاسم الجامد';
        }
        return null;
    }

    function escapeReg(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightMatch(text, terms) {
        if (!text || !terms || !terms.length) return text;
        let out = text;
        const validTerms = [...new Set(terms.filter(t => t && t.length >= 2))].sort((a, b) => b.length - a.length);
        validTerms.forEach(term => {
            const norm = normalizeAr(term);
            if (/^[\u0600-\u06FF]+$/.test(norm)) {
                let pat = '';
                for (let i = 0; i < norm.length; i++) {
                    let ch = norm[i];
                    if (ch === 'ا') ch = '[اأإآٱ]';
                    else if (ch === 'ه') ch = '[هة]';
                    else if (ch === 'ي') ch = '[يىئ]';
                    else if (ch === 'و') ch = '[وؤ]';
                    else ch = escapeReg(ch);
                    pat += ch + '[\u064B-\u065F\u0670\u06D6-\u06ED]*';
                }
                const rx = new RegExp('(' + pat + ')', 'g');
                out = out.replace(rx, '<mark class="hl-word">$1</mark>');
            } else {
                const rx = new RegExp('(' + escapeReg(term) + ')', 'gi');
                out = out.replace(rx, '<mark class="hl-word">$1</mark>');
            }
        });
        return out;
    }

    // بيانات السور (مكية / مدنية)
    const MEDINAN_SURAHS = [2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110];
    function getSurahType(num) {
        return MEDINAN_SURAHS.includes(num) ? 'مدنية' : 'مكية';
    }

    function analyzeGrammar(ayahText, matchedWord) {
        const clean = normalizeAr(matchedWord);
        if (clean.startsWith('ي') || clean.startsWith('ت') || clean.startsWith('ن')) {
            return 'فعل مضارع مرفوع (أو منصوب/مجزوم بحسب العامل)، والفاعل ضمير مستتر أو متصل، على أصول (الكتاب لسيبويه).';
        }
        if (ayahText.includes('فِي ') || ayahText.includes('بِ') || ayahText.includes('عَلَى ') || ayahText.includes('إِلَى ') || ayahText.includes('مِنَ ')) {
            return 'اسم مجرور بحرف الجر وعلامة جره الكسرة الظاهرة أو المقدرة للتعذر، وشبه الجملة متعلق بالفعل في السياق.';
        }
        if (clean.startsWith('ال') || clean.endsWith('ه') || clean.endsWith('ا')) {
            return 'اسم منصوب على المفعولية (مفعول به) أو مرفوع على الابتداء/الفاعلية بحسب موقعه في الجملة القرآنية.';
        }
        return 'لفظ محكم يأخذ موقعه الإعرابي من السياق التركيبي للجملة القرآنية وفق أصول النحو العربي في (الكتاب لسيبويه).';
    }

    function classifyBibleBook(bookId) {
        if (bookId >= 1 && bookId <= 5) return 'التوراة';
        if (bookId === 19) return 'الزبور';
        if (bookId >= 6 && bookId <= 39) return 'أسفار الأنبياء والكتب';
        return 'الإنجيل';
    }

    // 5. تشغيل البحث الشامل across المستويات 1 - 6
    async function runSearch() {
        const rawQuery = inputWord ? inputWord.value.trim() : '';
        if (!rawQuery) return;

        if (loader) loader.style.display = 'block';
        if (resultsWrapper) resultsWrapper.style.display = 'none';

        const isArabic = /[\u0600-\u06FF]/.test(rawQuery);
        const derivInfo = isArabic ? extractRootAndDerivatives(rawQuery) : { root: rawQuery, derivatives: [] };
        const normQ = normalizeAr(rawQuery);
        const allPatterns = isArabic
            ? [normQ].concat(derivInfo.derivatives.flatMap(d => d.patterns))
            : [rawQuery.toLowerCase()];

        // بناء المستوى الأول (كتاب العين + جدول المشتقات)
        let lvl1Html = '<div class="sub-box"><h4>الجذر اللغوي والتحليل الصوتي (منهج كتاب العين للفراهيدي)</h4>';
        lvl1Html += '<p><strong>الجذر المستخرج:</strong> (' + derivInfo.root + ')</p>';
        lvl1Html += '<p>يُردّ اللفظ في <em>كتاب العين</em> للخليل بن أحمد الفراهيدي إلى أصوله الحرفية ومخارجها الصوتية للوقوف على المعنى المحوري المشترك بين جميع تقليباته واشتقاقاته.</p></div>';

        if (isArabic && derivInfo.derivatives.length) {
            lvl1Html += '<table class="deriv-table"><thead><tr><th>المشتق الصرفي</th><th>الكلمة / الصيغة</th></tr></thead><tbody>';
            derivInfo.derivatives.forEach(d => {
                lvl1Html += '<tr><td><strong>' + d.type + '</strong></td><td>' + d.form + '</td></tr>';
            });
            lvl1Html += '</tbody></table>';
        }
        document.getElementById('content-1').innerHTML = lvl1Html;

        // جلب القرآن الكريم (الإملاء الحديث) والبحث بجميع المشتقات
        let quranMatches = [];
        try {
            const edition = isArabic ? 'quran-simple-enhanced' : 'en.sahih';
            const res = await fetch('https://api.alquran.cloud/v1/quran/' + edition);
            const data = await res.json();
            if (data && data.data && data.data.surahs) {
                data.data.surahs.forEach(surah => {
                    surah.ayahs.forEach(ayah => {
                        const modernText = isArabic ? toModernImlaei(ayah.text) : ayah.text;
                        const normText = isArabic ? normalizeAr(modernText) : modernText.toLowerCase();
                        let matchedDer = null;

                        if (isArabic) {
                            matchedDer = classifyArabicTextByDerivative(normText, derivInfo, normQ);
                        } else if (normText.includes(rawQuery.toLowerCase())) {
                            matchedDer = 'النتائج المطابقة';
                        }

                        if (matchedDer) {
                            quranMatches.push({
                                surahName: surah.name,
                                surahNum: surah.number,
                                surahType: getSurahType(surah.number),
                                ayahNum: ayah.numberInSurah,
                                text: modernText,
                                derivativeType: matchedDer,
                                patterns: allPatterns
                            });
                        }
                    });
                });
            }
        } catch (e) {
            console.error(e);
        }

        // بناء المستوى الثاني (مرتب حسب المشتقات السبعة + الإعراب + مكية/مدنية)
        let lvl2Html = '';
        if (quranMatches.length === 0) {
            lvl2Html = '<p class="empty-msg">لم يتم العثور على آيات مطابقة لهذا اللفظ ومشتقاته.</p>';
        } else {
            const order = ['الفعل الماضي', 'الفعل المضارع', 'فعل الأمر', 'اسم الفاعل', 'اسم المفعول', 'اسم المكان', 'المصدر والاسم الجامد', 'النتائج المطابقة'];
            order.forEach(groupName => {
                const groupItems = quranMatches.filter(m => m.derivativeType === groupName);
                if (groupItems.length > 0) {
                    lvl2Html += '<div class="deriv-group-header">' + groupName + ' (' + groupItems.length + ')</div>';
                    groupItems.slice(0, 30).forEach(item => {
                        const hlText = highlightMatch(item.text, item.patterns);
                        const grammarNote = analyzeGrammar(item.text, rawQuery);
                        lvl2Html += '<div class="verse-item">' +
                            '<div class="verse-meta">[' + item.surahName + ' : ' + item.ayahNum + '] <span class="surah-badge">' + item.surahType + '</span></div>' +
                            '<div class="verse-text">' + hlText + '</div>' +
                            '<div class="grammar-box"><strong>الإعراب والسياق (الكتاب لسيبويه):</strong> ' + grammarNote + '</div>' +
                            '</div>';
                    });
                }
            });
        }
        document.getElementById('content-2').innerHTML = lvl2Html;

        // بناء المستوى الخامس (الآيات المحكمات والأحكام)
        const muhkamat = quranMatches.filter(m => [2,3,4,5,6,7,17,24,33,49,65].includes(m.surahNum)).slice(0, 20);
        let lvl5Html = '';
        if (muhkamat.length === 0) {
            lvl5Html = '<p class="empty-msg">تُستنبط الأحكام من مجموع الآيات الواردة في المستوى الثاني بردّ المتشابه إلى المحكم.</p>';
        } else {
            muhkamat.forEach(item => {
                lvl5Html += '<div class="verse-item">' +
                    '<div class="verse-meta">[' + item.surahName + ' : ' + item.ayahNum + '] <span class="surah-badge">' + item.surahType + '</span></div>' +
                    '<div class="verse-text">' + highlightMatch(item.text, item.patterns) + '</div>' +
                    '<div class="grammar-box"><strong>البيان النحوي والتشريعي:</strong> ' + analyzeGrammar(item.text, rawQuery) + '</div>' +
                    '</div>';
            });
        }
        document.getElementById('content-5').innerHTML = lvl5Html;

        // بناء المستوى الثالث (العهد القديم والزبور والأنبياء والعهد الجديد بجميع المشتقات)
        let lvl3Html = '';
        try {
            const bibleTrans = isArabic ? 'SVD' : 'KJV';
            const searchTerms = isArabic
                ? [...new Set([rawQuery].concat(derivInfo.derivatives.map(d => normalizeAr(d.patterns[0] || ''))))].filter(t => t && t.length >= 2).slice(0, 6)
                : [rawQuery];

            const bibleFetches = searchTerms.map(term =>
                fetch('https://bolls.life/v2/find/' + bibleTrans + '?search=' + encodeURIComponent(term) + '&match_case=false&match_whole=false')
                    .then(r => r.json())
                    .catch(() => ({ results: [] }))
            );

            const responses = await Promise.all(bibleFetches);
            const seenRefs = new Set();
            const bResults = [];
            responses.forEach(bData => {
                const list = (bData && bData.results) ? bData.results : (Array.isArray(bData) ? bData : []);
                list.forEach(r => {
                    const key = (r.book || '') + ':' + (r.chapter || '') + ':' + (r.verse || '');
                    if (!seenRefs.has(key)) {
                        seenRefs.add(key);
                        bResults.push(r);
                    }
                });
            });

            if (bResults.length === 0) {
                lvl3Html = '<p class="empty-msg">لم يتم العثور على نصوص مطابقة في أسفار العهد القديم والجديد.</p>';
            } else {
                const order = ['الفعل الماضي', 'الفعل المضارع', 'فعل الأمر', 'اسم الفاعل', 'اسم المفعول', 'اسم المكان', 'المصدر والاسم الجامد'];
                let grouped = {};
                order.forEach(o => grouped[o] = []);

                bResults.slice(0, 60).forEach(r => {
                    const cleanVerse = (r.text || '').replace(/<[^>]+>/g, '');
                    const normV = normalizeAr(cleanVerse);
                    let placed = 'المصدر والاسم الجامد';
                    if (isArabic) {
                        const detected = classifyArabicTextByDerivative(normV, derivInfo, normQ);
                        if (detected) placed = detected;
                    }
                    grouped[placed].push({
                        sourceCat: classifyBibleBook(r.book || 1),
                        bookName: r.book_name || ('سفر رقم ' + (r.book || '')),
                        chapter: r.chapter || 1,
                        verse: r.verse || 1,
                        text: cleanVerse
                    });
                });

                order.forEach(groupName => {
                    if (grouped[groupName].length > 0) {
                        lvl3Html += '<div class="deriv-group-header">' + groupName + ' (' + grouped[groupName].length + ')</div>';
                        grouped[groupName].forEach(item => {
                            lvl3Html += '<div class="verse-item">' +
                                '<div class="verse-meta">[' + item.sourceCat + ' — ' + item.bookName + ' ' + item.chapter + ':' + item.verse + ']</div>' +
                                '<div class="verse-text">' + highlightMatch(item.text, allPatterns) + '</div>' +
                                '</div>';
                        });
                    }
                });
            }
        } catch (e) {
            lvl3Html = '<p class="empty-msg">تعذر الاتصال بقاعدة بيانات الأسفار حالياً.</p>';
        }
        document.getElementById('content-3').innerHTML = lvl3Html;

        // بناء المستوى الرابع (المرويات الحديثية بجميع المشتقات + التلمود المشنا)
        let lvl4Html = '<div class="sub-box"><h4>أولاً: المرويات الحديثية (مصنفة حسب اللفظ ومشتقاته)</h4></div>';
        try {
            const hRes = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json');
            const hData = await hRes.json();
            const hadiths = (hData && hData.hadiths) ? hData.hadiths : [];
            const matchedHadiths = [];

            for (let i = 0; i < hadiths.length && matchedHadiths.length < 45; i++) {
                const hText = hadiths[i].text || '';
                const normH = normalizeAr(hText);
                const placed = isArabic ? classifyArabicTextByDerivative(normH, derivInfo, normQ) : (normH.includes(rawQuery.toLowerCase()) ? 'المصدر والاسم الجامد' : null);
                if (placed) {
                    matchedHadiths.push({ num: hadiths[i].hadithnumber, text: hText, type: placed });
                }
            }

            if (matchedHadiths.length === 0) {
                lvl4Html += '<p class="empty-msg">لم يتم العثور على مرويات مطابقة لهذا اللفظ ومشتقاته.</p>';
            } else {
                const order = ['الفعل الماضي', 'الفعل المضارع', 'فعل الأمر', 'اسم الفاعل', 'اسم المفعول', 'اسم المكان', 'المصدر والاسم الجامد'];
                order.forEach(groupName => {
                    const items = matchedHadiths.filter(m => m.type === groupName);
                    if (items.length > 0) {
                        lvl4Html += '<div class="deriv-group-header">' + groupName + ' (' + items.length + ')</div>';
                        items.forEach(item => {
                            lvl4Html += '<div class="verse-item">' +
                                '<div class="verse-meta">[صحيح البخاري — حديث رقم ' + item.num + ']</div>' +
                                '<div class="verse-text">' + highlightMatch(item.text, allPatterns) + '</div>' +
                                '</div>';
                        });
                    }
                });
            }
        } catch (e) {
            lvl4Html += '<p class="empty-msg">تعذر تحميل المرويات حالياً.</p>';
        }

        // قسم التلمود (المشنا) تحت الأحاديث مباشرة
        lvl4Html += '<div class="sub-box" style="margin-top:18px;"><h4>ثانياً: التلمود (المشنا — Mishnah)</h4></div>';
        try {
            const sefQuery = isArabic ? 'Prayer' : rawQuery;
            const sRes = await fetch('https://www.sefaria.org/api/search-wrapper?query=' + encodeURIComponent(sefQuery) + '&type=text&field=exact&slop=10&size=8');
            const sData = await sRes.json();
            const hits = (sData && sData.hits && sData.hits.hits) ? sData.hits.hits : [];
            if (hits.length === 0) {
                lvl4Html += '<p class="empty-msg">لم يتم العثور على نصوص مطابقة في التلمود (المشنا).</p>';
            } else {
                hits.forEach(hit => {
                    const src = hit._source || {};
                    const ref = src.ref || 'Mishnah';
                    const snippet = (hit.highlight && hit.highlight.exact) ? hit.highlight.exact.join(' ... ') : (src.exact || '');
                    lvl4Html += '<div class="verse-item">' +
                        '<div class="verse-meta">[التلمود / المشنا — ' + ref + ']</div>' +
                        '<div class="verse-text" dir="ltr">' + snippet + '</div>' +
                        '</div>';
                });
            }
        } catch (e) {
            lvl4Html += '<p class="empty-msg">تعذر الاتصال بقاعدة بيانات التلمود (Sefaria) حالياً.</p>';
        }
        document.getElementById('content-4').innerHTML = lvl4Html;

        // بناء المستوى السادس (الفقرة التوجيهية الثابتة ثم الخلاصة)
        const guidanceParagraph = 'في هذه المرحلة عليك بالتعويل على نفسك وإحكام عقلك لاستخلاص واستنتاج واستنباط الأحكام التي لا تتعارض مع قول الله، واستعن بأهل الذكر في هذا، ولا تنسَ أنك ستحاسب على اختياراتك؛ فأنت هنا مخيّر ولست مسيّراً، فكل نفس لها ما كسبت وعليها ما اكتسبت، فالحلال بيّن والحرام بيّن، والحق لا يُعلى عليه.';
        let lvl6Html = '<div class="guidance-box"><p>' + guidanceParagraph + '</p></div>';
        lvl6Html += '<div class="sub-box"><h4>خلاصة التدبر والبحث للفظ (' + rawQuery + ')</h4>' +
            '<p>• <strong>الأصل اللغوي (كتاب العين):</strong> يعود اللفظ إلى الجذر (' + derivInfo.root + ') وتصريفاته السبعة.</p>' +
            '<p>• <strong>الإحصاء القرآني:</strong> ورد اللفظ ومشتقاته في <strong>' + quranMatches.length + '</strong> موضعاً في القرآن الكريم بالرسم الإملائي الواضح.</p>' +
            '<p>• <strong>الميزان النهائي:</strong> يُعرض كل ما ورد في الكتب السابقة والمرويات والتلمود على محكم التنزيل؛ فما وافقه قُبل، وما خالفه تُرك.</p></div>';
        document.getElementById('content-6').innerHTML = lvl6Html;

        if (loader) loader.style.display = 'none';
        if (resultsWrapper) resultsWrapper.style.display = 'block';
        showLevel(currentActiveLevel);
    }
});
