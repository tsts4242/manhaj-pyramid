let currentStage = 1;
let lastQuery = '';
let lastAnalysisData = null;

// --- 1. Pyramid & Articles Toggle Logic ---
const btnPyramid = document.getElementById('btn-pyramid');
const pyramidBox = document.getElementById('pyramid-box');
const btnClosePyramid = document.getElementById('btn-close-pyramid');

const btnArticles = document.getElementById('btn-articles');
const articlesBox = document.getElementById('articles-box');
const btnCloseArticles = document.getElementById('btn-close-articles');

let currentArticlePage = 1;

if (btnPyramid && pyramidBox) {
    btnPyramid.addEventListener('click', () => {
        const isHidden = pyramidBox.style.display === 'none' || pyramidBox.style.display === '';
        pyramidBox.style.display = isHidden ? 'block' : 'none';
        if (isHidden && articlesBox) articlesBox.style.display = 'none';
    });
}
if (btnClosePyramid && pyramidBox) {
    btnClosePyramid.addEventListener('click', () => {
        pyramidBox.style.display = 'none';
    });
}

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
        <button type="button" class="page-nav-btn" ${currentArticlePage === 1 ? 'disabled' : ''} id="prev-art-page">◀ السابق (1-12)</button>
        <span class="page-indicator">صفحة ${currentArticlePage} من 2</span>
        <button type="button" class="page-nav-btn" ${currentArticlePage === 2 ? 'disabled' : ''} id="next-art-page">التالي (13-24) ▶</button>
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
        const isHidden = articlesBox.style.display === 'none' || articlesBox.style.display === '';
        articlesBox.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            if (pyramidBox) pyramidBox.style.display = 'none';
            renderArticlesGrid();
        }
    });
}
if (btnCloseArticles && articlesBox) {
    btnCloseArticles.addEventListener('click', () => {
        articlesBox.style.display = 'none';
    });
}

// --- 2. Stage Buttons ---
document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.stage-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStage = parseInt(btn.getAttribute('data-stage'), 10);
        if (lastAnalysisData) {
            renderStage(currentStage, lastAnalysisData);
        }
    });
});

// --- 3. Clear & Listen Controls ---
const searchInput = document.getElementById('search-input');
const btnSubmit = document.getElementById('btn-submit');
const btnClear = document.getElementById('btn-clear');
const btnListen = document.getElementById('btn-listen');
const resultsContainer = document.getElementById('results-container');
const loader = document.getElementById('loader');

if (btnClear) {
    btnClear.addEventListener('click', () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (btnListen) {
            btnListen.classList.remove('speaking');
            btnListen.textContent = 'استمع';
        }
        searchInput.value = '';
        resultsContainer.innerHTML = '';
        lastQuery = '';
        lastAnalysisData = null;
        searchInput.focus();
    });
}

if (btnListen) {
    btnListen.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
            alert('عذراً، متصفحك لا يدعم ميزة القراءة الصوتية.');
            return;
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btnListen.classList.remove('speaking');
            btnListen.textContent = 'استمع';
            return;
        }
        const textToRead = resultsContainer.innerText.trim();
        if (!textToRead) {
            alert('يرجى البحث عن كلمة أولاً لعرض النتائج ثم الاستماع إليها.');
            return;
        }
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        utterance.onstart = () => {
            btnListen.classList.add('speaking');
            btnListen.textContent = 'إيقاف';
        };
        utterance.onend = () => {
            btnListen.classList.remove('speaking');
            btnListen.textContent = 'استمع';
        };
        utterance.onerror = () => {
            btnListen.classList.remove('speaking');
            btnListen.textContent = 'استمع';
        };
        window.speechSynthesis.speak(utterance);
    });
}

// --- 4. Arabic Text Normalization & Root Extraction ---
function stripTashkeel(text) {
    if (!text) return '';
    return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

function normalizeArabic(text) {
    return stripTashkeel(text)
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'ء')
        .replace(/ئ/g, 'ء')
        .replace(/ة/g, 'ه');
}

function extractRoot(word) {
    let clean = stripTashkeel(word.trim()).split(/\s+/)[0] || '';
    clean = clean.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل|س)/, '');
    clean = clean.replace(/(ون|ين|ات|ان|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');

    const rootMap = {
        'صلاح': 'ص ل ح', 'صلح': 'ص ل ح', 'صالح': 'ص ل ح', 'مصلح': 'ص ل ح', 'اصلاح': 'ص ل ح', 'صالحات': 'ص ل ح',
        'فوز': 'ف و ز', 'فاز': 'ف و ز', 'فائز': 'ف و ز', 'فائزون': 'ف و ز', 'مفاز': 'ف و ز', 'مفازا': 'ف و ز',
        'رحمة': 'ر ح م', 'رحم': 'ر ح م', 'رحيم': 'ر ح م', 'رحمن': 'ر ح م', 'ارحم': 'ر ح م',
        'علم': 'ع ل م', 'عالم': 'ع ل م', 'عليم': 'ع ل م', 'يعلم': 'ع ل م', 'تعلم': 'ع ل م', 'معلوم': 'ع ل م',
        'حق': 'ح ق ق', 'حقيقة': 'ح ق ق', 'احق': 'ح ق ق', 'حاقه': 'ح ق ق',
        'صدق': 'ص د ق', 'صادق': 'ص د ق', 'صديق': 'ص د ق', 'يصدق': 'ص د ق', 'صدقه': 'ص د ق',
        'عدل': 'ع د ل', 'عادل': 'ع د ل', 'يعدل': 'ع د ل',
        'صبر': 'ص ب ر', 'صابر': 'ص ب ر', 'اصبر': 'ص ب ر', 'صابرين': 'ص ب ر',
        'شكر': 'ش ك ر', 'شاكر': 'ش ك ر', 'شكور': 'ش ك ر', 'يشكر': 'ش ك ر',
        'ذكر': 'ذ ك ر', 'ذاكر': 'ذ ك ر', 'تذكره': 'ذ ك ر', 'يذكر': 'ذ ك ر',
        'تقوى': 'و ق ي', 'اتقوا': 'و ق ي', 'متقين': 'و ق ي', 'يتقي': 'و ق ي',
        'هدى': 'ه د ي', 'هدي': 'ه د ي', 'هادي': 'ه د ي', 'مهتدي': 'ه د ي', 'اهتدوا': 'ه د ي',
        'ايمان': 'أ م ن', 'امنوا': 'أ م ن', 'مؤمن': 'أ م ن', 'مؤمنين': 'أ م ن', 'امان': 'أ م ن',
        'قلب': 'ق ل ب', 'قلوب': 'ق ل ب', 'ينقلب': 'ق ل ب',
        'نفس': 'ن ف س', 'انفس': 'ن ف س', 'نفوس': 'ن ف س',
        'عمل': 'ع م ل', 'عامل': 'ع م ل', 'اعمال': 'ع م ل', 'يعمل': 'ع م ل',
        'خلق': 'خ ل ق', 'خالق': 'خ ل ق', 'مخلوق': 'خ ل ق',
        'رزق': 'ر ز ق', 'رازق': 'ر ز ق', 'رزاق': 'ر ز ق',
        'غفر': 'غ ف ر', 'غفور': 'غ ف ر', 'مغفره': 'غ ف ر', 'استغفر': 'غ ف ر',
        'توبه': 'ت و ب', 'تاب': 'ت و ب', 'تواب': 'ت و ب', 'يتوب': 'ت و ب',
        'نور': 'ن و ر', 'منير': 'ن و ر', 'انوار': 'ن و ر',
        'ظلم': 'ظ ل م', 'ظالم': 'ظ ل م', 'ظلمات': 'ظ ل م',
        'فلاح': 'ف ل ح', 'مفلحون': 'ف ل ح', 'افلح': 'ف ل ح',
        'نصر': 'ن ص ر', 'ناصر': 'ن ص ر', 'نصير': 'ن ص ر', 'ينصر': 'ن ص ر',
        'فتح': 'ف ت ح', 'فاتح': 'ف ت ح', 'فتاح': 'ف ت ح', 'مبين': 'ب ي ن'
    };

    const norm = normalizeArabic(clean);
    for (const [k, v] of Object.entries(rootMap)) {
        if (normalizeArabic(k) === norm) return v;
    }

    let stripped = clean.replace(/^[يتنأمس]/, '');
    if (stripped.length >= 3) {
        const letters = stripped.replace(/[اوي]/g, (m, offset) => (offset === 0 ? m : '')).slice(0, 3);
        if (letters.length === 3) return letters.split('').join(' ');
    }
    return clean.slice(0, 3).split('').join(' ') || clean;
}

function generateDerivations(word, rootStr) {
    const letters = rootStr.split(' ').filter(Boolean);
    const c1 = letters[0] || 'ف';
    const c2 = letters[1] || 'ع';
    const c3 = letters[2] || 'ل';

    return [
        { form: 'الفعل الماضي', example: `${c1}${c2}${c3}`, meaning: 'دلالة الثبوت والتحقق في الزمن الماضي' },
        { form: 'الفعل المضارع', example: `ي${c1}${c2}${c3}`, meaning: 'دلالة التجدد والاستمرار والحال' },
        { form: 'اسم الفاعل', example: `${c1}ا${c2}${c3}`, meaning: 'من قام بالحدث واتصف به' },
        { form: 'اسم المفعول', example: `م${c1}${c2}و${c3}`, meaning: 'ما وقع عليه أثر الفعل' },
        { form: 'المصدر / الاسم', example: word, meaning: 'المعنى الكلي المجرد للدلالة' }
    ];
}

// --- 5. Quran & External Comparative Data Fetching ---
async function fetchQuranVerses(query) {
    const cleanQ = stripTashkeel(query.trim());
    const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanQ)}/all/quran-simple-clean`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('تعذر الاتصال بقاعدة بيانات القرآن الكريم');
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data.matches)) return [];
    return json.data.matches.map(m => ({
        surahName: m.surah.name,
        surahNumber: m.surah.number,
        revelationType: m.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
        ayahNumber: m.numberInSurah,
        text: m.text
    }));
}

function buildComparativeReferences(word, rootStr) {
    return {
        previousScriptures: [
            {
                source: 'التوراة (الأسفار الخمسة — العهد القديم)',
                note: `ترد المفاهيم المقابلة لمادة (${rootStr}) في سياقات الوصايا التشريعية، وإصلاح الفرد والجماعة، والوفاء بالعهد الإلهي، مع تركيزها على الجزاء الدنيوي المرتبط بالطاعة.`
            },
            {
                source: 'الإنجيل (العهد الجديد)',
                note: `تتجه الدلالات المقابلة للفظ «${word}» نحو التزكية القلبية، والنقاء الباطني، والمحبة والرحمة، بوصفها ثمرة الإيمان الصادق.`
            },
            {
                source: 'المقارنة المنهجية بالقرآن الكريم',
                note: `يجمع القرآن الكريم بين التشريع العملي والتزكية القلبية في ميزان واحد؛ فيربط «${word}» بالإيمان والعمل الصالح والفوز الأخروي الدائم، مبيّناً ما حُرّف أو نُسي من الكتب السابقة.`
            }
        ],
        narrationsCheck: [
            {
                category: 'ما وافق المحكم القرآني',
                status: 'مقبول المعنى',
                detail: `كل أثر أو حكمة مأثورة تحث على تحقيق «${word}» بما يوافق مقاصد القرآن الكريم في التوحيد والعدل والإحسان فهي صحيحة الاعتبار.`
            },
            {
                category: 'الروايات المتعارضة أو الإسرائيليات',
                status: 'يُعرض على القرآن',
                detail: `وفق منهج الصلاح والفوز، القرآن الكريم هو المهيمن والميزان؛ فما خالف صريح النص القرآني أو عارض سنن الله الثابتة في الهداية والجزاء يُردّ ولا يُبنى عليه حكم.`
            }
        ]
    };
}

// --- 6. Search Execution ---
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('يرجى إدخال الكلمة أو المصطلح القرآني المراد تدريسه وبحثه.');
        return;
    }

    lastQuery = query;
    resultsContainer.innerHTML = '';
    if (loader) loader.style.display = 'flex';

    try {
        const verses = await fetchQuranVerses(query);
        const rootStr = extractRoot(query);
        const derivations = generateDerivations(query, rootStr);
        const comparative = buildComparativeReferences(query, rootStr);

        lastAnalysisData = {
            query,
            rootStr,
            derivations,
            verses,
            comparative
        };

        renderStage(currentStage, lastAnalysisData);
    } catch (err) {
        resultsContainer.innerHTML = `
            <div class="level-card">
                <div class="level-header">تنبيه</div>
                <div class="level-body">حدث خطأ أثناء جلب الآيات القرآنية. يرجى التأكد من الاتصال بالإنترنت والمحاولة مرة أخرى.</div>
            </div>
        `;
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

if (btnSubmit) btnSubmit.addEventListener('click', performSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

// --- 7. Highlight Helper ---
function highlightWord(text, target) {
    const cleanTarget = stripTashkeel(target.trim());
    if (!cleanTarget) return text;
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<span class="hl-term">$1</span>');
}

// --- 8. Render Stages (1 to 6) ---
function renderStage(stage, data) {
    const { query, rootStr, derivations, verses, comparative } = data;
    const makkiVerses = verses.filter(v => v.revelationType === 'مكية');
    const madaniVerses = verses.filter(v => v.revelationType === 'مدنية');

    let html = '';

    if (stage === 1) {
        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 1: الجذر اللغوي والأصل الاشتقاقي</div>
                <div class="level-body">
                    <p><strong>الكلمة المبحوثة:</strong> ${query}</p>
                    <p><strong>الجذر اللغوي المستخلص:</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.2rem;">(${rootStr})</span></p>
                    <div class="irab-box">
                        <strong>الأساس الدلالي للجذر:</strong> يمثل الجذر الثلاثي المرجع الصوتي والمعنوي الجامع لكل تصريفات الكلمة في اللسان العربي المبين، ومنه تتشعب المعاني السياقية في التنزيل الحكيم.
                    </div>
                </div>
            </div>
        `;
    } else if (stage === 2) {
        const rows = derivations.map(d => `
            <tr>
                <td><strong>${d.form}</strong></td>
                <td>${d.example}</td>
                <td>${d.meaning}</td>
            </tr>
        `).join('');
        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 2: التصريفات والاشتقاقات الصرفية</div>
                <div class="level-body">
                    <p>تتنوع صيغ مادة <strong>(${rootStr})</strong> لتؤدي وظائف دلالية دقيقة بين الحدث المتجدد والصفة الثابتة:</p>
                    <table class="deriv-table">
                        <thead>
                            <tr>
                                <th>الصيغة الصرفية</th>
                                <th>الوزن / المثال</th>
                                <th>الدلالة الوظيفية</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (stage === 3) {
        const displayed = verses.slice(0, 25);
        const versesHtml = displayed.length > 0
            ? displayed.map(v => `
                <div class="verse-box">
                    <div class="verse-text">﴿ ${highlightWord(v.text, query)} ﴾</div>
                    <div class="verse-meta">
                        <span>${v.surahName} — آية ${v.ayahNumber}</span>
                        <span class="surah-type-badge ${v.revelationType === 'مكية' ? 'surah-makki' : 'surah-madani'}">${v.revelationType}</span>
                    </div>
                </div>
            `).join('')
            : `<p>لم يتم العثور على مطابقات حرفية للفظ «${query}» في البحث المباشر. جرّب البحث بصيغة مفردة أو فعل مجرد.</p>`;

        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 3: الشواهد القرآنية الكاملة (${verses.length} موضعاً)</div>
                <div class="level-body">
                    ${versesHtml}
                    ${verses.length > 25 ? `<p style="color:#64748b;font-size:0.9rem;text-align:center;">تم عرض أول 25 موضعاً من أصل ${verses.length} آية مرتبة حسب المصحف.</p>` : ''}
                </div>
            </div>
        `;
    } else if (stage === 4) {
        const makkiSample = makkiVerses.slice(0, 8).map(v => `
            <div class="verse-box">
                <div class="verse-text">﴿ ${highlightWord(v.text, query)} ﴾</div>
                <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
            </div>
        `).join('') || '<p>لا توجد شواهد مكية مطابقة لهذا الرسم.</p>';

        const madaniSample = madaniVerses.slice(0, 8).map(v => `
            <div class="verse-box">
                <div class="verse-text">﴿ ${highlightWord(v.text, query)} ﴾</div>
                <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
            </div>
        `).join('') || '<p>لا توجد شواهد مدنية مطابقة لهذا الرسم.</p>';

        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 4: التدرج السياقي (المكي والمدني)</div>
                <div class="level-body">
                    <div class="deriv-group-title">أولاً: التنزيل المكي (${makkiVerses.length} آية) — بناء العقيدة والتصور</div>
                    ${makkiSample}
                    <div class="deriv-group-title">ثانياً: التنزيل المدني (${madaniVerses.length} آية) — التشريع والتطبيق العملي</div>
                    ${madaniSample}
                </div>
            </div>
        `;
    } else if (stage === 5) {
        const prevHtml = comparative.previousScriptures.map(item => `
            <div class="verse-box">
                <div style="font-weight:800;color:#1a2a4a;margin-bottom:4px;">${item.source}</div>
                <div style="font-size:0.95rem;">${item.note}</div>
            </div>
        `).join('');

        const narrHtml = comparative.narrationsCheck.map(n => `
            <div class="irab-box">
                <strong>${n.category} [${n.status}]:</strong> ${n.detail}
            </div>
        `).join('');

        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 5: العرض على الكتب السابقة والمرويات</div>
                <div class="level-body">
                    <div class="deriv-group-title">أولاً: المقارنة بالكتب السماوية السابقة (التوراة والإنجيل)</div>
                    ${prevHtml}
                    <div class="deriv-group-title">ثانياً: ميزان العرض على المرويات والأحاديث</div>
                    ${narrHtml}
                </div>
            </div>
        `;
    } else if (stage === 6) {
        html = `
            <div class="level-card">
                <div class="level-header">المرحلة 6: الخلاصة التدبرية والعملية (منهج الصلاح والفوز)</div>
                <div class="level-body">
                    <div class="stage6-directive">
                        إن التتبع المنهجي لمادة <strong>«${query}»</strong> (جذر: ${rootStr}) عبر مراحل الهرم البحثي الست يُظهر تكامل البناء القرآني؛ حيث ورد اللفظ في <strong>${verses.length}</strong> موضعاً (${makkiVerses.length} مكية و${madaniVerses.length} مدنية) ليُرسّخ معنى <strong>الصلاح</strong> في الفكر والسلوك، ويُثمر <strong>الفوز</strong> برضوان الله في الدنيا والآخرة.
                    </div>
                    <p><strong>التوجيه العملي للمتدبر:</strong></p>
                    <ul style="padding-right:20px;line-height:1.9;">
                        <li>استحضار المعنى الجذري للكلمة عند تلاوة كل آية وردت فيها.</li>
                        <li>التمييز بين السياق المكي المؤسس للإيمان والسياق المدني الموجه للعمل.</li>
                        <li>جعل القرآن الكريم المهيمن والحَكَم على كل فهم أو رواية.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    resultsContainer.innerHTML = html;
}
