document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('searchInput');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const listenBtn = document.getElementById('listenBtn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('resultsContainer');

    const togglePyramidBtn = document.getElementById('toggle-pyramid-btn');
    const pyramidContainer = document.getElementById('pyramid-container');
    const closePyramidBtn = document.getElementById('close-pyramid-btn');

    const toggleArticlesBtn = document.getElementById('toggle-articles-btn');
    const articlesContainer = document.getElementById('articles-container');
    const closeArticlesBtn = document.getElementById('close-articles-btn');

    if (closeArticlesBtn) {
        closeArticlesBtn.style.display = 'none';
    }

    let currentLevel = 'all';
    let currentData = null;
    let isSpeaking = false;
    let currentArticlePage = 1;

    if (togglePyramidBtn && pyramidContainer) {
        togglePyramidBtn.addEventListener('click', () => {
            const isHidden = pyramidContainer.style.display === 'none' || pyramidContainer.style.display === '';
            pyramidContainer.style.display = isHidden ? 'block' : 'none';
            if (isHidden && articlesContainer) {
                articlesContainer.style.display = 'none';
            }
        });
    }

    if (closePyramidBtn && pyramidContainer) {
        closePyramidBtn.addEventListener('click', () => {
            pyramidContainer.style.display = 'none';
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
            <button type="button" class="page-nav-btn" ${currentArticlePage === 1 ? 'disabled' : ''} id="prev-art-page">◀ السابق</button>
            <span class="down-scroll-hint" title="يظهر المقال بالأسفل">⬇</span>
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

    if (toggleArticlesBtn && articlesContainer) {
        toggleArticlesBtn.addEventListener('click', () => {
            const isHidden = articlesContainer.style.display === 'none' || articlesContainer.style.display === '';
            articlesContainer.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (pyramidContainer) pyramidContainer.style.display = 'none';
                renderArticlesGrid();
            }
        });
    }

    if (closeArticlesBtn && articlesContainer) {
        closeArticlesBtn.addEventListener('click', () => {
            articlesContainer.style.display = 'none';
        });
    }

    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            levelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLevel = btn.dataset.level;
            if (currentData) {
                renderResults(currentData);
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        stopSpeech();
        input.value = '';
        currentData = null;
        resultsContainer.innerHTML = '';
        loader.style.display = 'none';
        input.focus();
    });

    submitBtn.addEventListener('click', () => {
        const term = input.value.trim();
        if (term) executeSearch(term);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const term = input.value.trim();
            if (term) executeSearch(term);
        }
    });

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        listenBtn.classList.remove('speaking');
        listenBtn.textContent = 'استمع';
    }

    listenBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
            alert('عذراً، متصفحك لا يدعم ميزة القراءة الصوتية.');
            return;
        }
        if (isSpeaking) {
            stopSpeech();
            return;
        }
        const textToRead = resultsContainer.innerText.trim();
        if (!textToRead) {
            alert('يرجى إدخال كلمة والبحث أولاً للاستماع إلى النتائج.');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.95;
        utterance.onend = () => stopSpeech();
        utterance.onerror = () => stopSpeech();
        isSpeaking = true;
        listenBtn.classList.add('speaking');
        listenBtn.textContent = 'إيقاف';
        window.speechSynthesis.speak(utterance);
    });

    function stripTashkeel(str) {
        return str ? str.replace(/[\u064B-\u065F\u0670\u0640]/g, '') : '';
    }

    function normalizeAlef(str) {
        return stripTashkeel(str)
            .replace(/[إأآا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء');
    }

    function highlightMatch(text, terms) {
        if (!text || !terms || terms.length === 0) return text;
        const cleanTerms = [...new Set(terms.map(t => normalizeAlef(t)).filter(t => t.length >= 2))];
        if (cleanTerms.length === 0) return text;

        return text.split(/(\s+)/).map(token => {
            if (/^\s+$/.test(token)) return token;
            const normToken = normalizeAlef(token).replace(/[^\u0621-\u064A]/g, '');
            if (!normToken) return token;
            const isMatch = cleanTerms.some(term => normToken === term || normToken.includes(term));
            return isMatch ? `<span class="hl-term">${token}</span>` : token;
        }).join('');
    }

    async function executeSearch(rawTerm) {
        stopSpeech();
        resultsContainer.innerHTML = '';
        loader.style.display = 'flex';

        try {
            const cleanQuery = stripTashkeel(rawTerm).replace(/[^\u0621-\u064A\s]/g, '').trim();
            const rootLetters = extractArabicRoot(cleanQuery);
            const derivData = buildDerivations(cleanQuery, rootLetters);

            const verses = await fetchQuranicVerses(cleanQuery, derivData.searchTokens);

            currentData = {
                query: rawTerm,
                cleanQuery,
                root: rootLetters,
                derivations: derivData,
                verses
            };

            loader.style.display = 'none';
            renderResults(currentData);
        } catch (err) {
            loader.style.display = 'none';
            resultsContainer.innerHTML = `<div class="level-card"><div class="level-body" style="color:#b91c1c;font-weight:700;">حدث خطأ أثناء الاتصال بقاعدة البيانات القرآنية. يرجى المحاولة مرة أخرى.</div></div>`;
        }
    }

    function extractArabicRoot(word) {
        let w = normalizeAlef(word).split(/\s+/) || '';
        const knownRoots = {
            'صلاح': 'ص ل ح', 'صلح': 'ص ل ح', 'صالح': 'ص ل ح', 'مصلح': 'ص ل ح', 'اصلاح': 'ص ل ح', 'صالحات': 'ص ل ح', 'يصلح': 'ص ل ح',
            'فوز': 'ف و ز', 'فاز': 'ف و ز', 'فائز': 'ف و ز', 'فائزون': 'ف و ز', 'مفاز': 'ف و ز', 'مفازا': 'ف و ز',
            'رحمة': 'ر ح م', 'رحم': 'ر ح م', 'رحيم': 'ر ح م', 'رحمن': 'ر ح م', 'ارحم': 'ر ح م', 'يتراحمون': 'ر ح م',
            'علم': 'ع ل م', 'عالم': 'ع ل م', 'عليم': 'ع ل م', 'يعلم': 'ع ل م', 'تعلم': 'ع ل م', 'معلوم': 'ع ل م',
            'صدق': 'ص د ق', 'صادق': 'ص د ق', 'صديق': 'ص د ق', 'يصدق': 'ص د ق', 'صدقة': 'ص د ق',
            'حق': 'ح ق ق', 'حقيقة': 'ح ق ق', 'احق': 'ح ق ق', 'يحق': 'ح ق ق',
            'هدي': 'ه د ي', 'هدى': 'ه د ي', 'هادي': 'ه د ي', 'مهتدي': 'ه د ي', 'يهدي': 'ه د ي', 'اهتدوا': 'ه د ي',
            'امن': 'أ م ن', 'ايمان': 'أ م ن', 'مؤمن': 'أ م ن', 'مؤمنون': 'أ م ن', 'امان': 'أ م ن',
            'تقوي': 'و ق ي', 'تقوى': 'و ق ي', 'متقين': 'و ق ي', 'اتقوا': 'و ق ي', 'يتقي': 'و ق ي',
            'صبر': 'ص ب ر', 'صابر': 'ص ب ر', 'صابرين': 'ص ب ر', 'اصبر': 'ص ب ر', 'يصبر': 'ص ب ر',
            'شكر': 'ش ك ر', 'شاكر': 'ش ك ر', 'شكور': 'ش ك ر', 'يشكر': 'ش ك ر', 'اشكر': 'ش ك ر',
            'ذكر': 'ذ ك ر', 'ذاكر': 'ذ ك ر', 'تذكرة': 'ذ ك ر', 'يذكر': 'ذ ك ر', 'اذكروا': 'ذ ك ر',
            'قلب': 'ق ل ب', 'قلوب': 'ق ل ب', 'ينقلب': 'ق ل ب', 'تقلب': 'ق ل ب',
            'نفس': 'ن ف س', 'انفس': 'ن ف س', 'نفوس': 'ن ف س', 'يتنافس': 'ن ف س',
            'عمل': 'ع م ل', 'عامل': 'ع م ل', 'اعمال': 'ع م ل', 'يعمل': 'ع م ل', 'اعملوا': 'ع م ل',
            'خلق': 'خ ل ق', 'خالق': 'خ ل ق', 'مخلوق': 'خ ل ق', 'يخلق': 'خ ل ق',
            'رزق': 'ر ز ق', 'رازق': 'ر ز ق', 'رزاق': 'ر ز ق', 'يرزق': 'ر ز ق',
            'غفر': 'غ ف ر', 'غفور': 'غ ف ر', 'غفار': 'غ ف ر', 'مغفرة': 'غ ف ر', 'استغفر': 'غ ف ر',
            'توبة': 'ت و ب', 'تاب': 'ت و ب', 'تواب': 'ت و ب', 'تائبين': 'ت و ب', 'يتوب': 'ت و ب',
            'نور': 'ن و ر', 'منير': 'ن و ر', 'انوار': 'ن و ر', 'ينير': 'ن و ر',
            'ظلم': 'ظ ل م', 'ظالم': 'ظ ل م', 'ظلمات': 'ظ ل م', 'يظلم': 'ظ ل م', 'مظلوم': 'ظ ل م',
            'عدل': 'ع د ل', 'عادل': 'ع د ل', 'يعدل': 'ع د ل', 'اعدلوا': 'ع د ل',
            'احسان': 'ح س ن', 'حسن': 'ح س ن', 'حسنة': 'ح س ن', 'محسنين': 'ح س ن', 'احسن': 'ح س ن',
            'فلاح': 'ف ل ح', 'مفلحون': 'ف ل ح', 'مفلحين': 'ف ل ح', 'افلح': 'ف ل ح', 'يفلح': 'ف ل ح',
            'نصر': 'ن ص ر', 'ناصر': 'ن ص ر', 'نصير': 'ن ص ر', 'ينصر': 'ن ص ر', 'انتصر': 'ن ص ر',
            'فتح': 'ف ت ح', 'فاتح': 'ف ت ح', 'فتاح': 'ف ت ح', 'يفتح': 'ف ت ح', 'مبين': 'ب ي ن',
            'بيان': 'ب ي ن', 'بينات': 'ب ي ن', 'تبين': 'ب ي ن', 'يبين': 'ب ي ن'
        };

        if (knownRoots[w]) return knownRoots[w];

        w = w.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        w = w.replace(/(ون|ين|ات|ان|تان|تين|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');
        if (w.length > 3 && /^[يتنأ]/.test(w)) w = w.slice(1);
        if (w.length > 3 && w === 'ا') w = w + w.slice(2);
        if (w.length > 3 && w === 'م') w = w.slice(1);

        const letters = w.split('').slice(0, 3);
        return letters.length === 3 ? letters.join(' ') : w.split('').join(' ');
    }

    function buildDerivations(cleanWord, rootStr) {
        const r = rootStr.split(' ');
        const isTri = r.length === 3;
        const c1 = r || '', c2 = r || '', c3 = r || '';

        const past = isTri ? `${c1}${c2}${c3}` : cleanWord;
        const present = isTri ? `ي${c1}${c2}${c3}` : `ي${cleanWord}`;
        const activePart = isTri ? `${c1}ا${c2}${c3}` : `م${cleanWord}`;
        const passivePart = isTri ? `م${c1}${c2}و${c3}` : `مُ${cleanWord}`;
        const masdar = cleanWord;

        const searchTokens = [...new Set([
            cleanWord,
            past,
            present,
            activePart,
            passivePart
        ].filter(t => t && t.length >= 2))];

        return {
            past,
            present,
            activePart,
            passivePart,
            masdar,
            searchTokens
        };
    }

    async function fetchQuranicVerses(primaryWord, tokens) {
        const collected = new Map();
        const queriesToRun = [primaryWord, ...tokens.slice(0, 2)];

        for (const q of [...new Set(queriesToRun)]) {
            if (!q || q.length < 2) continue;
            try {
                const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-simple-clean`;
                const res = await fetch(url);
                if (!res.ok) continue;
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    for (const m of json.data.matches) {
                        const key = `${m.surah.number}:${m.numberInSurah}`;
                        if (!collected.has(key)) {
                            collected.set(key, {
                                surahName: m.surah.name,
                                surahNumber: m.surah.number,
                                revelationType: m.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
                                ayahNumber: m.numberInSurah,
                                text: m.text
                            });
                        }
                    }
                }
            } catch (e) {
            }
        }

        return Array.from(collected.values()).sort((a, b) => {
            if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
            return a.ayahNumber - b.ayahNumber;
        });
    }

    function renderResults(data) {
        const { query, root, derivations, verses } = data;
        const makkiVerses = verses.filter(v => v.revelationType === 'مكية');
        const madaniVerses = verses.filter(v => v.revelationType === 'مدنية');

        let html = '';

        if (currentLevel === 'all' || currentLevel === '1') {
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 1: الجذر اللغوي والأصل الاشتقاقي</div>
                <div class="level-body">
                    <p><strong>الكلمة المبحوثة:</strong> ${query}</p>
                    <p><strong>الجذر اللغوي المستخلص:</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.2rem;">(${root})</span></p>
                    <p style="margin-top:8px;color:#475569;">يمثل هذا الجذر المحور الدلالي الجامع الذي تتفرع منه الصيغ القرآنية المرتبطة باللفظ في سياقاته المختلفة.</p>
                </div>
            </div>`;
        }

        if (currentLevel === 'all' || currentLevel === '2') {
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 2: التصريفات والاشتقاقات الصرفية</div>
                <div class="level-body">
                    <table class="deriv-table">
                        <thead>
                            <tr>
                                <th>الصيغة الصرفية</th>
                                <th>اللفظ القياسي</th>
                                <th>الدلالة الوظيفية</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>الفعل الماضي</td><td><strong>${derivations.past}</strong></td><td>دلالة الثبوت والتحقق</td></tr>
                            <tr><td>الفعل المضارع</td><td><strong>${derivations.present}</strong></td><td>دلالة التجدد والاستمرار</td></tr>
                            <tr><td>المصدر / الاسم</td><td><strong>${derivations.masdar}</strong></td><td>دلالة الحدث المجرد والمعنى الكلي</td></tr>
                            <tr><td>اسم الفاعل</td><td><strong>${derivations.activePart}</strong></td><td>من قام بالفعل واتصف به</td></tr>
                            <tr><td>اسم المفعول</td><td><strong>${derivations.passivePart}</strong></td><td>ما وقع عليه أثر الفعل</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        }

        if (currentLevel === 'all' || currentLevel === '3') {
            const sampleVerses = verses.slice(0, 15);
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 3: الشواهد القرآنية الكاملة (${verses.length} موضعاً)</div>
                <div class="level-body">
                    ${verses.length === 0
                        ? `<p>لم يتم العثور على مطابقات نصية مباشرة. جرب البحث بصيغة مفردة أو فعل مجرد.</p>`
                        : sampleVerses.map(v => `
                            <div class="verse-box">
                                <div class="verse-text">﴿ ${highlightMatch(v.text, derivations.searchTokens)} ﴾</div>
                                <div class="verse-meta">
                                    <span>${v.surahName} — آية ${v.ayahNumber}</span>
                                    <span class="surah-type-badge ${v.revelationType === 'مكية' ? 'surah-makki' : 'surah-madani'}">${v.revelationType}</span>
                                </div>
                            </div>
                        `).join('')}
                    ${verses.length > 15 ? `<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;">تم عرض أول 15 شاهداً من أصل ${verses.length} آية مرتبة حسب المصحف.</p>` : ''}
                </div>
            </div>`;
        }

        if (currentLevel === 'all' || currentLevel === '4') {
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 4: التدرج السياقي (المكي والمدني)</div>
                <div class="level-body">
                    <div class="deriv-group-title">أولاً: المواضع المكية (${makkiVerses.length} آية) — التأسيس العقدي وبناء التصور</div>
                    ${makkiVerses.slice(0, 5).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightMatch(v.text, derivations.searchTokens)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('') || '<p>لا توجد مواضع مكية مطابقة.</p>'}

                    <div class="deriv-group-title">ثانياً: المواضع المدنية (${madaniVerses.length} آية) — التشريع والتطبيق المجتمعي</div>
                    ${madaniVerses.slice(0, 5).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightMatch(v.text, derivations.searchTokens)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('') || '<p>لا توجد مواضع مدنية مطابقة.</p>'}
                </div>
            </div>`;
        }

        if (currentLevel === 'all' || currentLevel === '5') {
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 5: اللطائف البيانية والمقاصد التركيبية</div>
                <div class="level-body">
                    <div class="irab-box">
                        <strong>الملاحظة البيانية:</strong> ورود مادة <strong>(${root})</strong> في القرآن الكريم يتنوع بين الصيغة الاسمية الدالة على الثبات والرسوخ، والصيغة الفعلية الدالة على الحركية والتجدد وفق مقتضى الحال والسياق.
                    </div>
                    <p style="margin-top:10px;"><strong>إحصاء الانتشار:</strong> وردت الصيغ المرتبطة بالبحث في <strong>${verses.length}</strong> آية؛ منها <strong>${makkiVerses.length}</strong> في السور المكية و<strong>${madaniVerses.length}</strong> في السور المدنية.</p>
                </div>
            </div>`;
        }

        if (currentLevel === 'all' || currentLevel === '6') {
            html += `
            <div class="level-card">
                <div class="level-header">المرحلة 6: الخلاصة التدبرية والعملية (منهج الصلاح والفوز)</div>
                <div class="level-body">
                    <div class="stage6-directive">
                        إن التدبر المنهجي لمادة <strong>«${query}»</strong> عبر مراحل الهرم البحثي يكشف ترابط المعنى اللغوي بالتنزيل القرآني؛ ليُثمر علماً نافعاً يورث <strong>الصلاح</strong> في القلب والسلوك، ويُحقق <strong>الفوز</strong> في الدنيا والآخرة.
                    </div>
                </div>
            </div>`;
        }

        resultsContainer.innerHTML = html;
    }
});
