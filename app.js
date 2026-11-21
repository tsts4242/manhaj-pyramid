document.addEventListener('DOMContentLoaded', function () {
    const btnPyr1 = document.getElementById('btn-pyr-1');
    const btnPyr2 = document.getElementById('btn-pyr-2');
    const btnArticles = document.getElementById('btn-articles');
    const pyrBox1 = document.getElementById('pyramid-box-1');
    const pyrBox2 = document.getElementById('pyramid-box-2');
    const articlesBox = document.getElementById('articles-box');
    const btnBack1 = document.getElementById('btn-back-1');
    const btnBack2 = document.getElementById('btn-back-2');
    const btnBackArticles = document.getElementById('btn-back-articles');
    const articlesGrid = document.getElementById('articles-grid');
    const articleViewer = document.getElementById('article-viewer');

    const inputEl = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const loader = document.getElementById('loader');
    const resultsWrapper = document.getElementById('results-wrapper');

    let activeLevel = 1;
    let quranCache = null;

    const MAKKI_SURAHS = new Set([1,6,7,10,11,12,14,15,16,17,18,19,20,21,23,25,26,27,28,29,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,50,51,52,53,54,56,67,68,69,70,71,72,73,74,75,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,100,101,102,103,104,105,106,107,108,109,111,112,113,114]);

    const SURAH_NAMES = ["","الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];

    function hideAllTopPanels() {
        if (pyrBox1) pyrBox1.style.display = 'none';
        if (pyrBox2) pyrBox2.style.display = 'none';
        if (articlesBox) articlesBox.style.display = 'none';
    }

    if (btnPyr1) btnPyr1.addEventListener('click', () => {
        const isOpen = pyrBox1.style.display === 'block';
        hideAllTopPanels();
        pyrBox1.style.display = isOpen ? 'none' : 'block';
    });

    if (btnPyr2) btnPyr2.addEventListener('click', () => {
        const isOpen = pyrBox2.style.display === 'block';
        hideAllTopPanels();
        pyrBox2.style.display = isOpen ? 'none' : 'block';
    });

    if (btnArticles) btnArticles.addEventListener('click', () => {
        const isOpen = articlesBox.style.display === 'block';
        hideAllTopPanels();
        articlesBox.style.display = isOpen ? 'none' : 'block';
    });

    if (btnBack1) btnBack1.addEventListener('click', hideAllTopPanels);
    if (btnBack2) btnBack2.addEventListener('click', hideAllTopPanels);
    if (btnBackArticles) btnBackArticles.addEventListener('click', hideAllTopPanels);

    if (articlesGrid) {
        const arts = (typeof ARTICLES_DATA !== 'undefined') ? ARTICLES_DATA : {};
        for (let i = 1; i <= 30; i++) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'art-num-btn' + (arts[i] && arts[i].content && !arts[i].content.includes('مساحة مخصصة') ? ' has-article' : '');
            b.textContent = i;
            b.addEventListener('click', () => {
                document.querySelectorAll('.art-num-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                const item = arts[i] || { title: `مقال رقم ${i}`, content: 'لم يتم إدراج نص هذا المقال بعد.' };
                const paras = item.content.split(/\n+/).filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                articleViewer.innerHTML = `<div class="article-reader-box"><h3 class="article-reader-title">${i}. ${item.title}</h3><div class="article-reader-body">${paras}</div></div>`;
                articleViewer.style.display = 'block';
            });
            articlesGrid.appendChild(b);
        }
    }

    function normalizeAr(text) {
        if (!text) return '';
        return text
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي')
            .trim();
    }

    function toModernSpelling(text) {
        return text
            .replace(/ٱلصَّلَوٰة/g, 'الصَّلَاة')
            .replace(/صَلَوٰة/g, 'صَلَاة')
            .replace(/ٱلزَّكَوٰة/g, 'الزَّكَاة')
            .replace(/زَكَوٰة/g, 'زَكَاة')
            .replace(/ٱلْحَيَوٰة/g, 'الْحَيَاة')
            .replace(/حَيَوٰة/g, 'حَيَاة')
            .replace(/ٱلرِّبَوٰا۟/g, 'الرِّبَا')
            .replace(/ٱلرِّبَوٰا/g, 'الرِّبَا')
            .replace(/مِشْكَوٰة/g, 'مِشْكَاة')
            .replace(/نَجَوٰة/g, 'نَجَاة')
            .replace(/مَنَوٰة/g, 'مَنَاة')
            .replace(/ٱلْغَدَوٰة/g, 'الْغَدَاة');
    }

    function extractRootAndDerivatives(word) {
        let clean = normalizeAr(word).replace(/[^ا-ي]/g, '');
        if (clean.startsWith('ال') && clean.length > 4) clean = clean.slice(2);
        let core = clean.replace(/^(و|ف|ب|ك|ل)/, '');
        if (core.startsWith('ال') && core.length > 4) core = core.slice(2);
        core = core.replace(/(ات|ون|ين|ان|يه|ه|ت|نا|كم|هم)$/, '');

        if (core === 'صلاه' || core === 'صلو' || core === 'صلي' || core.startsWith('صل')) {
            return {
                root: 'ص ل و / ص ل ي',
                origin: 'من معجم العين للخليل بن أحمد الفراهيدي: الصاد واللام وحرف العلة أصل يدل على الدعاء والاتصال واللزوم، ومنه الصَّلَاة.',
                table: [
                    { type: 'الفعل الماضي', form: 'صَلَّى', pattern: /^(و|ف|ل)?صل(ي|ا|و)(ت|تم|نا|وا)?$/ },
                    { type: 'الفعل المضارع', form: 'يُصَلِّي / تُصَلِّي', pattern: /^(و|ف|ل|س)?(ي|ت|ن|ا)صل(ي|و|ون|ين|وا)$/ },
                    { type: 'فعل الأمر', form: 'صَلِّ / صَلُّوا', pattern: /^(و|ف)?صل(وا)?$/ },
                    { type: 'اسم الفاعل', form: 'مُصَلٍّ / الْمُصَلِّينَ', pattern: /^(ال|و|ف|ب|ل)?مصل(ي|ون|ين)?$/ },
                    { type: 'اسم المفعول', form: 'مُصَلًّى (عليه)', pattern: /^(ال)?مصلي عليه$/ },
                    { type: 'اسم المكان', form: 'مُصَلًّى', pattern: /^(ال|و|ف|ب|ل|من|الي)?مصلي$/ },
                    { type: 'المصدر', form: 'صَلَاة / الصَّلَاة / صَلَوَات', pattern: /^(ال|و|ف|ب|ك|ل)?صل(اه|ات|وه|وت|وات)(ه|هم|كم|نا|ك)?$/ }
                ]
            };
        }

        let letters = core.split('');
        if (letters.length > 3) {
            letters = letters.filter((c, idx) => !(idx > 0 && idx < letters.length - 1 && 'اوي'.includes(c)));
        }
        if (letters.length > 3 && letters[0] === 'م') letters.shift();
        if (letters.length > 3 && letters[0] === 'ت') letters.shift();
        const r1 = letters[0] || 'ف';
        const r2 = letters[1] || 'ع';
        const r3 = letters[2] || 'ل';
        const rootStr = `${r1} ${r2} ${r3}`;

        return {
            root: rootStr,
            origin: `تحليل الجذر (${rootStr}) وفق منهج كتاب العين للفراهيدي (مخارج الحروف والتقليبات الصوتية للأصل الثلاثي).`,
            table: [
                { type: 'الفعل الماضي', form: `${r1}َ${r2}َ${r3}َ`, pattern: new RegExp(`^(و|ف|ل|قد)?${r1}${r2}${r3}(ت|تا|تم|تن|نا|وا)?$`) },
                { type: 'الفعل المضارع', form: `يَ${r1}ْ${r2}ُ${r3}ُ / تَ${r1}ْ${r2}ُ${r3}ُ`, pattern: new RegExp(`^(و|ف|ل|س)?(ي|ت|ن|ا)${r1}${r2}${r3}(ون|ين|ان|وا|ن)?$`) },
                { type: 'فعل الأمر', form: `ا${r1}ْ${r2}ُ${r3}ْ`, pattern: new RegExp(`^(و|ف)?ا?${r1}${r2}${r3}(ي|ا|وا|ن)?$`) },
                { type: 'اسم الفاعل', form: `${r1}َا${r2}ِ${r3} / مُ${r1}َ${r2}ِّ${r3}`, pattern: new RegExp(`^(ال|و|ف|ب|ك|ل)?(${r1}ا${r2}${r3}|م${r1}${r2}${r3})(ه|ون|ين|ات|ان)?$`) },
                { type: 'اسم المفعول', form: `مَ${r1}ْ${r2}ُو${r3}`, pattern: new RegExp(`^(ال|و|ف|ب|ك|ل)?م${r1}${r2}و${r3}(ه|ون|ين|ات|ان)?$`) },
                { type: 'اسم المكان', form: `مَ${r1}ْ${r2}َ${r3}`, pattern: new RegExp(`^(ال|و|ف|ب|ك|ل)?م${r1}${r2}${r3}(ه|ات)?$`) },
                { type: 'المصدر', form: `${core} / ال${core}`, pattern: new RegExp(`^(ال|و|ف|ب|ك|ل)?${r1}ا?${r2}[اوي]?${r3}(ه|ات|ون|ين|ان)?$`) }
            ]
        };
    }

    function highlightFlexible(text, patterns) {
        const words = text.split(/(\s+)/);
        return words.map(token => {
            if (!token.trim()) return token;
            const normToken = normalizeAr(token).replace(/[^ا-ي]/g, '');
            if (!normToken) return token;
            const matched = patterns.some(rx => rx.test(normToken));
            return matched ? `<span class="hl">${token}</span>` : token;
        }).join('');
    }

    function analyzeIrab(verseText, matchedWord, derivType) {
        const w = matchedWord || '';
        const norm = normalizeAr(w).replace(/[^ا-ي]/g, '');
        let role = 'اسم معرب حسب موقعه في السياق القرآني';
        if (derivType.includes('الماضي')) role = 'فعل ماضٍ مبني (يدل على تحقق الحدث في الزمن الماضي أو ثبوته)';
        else if (derivType.includes('المضارع')) role = 'فعل مضارع معرب (يدل على التجدد والاستمرار في الحاضر والمستقبل)';
        else if (derivType.includes('الأمر')) role = 'فعل أمر مبني (يفيد الطلب والتكليف الشرعي المباشر)';
        else if (derivType.includes('الفاعل')) role = 'اسم فاعل مشتق (يدل على من قام بالفعل واتصف به)';
        else if (derivType.includes('المفعول')) role = 'اسم مفعول مشتق (يدل على من وقع عليه الفعل)';
        else if (derivType.includes('المكان')) role = 'اسم مكان مشتق على وزن (مَفْعَل / مُفَعَّل) يدل على موضع الفعل';
        else {
            if (/[\u0650\u064D]$/.test(w) || /^(ب|ل|ك|في|من|الي|علي|عن)/.test(norm)) {
                role = 'اسم مجرور وعلامة جره الكسرة الظاهرة (مسبوق بحرف جر أو مضاف إليه)';
            } else if (/[\u064E\u064B]$/.test(w)) {
                role = 'اسم منصوب وعلامة نصبه الفتحة الظاهرة (مفعول به أو اسم إنّ أو حال)';
            } else if (/[\u064F\u064C]$/.test(w)) {
                role = 'اسم مرفوع وعلامة رفعه الضمة الظاهرة (مبتدأ أو خبر أو فاعل)';
            }
        }
        return `<strong>الإعراب والتحليل النحوي (وفق الكتاب لسيبويه):</strong> اللفظ (<b>${w}</b>) ورد بصيغة <b>${derivType}</b> — ${role}.`;
    }

    async function loadQuran() {
        if (quranCache) return quranCache;
        const res = await fetch('https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran.json');
        const data = await res.json();
        const verses = [];
        data.forEach(surah => {
            surah.verses.forEach(v => {
                verses.push({
                    surahNum: surah.id,
                    surahName: surah.name,
                    ayahNum: v.id,
                    text: toModernSpelling(v.text)
                });
            });
        });
        quranCache = verses;
        return verses;
    }

    function classifyBibleBook(bookId, bookName) {
        const torah = [1, 2, 3, 4, 5];
        const zabur = [19];
        if (torah.includes(bookId)) return `التوراة — ${bookName}`;
        if (zabur.includes(bookId)) return `الزبور — ${bookName}`;
        if (bookId >= 40) return `الإنجيل — ${bookName}`;
        return `أسفار الأنبياء (العهد القديم) — ${bookName}`;
    }

    const BIBLE_BOOKS_AR = {
        1:'التكوين',2:'الخروج',3:'اللاويين',4:'العدد',5:'التثنية',6:'يشوع',7:'القضاة',8:'راعوث',9:'صموئيل الأول',10:'صموئيل الثاني',
        11:'الملوك الأول',12:'الملوك الثاني',13:'أخبار الأيام الأول',14:'أخبار الأيام الثاني',15:'عزرا',16:'نحميا',17:'أستير',18:'أيوب',
        19:'المزامير',20:'الأمثال',21:'الجامعة',22:'نشيد الأنشاد',23:'إشعياء',24:'إرميا',25:'مراثي إرميا',26:'حزقيال',27:'دانيال',
        28:'هوشع',29:'يوئيل',30:'عاموس',31:'عوبديا',32:'يونان',33:'ميخا',34:'ناحوم',35:'حبقوق',36:'صفنيا',37:'حجي',38:'زكريا',39:'ملاخي',
        40:'إنجيل متى',41:'إنجيل مرقس',42:'إنجيل لوقا',43:'إنجيل يوحنا',44:'أعمال الرسل',45:'رسالة رومية',46:'كورنثوس الأولى',47:'كورنثوس الثانية',
        48:'غلاطية',49:'أفسس',50:'فيلبي',51:'كولوسي',52:'تسالونيكي الأولى',53:'تسالونيكي الثانية',54:'تيموثاوس الأولى',55:'تيموثاوس الثانية',
        56:'تيطس',57:'فليمون',58:'العبرانيين',59:'يعقوب',60:'بطرس الأولى',61:'بطرس الثانية',62:'يوحنا الأولى',63:'يوحنا الثانية',64:'يوحنا الثالثة',65:'يهوذا',66:'الرؤيا'
    };

    async function searchBible(word) {
        const isAr = /[\u0600-\u06FF]/.test(word);
        const trans = isAr ? 'SVD' : 'KJV';
        const cleanQuery = isAr ? normalizeAr(word).replace(/^ال/, '') : word;
        try {
            const res = await fetch(`https://bolls.life/v2/find/${trans}?search=${encodeURIComponent(cleanQuery)}&match_case=false&match_whole=false`);
            const data = await res.json();
            const items = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            return items.slice(0, 20).map(item => {
                const bName = isAr ? (BIBLE_BOOKS_AR[item.book] || `سفر ${item.book}`) : (item.book_name || `Book ${item.book}`);
                const sourceLabel = isAr ? classifyBibleBook(item.book, bName) : (item.book >= 40 ? `New Testament — ${bName}` : `Old Testament — ${bName}`);
                const cleanText = (item.text || '').replace(/<[^>]+>/g, '');
                return { sourceLabel, chapter: item.chapter, verse: item.verse, text: cleanText };
            });
        } catch (e) {
            return [];
        }
    }

    async function searchTalmudAndHadith(word) {
        const isAr = /[\u0600-\u06FF]/.test(word);
        let enWord = word;
        if (isAr) {
            const dict = { 'صلاة':'prayer', 'الصلاة':'prayer', 'زكاة':'charity', 'الزكاة':'charity', 'صوم':'fasting', 'الصوم':'fasting', 'حج':'pilgrimage', 'الحج':'pilgrimage', 'دين':'religion', 'الدين':'religion', 'كتاب':'book', 'الكتاب':'book', 'نبي':'prophet', 'النبي':'prophet', 'سماء':'heaven', 'ارض':'earth', 'ماء':'water', 'نور':'light' };
            const norm = normalizeAr(word);
            if (dict[norm]) enWord = dict[norm];
            else {
                try {
                    const tr = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ar|en`);
                    const trData = await tr.json();
                    if (trData && trData.responseData && trData.responseData.translatedText) {
                        enWord = trData.responseData.translatedText.split(' ')[0].replace(/[^a-zA-Z]/g, '');
                    }
                } catch (e) {}
            }
        }

        let talmudResults = [];
        try {
            const sRes = await fetch('https://www.sefaria.org/api/search-wrapper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: enWord, type: 'text', field: 'naive_lemmatizer', size: 8, filters: ['Mishnah', 'Talmud'] })
            });
            const sData = await sRes.json();
            if (sData && sData.hits && sData.hits.hits) {
                talmudResults = sData.hits.hits.map(h => ({
                    ref: h._source.ref || 'Mishnah / Talmud',
                    text: (h.highlight && h.highlight.naive_lemmatizer ? h.highlight.naive_lemmatizer.join(' ... ') : (h._source.naive_lemmatizer || '')).replace(/<[^>]+>/g, '')
                }));
            }
        } catch (e) {}

        let hadithResults = [];
        try {
            const hRes = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${isAr ? 'ara-bukhari' : 'eng-bukhari'}.min.json`);
            const hData = await hRes.json();
            if (hData && hData.hadiths) {
                const normQ = normalizeAr(word).replace(/^ال/, '');
                hadithResults = hData.hadiths.filter(h => normalizeAr(h.text).includes(normQ)).slice(0, 10);
            }
        } catch (e) {}

        return { hadithResults, talmudResults, enWord };
    }

    function showLevel(lvl) {
        activeLevel = lvl;
        levelBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.lvl) === lvl));
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) card.style.display = (i === lvl) ? 'block' : 'none';
        }
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showLevel(parseInt(btn.dataset.lvl));
        });
    });

    async function runSearch() {
        const word = inputEl.value.trim();
        if (!word) return;

        window.speechSynthesis && window.speechSynthesis.cancel();
        if (listenBtn) {
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
        }

        loader.style.display = 'block';
        resultsWrapper.style.display = 'none';

        const isAr = /[\u0600-\u06FF]/.test(word);
        const derivInfo = isAr ? extractRootAndDerivatives(word) : null;

        // المستوى الأول
        if (isAr && derivInfo) {
            const rows = derivInfo.table.map(r => `<tr><td><strong>${r.type}</strong></td><td>${r.form}</td></tr>`).join('');
            document.getElementById('content-1').innerHTML = `
                <div class="verse-item">
                    <p><strong>الجذر اللغوي:</strong> (${derivInfo.root})</p>
                    <p>${derivInfo.origin}</p>
                </div>
                <table class="deriv-table">
                    <thead><tr><th>نوع المشتق</th><th>الصيغة الصرفية</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else {
            document.getElementById('content-1').innerHTML = `<div class="verse-item"><p><strong>Searched Term:</strong> ${word}</p><p>Morphological & lexical root analysis.</p></div>`;
        }

        // المستوى الثاني والرابع والخامس
        try {
            const verses = await loadQuran();
            if (isAr && derivInfo) {
                let html2 = '';
                let totalMatches = 0;

                derivInfo.table.forEach(deriv => {
                    const matchedVerses = [];
                    verses.forEach(v => {
                        const tokens = v.text.split(/\s+/);
                        const foundToken = tokens.find(t => deriv.pattern.test(normalizeAr(t).replace(/[^ا-ي]/g, '')));
                        if (foundToken) {
                            matchedVerses.push({ ...v, matchedWord: foundToken });
                        }
                    });

                    if (matchedVerses.length > 0) {
                        totalMatches += matchedVerses.length;
                        html2 += `<div class="deriv-group-header"><span>${deriv.type} (${deriv.form})</span><span class="deriv-count-badge">${matchedVerses.length} آية</span></div>`;
                        matchedVerses.forEach(mv => {
                            const isMakki = MAKKI_SURAHS.has(mv.surahNum);
                            const badge = isMakki ? '<span class="surah-type-badge surah-makki">مكية</span>' : '<span class="surah-type-badge surah-madani">مدنية</span>';
                            const hlText = highlightFlexible(mv.text, [deriv.pattern]);
                            const irabText = analyzeIrab(mv.text, mv.matchedWord, deriv.type);
                            html2 += `
                                <div class="verse-item">
                                    <div class="verse-meta"><span>[سورة ${mv.surahName} : ${mv.ayahNum}]</span> ${badge}</div>
                                    <div class="verse-text">${hlText}</div>
                                    <div class="irab-box">${irabText}</div>
                                </div>
                            `;
                        });
                    }
                });

                document.getElementById('content-2').innerHTML = html2 || '<p>لم يتم العثور على مشتقات مطابقة في النص القرآني.</p>';

                // المستوى الخامس: الآيات المحكمات (المدنية والتشريعية)
                const allPatterns = derivInfo.table.map(d => d.pattern);
                const muhkamVerses = verses.filter(v => !MAKKI_SURAHS.has(v.surahNum) && v.text.split(/\s+/).some(t => allPatterns.some(rx => rx.test(normalizeAr(t).replace(/[^ا-ي]/g, '')))));
                if (muhkamVerses.length > 0) {
                    document.getElementById('content-5').innerHTML = muhkamVerses.slice(0, 25).map(mv => {
                        const foundW = mv.text.split(/\s+/).find(t => allPatterns.some(rx => rx.test(normalizeAr(t).replace(/[^ا-ي]/g, ''))));
                        const hlText = highlightFlexible(mv.text, allPatterns);
                        const irabText = analyzeIrab(mv.text, foundW, 'مشتق قرآني');
                        return `
                            <div class="verse-item">
                                <div class="verse-meta"><span>[سورة ${mv.surahName} : ${mv.ayahNum}]</span> <span class="surah-type-badge surah-madani">مدنية</span></div>
                                <div class="verse-text">${hlText}</div>
                                <div class="irab-box">${irabText}</div>
                            </div>
                        `;
                    }).join('');
                } else {
                    document.getElementById('content-5').innerHTML = '<p>لم ترد آيات مدنية تشريعية خاصة بهذا الجذر.</p>';
                }
            } else {
                const qLow = word.toLowerCase();
                const matched = verses.filter(v => v.text.toLowerCase().includes(qLow)).slice(0, 30);
                document.getElementById('content-2').innerHTML = matched.map(mv => `<div class="verse-item"><div class="verse-meta">[سورة ${mv.surahName} : ${mv.ayahNum}]</div><div class="verse-text">${mv.text}</div></div>`).join('') || '<p>No matches found.</p>';
                document.getElementById('content-5').innerHTML = document.getElementById('content-2').innerHTML;
            }
        } catch (e) {
            document.getElementById('content-2').innerHTML = '<p>تعذر تحميل بيانات القرآن الكريم حالياً.</p>';
        }

        // المستوى الثالث: الكتب السابقة (التوراة، الزبور، الأنبياء، الإنجيل)
        const bibleResults = await searchBible(word);
        if (bibleResults.length > 0) {
            const normQ = normalizeAr(word).replace(/^ال/, '');
            const rxBible = isAr ? new RegExp(normQ, 'i') : new RegExp(word, 'i');
            document.getElementById('content-3').innerHTML = bibleResults.map(b => `
                <div class="verse-item">
                    <div class="source-tag">${b.sourceLabel} (${b.chapter}:${b.verse})</div>
                    <div class="verse-text">${highlightFlexible(b.text, [rxBible])}</div>
                </div>
            `).join('');
        } else {
            document.getElementById('content-3').innerHTML = '<p>لم يتم العثور على نصوص مطابقة في الأسفار السابقة.</p>';
        }

        // المستوى الرابع: المرويات الحديثية + التلمود (المشنا)
        const { hadithResults, talmudResults } = await searchTalmudAndHadith(word);
        let html4 = '<div class="section-sub-title">أولاً: المرويات الحديثية</div>';
        if (hadithResults.length > 0) {
            const normQ = normalizeAr(word).replace(/^ال/, '');
            const rxH = new RegExp(normQ, 'i');
            html4 += hadithResults.map(h => `
                <div class="verse-item">
                    <div class="source-tag">صحيح البخاري — حديث رقم ${h.hadithnumber || ''}</div>
                    <div class="verse-text">${highlightFlexible(h.text, [rxH])}</div>
                </div>
            `).join('');
        } else {
            html4 += '<p>لم يتم العثور على مرويات مطابقة.</p>';
        }

        html4 += '<div class="section-sub-title">ثانياً: التلمود (المشنا)</div>';
        if (talmudResults.length > 0) {
            html4 += talmudResults.map(t => `
                <div class="verse-item" dir="ltr" style="text-align:left;">
                    <div class="source-tag">${t.ref}</div>
                    <div class="verse-text" style="font-size:1rem;">${t.text}</div>
                </div>
            `).join('');
        } else {
            html4 += '<p>لم يتم العثور على نصوص مطابقة في التلمود (المشنا).</p>';
        }
        document.getElementById('content-4').innerHTML = html4;

        // المستوى السادس: الخلاصة المنهجية
        document.getElementById('content-6').innerHTML = `
            <div class="verse-item">
                <p><strong>خلاصة التدبر المنهجي للفظ (${word}):</strong></p>
                <p>تم استقراء الجذر ومشتقاته الصرفية من المعجم (المستوى 1)، وتتبع مواضعه وإعرابه في القرآن الكريم مرتباً حسب صيغ الاشتقاق (المستوى 2 و 5)، ومقارنته بما ورد في التوراة والزبور والأناجيل (المستوى 3)، ثم عرض المرويات ونصوص التلمود (المستوى 4) لتمييز المحكم من الموروث.</p>
            </div>
        `;

        loader.style.display = 'none';
        resultsWrapper.style.display = 'block';
        showLevel(activeLevel);
    }

    if (submitBtn) submitBtn.addEventListener('click', runSearch);
    if (inputEl) inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') runSearch(); });

    if (clearBtn) clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        resultsWrapper.style.display = 'none';
        loader.style.display = 'none';
        window.speechSynthesis && window.speechSynthesis.cancel();
        if (listenBtn) {
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
        }
    });

    if (listenBtn) listenBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) return;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
            return;
        }
        let textToRead = '';
        if (articlesBox && articlesBox.style.display === 'block' && articleViewer.style.display === 'block') {
            textToRead = articleViewer.innerText;
        } else {
            const activeContent = document.getElementById(`content-${activeLevel}`);
            if (activeContent) textToRead = activeContent.innerText;
        }
        if (!textToRead.trim()) return;

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = /[\u0600-\u06FF]/.test(textToRead) ? 'ar-SA' : 'en-US';
        utterance.onend = () => {
            listenBtn.classList.remove('speaking');
            listenBtn.textContent = 'استماع';
        };
        listenBtn.classList.add('speaking');
        listenBtn.textContent = 'إيقاف';
        window.speechSynthesis.speak(utterance);
    });
});
