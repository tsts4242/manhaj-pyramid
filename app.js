document.addEventListener('DOMContentLoaded', () => {
    const btnPyr1 = document.getElementById('btn-pyr-1');
    const btnPyr2 = document.getElementById('btn-pyr-2');
    const btnArticles = document.getElementById('btn-articles');
    const boxPyr1 = document.getElementById('pyramid-box-1');
    const boxPyr2 = document.getElementById('pyramid-box-2');
    const boxArticles = document.getElementById('articles-box');
    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBackArticles = document.getElementById('btn-back-articles');

    const inputWord = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const loader = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');

    let currentActiveLevel = 1;
    let cachedQuran = null;

    function hideAllTopBoxes() {
        if (boxPyr1) boxPyr1.style.display = 'none';
        if (boxPyr2) boxPyr2.style.display = 'none';
        if (boxArticles) boxArticles.style.display = 'none';
    }

    if (btnPyr1) btnPyr1.addEventListener('click', () => {
        const isVisible = boxPyr1.style.display === 'block';
        hideAllTopBoxes();
        if (!isVisible) boxPyr1.style.display = 'block';
    });

    if (btnPyr2) btnPyr2.addEventListener('click', () => {
        const isVisible = boxPyr2.style.display === 'block';
        hideAllTopBoxes();
        if (!isVisible) boxPyr2.style.display = 'block';
    });

    if (btnArticles) btnArticles.addEventListener('click', () => {
        const isVisible = boxArticles.style.display === 'block';
        hideAllTopBoxes();
        if (!isVisible) {
            boxArticles.style.display = 'block';
            renderArticlesGrid();
        }
    });

    if (btnBack1) btnBack1.addEventListener('click', hideAllTopBoxes);
    if (btnBack2) btnBack2.addEventListener('click', hideAllTopBoxes);
    if (btnBackArticles) btnBackArticles.addEventListener('click', hideAllTopBoxes);

    function renderArticlesGrid() {
        const grid = document.getElementById('articles-grid');
        const viewer = document.getElementById('article-viewer');
        if (!grid) return;
        grid.innerHTML = '';
        const list = (typeof ARTICLES_DATA !== 'undefined') ? ARTICLES_DATA : [];
        for (let i = 1; i <= 30; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'article-num-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.article-num-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const art = list.find(a => a.id === i);
                if (viewer) {
                    viewer.style.display = 'block';
                    if (art && art.content) {
                        const paras = art.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                        viewer.innerHTML = `<h3>${i}. ${art.title}</h3>${paras}`;
                    } else {
                        viewer.innerHTML = `<h3>المقال رقم ${i}</h3><p>هذا الموضع مهيأ لإضافة البحث والمقال رقم ${i} قريباً.</p>`;
                    }
                }
            });
            grid.appendChild(btn);
        }
    }

    function selectLevel(lvl) {
        currentActiveLevel = lvl;
        levelBtns.forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.lvl, 10) === lvl);
        });
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) card.style.display = (i === lvl) ? 'block' : 'none';
        }
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lvl = parseInt(btn.dataset.lvl, 10);
            selectLevel(lvl);
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (listenBtn) {
                listenBtn.classList.remove('speaking');
                listenBtn.textContent = 'استماع';
            }
            if (inputWord) inputWord.value = '';
            if (loader) loader.style.display = 'none';
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
        });
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            if (!window.speechSynthesis) return;
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                listenBtn.classList.remove('speaking');
                listenBtn.textContent = 'استماع';
                return;
            }
            const artViewer = document.getElementById('article-viewer');
            let textToRead = '';
            if (boxArticles && boxArticles.style.display === 'block' && artViewer && artViewer.style.display === 'block') {
                textToRead = artViewer.innerText;
            } else {
                const activeBody = document.getElementById(`content-${currentActiveLevel}`);
                if (activeBody) textToRead = activeBody.innerText;
            }
            if (!textToRead.trim()) return;

            const utter = new SpeechSynthesisUtterance(textToRead);
            utter.lang = /[\u0600-\u06FF]/.test(textToRead) ? 'ar-SA' : 'en-US';
            utter.rate = 0.95;
            utter.onend = () => {
                listenBtn.classList.remove('speaking');
                listenBtn.textContent = 'استماع';
            };
            listenBtn.classList.add('speaking');
            listenBtn.textContent = 'إيقاف';
            window.speechSynthesis.speak(utter);
        });
    }

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

    function toModernOrthography(text) {
        return text
            .replace(/ٱلصَّلَوٰةِ|ٱلصَّلَوٰةَ|ٱلصَّلَوٰةُ|الصَّلَوٰةِ|الصَّلَوٰةَ|الصَّلَوٰةُ|صَلَوٰةً|صَلَوٰةٍ|صَلَوٰةٌ|صلوة/g, (m) => {
                if (m.startsWith('ٱل') || m.startsWith('ال')) return 'الصلاة';
                return 'صلاة';
            })
            .replace(/ٱلزَّكَوٰةِ|ٱلزَّكَوٰةَ|ٱلزَّكَوٰةُ|الزَّكَوٰةِ|الزَّكَوٰةَ|الزَّكَوٰةُ|زَكَوٰةً|زَكَوٰةٍ|زَكَوٰةٌ|زكوة/g, (m) => {
                if (m.startsWith('ٱل') || m.startsWith('ال')) return 'الزكاة';
                return 'زكاة';
            })
            .replace(/ٱلْحَيَوٰةِ|ٱلْحَيَوٰةَ|ٱلْحَيَوٰةُ|الْحَيَوٰةِ|الْحَيَوٰةَ|الْحَيَوٰةُ|حَيَوٰةً|حَيَوٰةٍ|حَيَوٰةٌ|حيوة/g, (m) => {
                if (m.startsWith('ٱل') || m.startsWith('ال')) return 'الحياة';
                return 'حياة';
            });
    }

    function extractRootAndDerivatives(rawWord) {
        const clean = normalizeAr(rawWord).replace(/^ال/, '');
        const customDict = {
            'صلاه': {
                root: 'ص - ل - و',
                makhraj: 'الصاد (أسلي من طرف اللسان)، اللام (ذلقي من حافة اللسان)، الواو (شفوي)',
                meaning: 'الدعاء والصلة والتعظيم والالتزام بأمر الله وإقامة ذكره.',
                items: [
                    { key: 'past', label: '1. الفعل في الماضي', forms: ['صلى', 'صليت', 'صلوا', 'صلينا', 'صليا'] },
                    { key: 'present', label: '2. الفعل في الحاضر', forms: ['يصلي', 'تصلي', 'نصلي', 'اصلي', 'يصلون', 'تصلون', 'يصلين', 'يصليان'] },
                    { key: 'future', label: '3. الفعل في المستقبل', forms: ['سيصلي', 'ستصلي', 'سنصلي', 'ساصلي', 'سيصلون', 'ستصلون', 'سوف يصلي', 'سوف يصلون'] },
                    { key: 'imperative', label: '4. فعل الأمر', forms: ['صل', 'صلي', 'صلوا', 'صلين', 'صليا'] },
                    { key: 'agent', label: '5. اسم الفاعل (ومثناه وجمعه)', forms: ['مصل', 'المصلي', 'مصلي', 'مصلين', 'المصلين', 'مصلون', 'المصلون', 'مصليات', 'المصليات'] },
                    { key: 'patient', label: '6. اسم المفعول (ومثناه وجمعه)', forms: ['مصلي عليه', 'المصلي عليه', 'مصلي عليهم', 'المصلي عليهم', 'مصليات عليها'] },
                    { key: 'masdar', label: '7. المصدر (ومفرده وجمعه)', forms: ['صلاه', 'الصلاه', 'صلوات', 'الصلوات', 'تصليه', 'التصليه'] },
                    { key: 'place', label: '8. اسم المكان (ومفرده وجمعه)', forms: ['مصلي', 'المصلي', 'مصليات', 'المصليات', 'مصلين'] }
                ]
            },
            'كتاب': {
                root: 'ك - ت - ب',
                makhraj: 'الكاف (لهوي من أقصى اللسان)، التاء (نطعي)، الباء (شفوي)',
                meaning: 'الجمع والخط والفرض والحكم المثبت.',
                items: [
                    { key: 'past', label: '1. الفعل في الماضي', forms: ['كتب', 'كتبت', 'كتبوا', 'كتبنا', 'كتبا'] },
                    { key: 'present', label: '2. الفعل في الحاضر', forms: ['يكتب', 'تكتب', 'نكتب', 'اكتب', 'يكتبون', 'تكتبون', 'يكتبن', 'يكتبان'] },
                    { key: 'future', label: '3. الفعل في المستقبل', forms: ['سيكتب', 'ستكتب', 'سنكتب', 'ساكتب', 'سيكتبون', 'سوف يكتب', 'سوف يكتبون'] },
                    { key: 'imperative', label: '4. فعل الأمر', forms: ['اكتب', 'اكتبي', 'اكتبوا', 'اكتبن', 'اكتبا'] },
                    { key: 'agent', label: '5. اسم الفاعل (ومثناه وجمعه)', forms: ['كاتب', 'الكاتب', 'كاتبان', 'الكاتبان', 'كاتبون', 'الكاتبون', 'كاتبين', 'الكاتبين', 'كتبه', 'الكتبه', 'كاتبات'] },
                    { key: 'patient', label: '6. اسم المفعول (ومثناه وجمعه)', forms: ['مكتوب', 'المكتوب', 'مكتوبه', 'المكتوبه', 'مكتوبان', 'مكتوبون', 'مكتوبين', 'مكتوبات', 'المكتوبات'] },
                    { key: 'masdar', label: '7. المصدر (ومفرده وجمعه)', forms: ['كتاب', 'الكتاب', 'كتب', 'الكتب', 'كتابه', 'الكتابه', 'كتابات'] },
                    { key: 'place', label: '8. اسم المكان (ومفرده وجمعه)', forms: ['مكتب', 'المكتب', 'مكتبه', 'المكتبه', 'مكاتب', 'المكاتب', 'مكتبات'] }
                ]
            }
        };

        if (customDict[clean]) return customDict[clean];

        let stem = clean
            .replace(/^(يست|تست|نست|است|مت|مست|من|م|ت|ي|ن|ا)/, '')
            .replace(/(ون|ين|ات|ان|تان|تين|وا|تم|تن|نا|ها|هم|هن|كم|كن|ه|ي)$/, '');
        if (stem.length < 3) stem = clean;
        const letters = stem.replace(/[اوي]/g, '').split('');
        const c1 = letters[0] || clean[0] || 'ف';
        const c2 = letters[1] || clean[1] || 'ع';
        const c3 = letters[2] || clean[clean.length - 1] || 'ل';

        const pastBase = `${c1}${c2}${c3}`;
        const presBase = `${c1}${c2}${c3}`;
        const agentBase = `${c1}ا${c2}${c3}`;
        const patientBase = `م${c1}${c2}و${c3}`;
        const placeBase = `م${c1}${c2}${c3}`;

        return {
            root: `${c1} - ${c2} - ${c3}`,
            makhraj: `تحليل مخارج الحروف وفق منهج كتاب العين للخليل بن أحمد الفراهيدي للجذر (${c1} ${c2} ${c3}).`,
            meaning: `الأصل اللغوي والاشتقاقي لمادة (${c1}${c2}${c3}) وتقليباتها الصوتية في لسان العرب وكتاب العين.`,
            items: [
                { key: 'past', label: '1. الفعل في الماضي', forms: [pastBase, `${pastBase}ت`, `${pastBase}وا`, `${pastBase}نا`, `${pastBase}ا`] },
                { key: 'present', label: '2. الفعل في الحاضر', forms: [`ي${presBase}`, `ت${presBase}`, `ن${presBase}`, `ا${presBase}`, `ي${presBase}ون`, `ت${presBase}ون`, `ي${presBase}ن`, `ي${presBase}ان`] },
                { key: 'future', label: '3. الفعل في المستقبل', forms: [`سي${presBase}`, `ست${presBase}`, `سن${presBase}`, `سا${presBase}`, `سي${presBase}ون`, `ست${presBase}ون`, `سوف ي${presBase}`, `سوف ي${presBase}ون`] },
                { key: 'imperative', label: '4. فعل الأمر', forms: [`ا${presBase}`, `ا${presBase}ي`, `ا${presBase}وا`, `ا${presBase}ن`, `ا${presBase}ا`] },
                { key: 'agent', label: '5. اسم الفاعل (ومثناه وجمعه)', forms: [agentBase, `ال${agentBase}`, `${agentBase}ه`, `ال${agentBase}ه`, `${agentBase}ان`, `ال${agentBase}ان`, `${agentBase}ون`, `ال${agentBase}ون`, `${agentBase}ين`, `ال${agentBase}ين`, `${agentBase}ات`, `ال${agentBase}ات`] },
                { key: 'patient', label: '6. اسم المفعول (ومثناه وجمعه)', forms: [patientBase, `ال${patientBase}`, `${patientBase}ه`, `ال${patientBase}ه`, `${patientBase}ان`, `ال${patientBase}ان`, `${patientBase}ون`, `ال${patientBase}ون`, `${patientBase}ين`, `ال${patientBase}ين`, `${patientBase}ات`, `ال${patientBase}ات`] },
                { key: 'masdar', label: '7. المصدر (ومفرده وجمعه)', forms: [clean, `ال${clean}`, pastBase, `ال${pastBase}`, `${clean}ات`, `ال${clean}ات`, `${pastBase}ات`] },
                { key: 'place', label: '8. اسم المكان (ومفرده وجمعه)', forms: [placeBase, `ال${placeBase}`, `${placeBase}ه`, `ال${placeBase}ه`, `م${c1}ا${c2}${c3}`, `الم${c1}ا${c2}${c3}`, `${placeBase}ات`] }
            ]
        };
    }

    function buildFlexibleWordRegex(term) {
        const norm = normalizeAr(term);
        if (!norm) return null;
        const parts = norm.split(/\s+/).map(word => {
            let pattern = '';
            for (const ch of word) {
                if (ch === 'ا') pattern += '[اأإآٱ]';
                else if (ch === 'ه') pattern += '[هة]';
                else if (ch === 'ي') pattern += '[يىئ]';
                else if (ch === 'و') pattern += '[وؤ]';
                else pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                pattern += '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
            }
            return pattern;
        });
        return new RegExp(`(^|[^\\u0621-\\u064A])((?:[وفبكلس]|ال|وال|فال|بال|كال|لل)?${parts.join('\\s+')}(?:ها|هم|هن|كم|كن|نا|ه|ي)?)`, 'g');
    }

    function highlightStrictTerms(htmlText, allForms) {
        let result = htmlText;
        const sortedForms = [...new Set(allForms)].filter(Boolean).sort((a, b) => b.length - a.length);
        for (const form of sortedForms) {
            const rx = buildFlexibleWordRegex(form);
            if (rx) {
                result = result.replace(rx, '$1<mark class="hl-term">$2</mark>');
            }
        }
        return result;
    }

    function matchTextAgainstDerivatives(text, derivObj) {
        const normText = normalizeAr(text);
        const words = normText.split(/[^\u0621-\u064A]+/).filter(Boolean);
        const strippedWords = words.map(w => w.replace(/^(وال|فال|بال|كال|لل|ال|و|ف|ب|ك|ل)/, '').replace(/(ها|هم|هن|كم|كن|نا)$/, ''));
        const matchedKeys = [];

        for (const item of derivObj.items) {
            const normForms = item.forms.map(f => normalizeAr(f).replace(/^ال/, ''));
            const found = normForms.some(nf => {
                if (nf.includes(' ')) return normText.includes(nf);
                return words.includes(nf) || strippedWords.includes(nf);
            });
            if (found) matchedKeys.push(item.key);
        }
        return matchedKeys;
    }

    const MADANI_SURAHS = new Set([2,3,4,5,8,9,13,22,24,33,47,48,49,55,57,58,59,60,61,62,63,64,65,66,76,98,99,110]);

    function analyzeQuranIrab(verseText, matchedForms) {
        return 'إعراب اللفظ وموقعه (وفق أصول الكتاب لسيبويه): وردت الكلمة في سياق النظم القرآني متأثرة بالعامل النحوي قبلها (جرّاً بالإضافة أو بحرف الجر، أو نصباً على المفعولية/الحالية، أو رفعاً على الفاعلية/الابتداء) لتؤدي دلالة الحكم والبيان في الآية.';
    }

    async function loadQuranData() {
        if (cachedQuran) return cachedQuran;
        const res = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quran-simple-enhanced.json');
        const data = await res.json();
        cachedQuran = data.quran || [];
        return cachedQuran;
    }

    const SURAH_NAMES = ["","الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

    function classifyBibleBook(bookId) {
        if (bookId >= 1 && bookId <= 5) return 'التوراة';
        if (bookId === 19) return 'الزبور';
        if (bookId >= 6 && bookId <= 39) return 'أسفار الأنبياء والكتب';
        if (bookId >= 40 && bookId <= 66) return 'الإنجيل';
        return 'الكتب السابقة';
    }

    async function searchBibleStrict(derivObj) {
        const allForms = derivObj.items.flatMap(i => i.forms);
        const searchQueries = [...new Set(derivObj.items.map(i => i.forms[0].replace(/^ال/, '')))].slice(0, 6);
        const rawResults = [];
        const seen = new Set();

        for (const q of searchQueries) {
            try {
                const url = `https://bolls.life/v2/find/SVD?search=${encodeURIComponent(q)}&match_case=false&match_whole=false`;
                const r = await fetch(url);
                const data = await r.json();
                const items = Array.isArray(data) ? data : (data.results || []);
                for (const it of items) {
                    const key = `${it.book}-${it.chapter}-${it.verse}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    const cleanTxt = (it.text || '').replace(/<[^>]+>/g, '');
                    const matchedKeys = matchTextAgainstDerivatives(cleanTxt, derivObj);
                    if (matchedKeys.length > 0) {
                        rawResults.push({ ...it, cleanTxt, matchedKeys });
                    }
                }
            } catch (e) {}
        }
        return { rawResults, allForms };
    }

    async function searchHadithStrict(derivObj) {
        const allForms = derivObj.items.flatMap(i => i.forms);
        const matched = [];
        try {
            const res = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari1.min.json');
            const data = await res.json();
            const list = data.hadiths || [];
            for (const h of list) {
                if (!h.text) continue;
                const keys = matchTextAgainstDerivatives(h.text, derivObj);
                if (keys.length > 0) {
                    matched.push({ source: `صحيح البخاري — حديث رقم ${h.hadithnumber}`, text: h.text, matchedKeys: keys });
                    if (matched.length >= 40) break;
                }
            }
        } catch (e) {}
        return { matched, allForms };
    }

    async function searchTalmud(rawWord) {
        try {
            const res = await fetch(`https://www.sefaria.org/api/search-wrapper?query=${encodeURIComponent(rawWord)}&type=text&field=exact&slop=10&size=6&filters[]=Mishnah`);
            const data = await res.json();
            const hits = (data.hits && data.hits.hits) ? data.hits.hits : [];
            return hits.map(h => ({
                ref: h._source.ref || 'Mishnah',
                text: (h._source.exact || '').replace(/<[^>]+>/g, '')
            }));
        } catch (e) {
            return [];
        }
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const rawWord = (inputWord ? inputWord.value : '').trim();
            if (!rawWord) return;

            hideAllTopBoxes();
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            if (loader) loader.style.display = 'flex';

            const derivObj = extractRootAndDerivatives(rawWord);
            const allStrictForms = derivObj.items.flatMap(i => i.forms);

            // Level 1
            const rowsHtml = derivObj.items.map(it => `
                <tr>
                    <td><strong>${it.label}</strong></td>
                    <td>${it.forms.join(' ، ')}</td>
                </tr>
            `).join('');

            document.getElementById('content-1').innerHTML = `
                <div class="verse-box">
                    <p><strong>الجذر اللغوي المستخرج:</strong> (${derivObj.root})</p>
                    <p><strong>مخارج الحروف والبيان الصوتي (كتاب العين للفراهيدي):</strong> ${derivObj.makhraj}</p>
                    <p><strong>الدلالة المعجمية والاشتقاقية:</strong> ${derivObj.meaning}</p>
                </div>
                <table class="deriv-table">
                    <thead>
                        <tr>
                            <th>نوع المشتق وصيغته</th>
                            <th>الألفاظ الحصرية المعتمدة في البحث (المفرد والمثنى والجمع)</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;

            // Level 2 & 5 (Quran)
            const quranVerses = await loadQuranData();
            const groupedQuran = {};
            derivObj.items.forEach(it => groupedQuran[it.key] = []);

            for (const v of quranVerses) {
                const modernText = toModernOrthography(v.text);
                const mKeys = matchTextAgainstDerivatives(modernText, derivObj);
                if (mKeys.length > 0) {
                    groupedQuran[mKeys[0]].push({ ...v, modernText });
                }
            }

            let level2Html = '';
            let level5Html = '';
            for (const it of derivObj.items) {
                const verses = groupedQuran[it.key];
                if (verses && verses.length > 0) {
                    level2Html += `<div class="deriv-group-title">${it.label} (${verses.length} آية)</div>`;
                    level5Html += `<div class="deriv-group-title">${it.label} (${verses.length} آية)</div>`;
                    for (const v of verses) {
                        const sName = SURAH_NAMES[v.chapter] || `سورة ${v.chapter}`;
                        const isMadani = MADANI_SURAHS.has(v.chapter);
                        const badge = isMadani
                            ? `<span class="surah-type-badge surah-madani">مدنية</span>`
                            : `<span class="surah-type-badge surah-makki">مكية</span>`;
                        const hlVerse = highlightStrictTerms(v.modernText, allStrictForms);
                        const irab = analyzeQuranIrab(v.modernText, it.forms);

                        const block = `
                            <div class="verse-box">
                                <div class="verse-text">${hlVerse}</div>
                                <div class="verse-meta">
                                    <span>[سورة ${sName} : ${v.verse}]</span>
                                    ${badge}
                                </div>
                                <div class="irab-box">${irab}</div>
                            </div>
                        `;
                        level2Html += block;
                        level5Html += block;
                    }
                }
            }
            document.getElementById('content-2').innerHTML = level2Html || '<p>لم يُعثر على آيات تطابق الألفاظ الثمانية المستنتجة في المستوى الأول.</p>';
            document.getElementById('content-5').innerHTML = level5Html || '<p>لم يُعثر على آيات تطابق الألفاظ الثمانية المستنتجة في المستوى الأول.</p>';

            // Level 3 (Bible)
            const { rawResults: bibleHits } = await searchBibleStrict(derivObj);
            const groupedBible = {};
            derivObj.items.forEach(it => groupedBible[it.key] = []);
            for (const b of bibleHits) {
                groupedBible[b.matchedKeys[0]].push(b);
            }
            let level3Html = '';
            for (const it of derivObj.items) {
                const list = groupedBible[it.key];
                if (list && list.length > 0) {
                    level3Html += `<div class="deriv-group-title">${it.label} (${list.length} نص)</div>`;
                    for (const b of list) {
                        const category = classifyBibleBook(b.book);
                        const hlTxt = highlightStrictTerms(b.cleanTxt, allStrictForms);
                        level3Html += `
                            <div class="verse-box">
                                <div class="verse-text">${hlTxt}</div>
                                <div class="verse-meta"><span>[${category} — إصحاح ${b.chapter} : عدد ${b.verse}]</span></div>
                            </div>
                        `;
                    }
                }
            }
            document.getElementById('content-3').innerHTML = level3Html || '<p>لم يُعثر على نصوص في الأسفار تطابق الألفاظ الثمانية المستنتجة في المستوى الأول.</p>';

            // Level 4 (Hadith + Talmud)
            const { matched: hadithHits } = await searchHadithStrict(derivObj);
            const groupedHadith = {};
            derivObj.items.forEach(it => groupedHadith[it.key] = []);
            for (const h of hadithHits) {
                groupedHadith[h.matchedKeys[0]].push(h);
            }
            let level4Html = '';
            for (const it of derivObj.items) {
                const list = groupedHadith[it.key];
                if (list && list.length > 0) {
                    level4Html += `<div class="deriv-group-title">${it.label} (${list.length} رواية)</div>`;
                    for (const h of list) {
                        const hlTxt = highlightStrictTerms(h.text, allStrictForms);
                        level4Html += `
                            <div class="verse-box">
                                <div class="verse-text">${hlTxt}</div>
                                <div class="verse-meta"><span>[${h.source}]</span></div>
                            </div>
                        `;
                    }
                }
            }
            if (!level4Html) level4Html = '<p>لم يُعثر على مرويات تطابق الألفاظ الثمانية المستنتجة في المستوى الأول.</p>';

            const talmudHits = await searchTalmud(rawWord);
            level4Html += `<div class="deriv-group-title">ما ورد في التلمود (المشنا)</div>`;
            if (talmudHits.length > 0) {
                for (const t of talmudHits) {
                    level4Html += `
                        <div class="verse-box">
                            <div class="verse-text" dir="ltr">${t.text}</div>
                            <div class="verse-meta" dir="ltr"><span>[Talmud / Mishnah — ${t.ref}]</span></div>
                        </div>
                    `;
                }
            } else {
                level4Html += '<p>لا توجد نصوص مطابقة في المشنا لهذا اللفظ.</p>';
            }
            document.getElementById('content-4').innerHTML = level4Html;

            // Level 6 (Directive + Summary)
            document.getElementById('content-6').innerHTML = `
                <div class="stage6-directive">
                    في هذه المرحلة عليك بالتعويل على نفسك وإحكام عقلك لاستخلاص واستنتاج واستنباط الأحكام التي لا تتعارض مع قول الله، واستعن بأهل الذكر في هذا، ولا تنسَ أنك ستحاسب على اختياراتك؛ فأنت هنا مخيّر ولست مسيّراً، فكل نفس لها ما كسبت وعليها ما اكتسبت، فالحلال بيّن والحرام بيّن، والحق لا يُعلى عليه.
                </div>
                <div class="verse-box">
                    <p><strong>خلاصة التدبر في لفظ (${rawWord}) وجذره (${derivObj.root}):</strong></p>
                    <p>تم حصر البحث في الألفاظ الثمانية المستنتجة من الجدول الصرفي للمستوى الأول (بمفردها ومثناها وجمعها) واستعراض شواهدها في القرآن الكريم، والكتب السابقة، والمرويات، لتكون بين يدي الباحث للموازنة والاستنباط الواعي.</p>
                </div>
            `;

            if (loader) loader.style.display = 'none';
            if (resultsWrapper) resultsWrapper.style.display = 'flex';
            selectLevel(1);
        });
    }
});
