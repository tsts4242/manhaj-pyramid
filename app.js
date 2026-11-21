document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const btnPyramid = document.getElementById('btn-pyramid');
    const btnClosePyramid = document.getElementById('btn-close-pyramid');
    const pyramidBox = document.getElementById('pyramid-box');

    const btnArticles = document.getElementById('btn-articles');
    const btnCloseArticles = document.getElementById('btn-close-articles');
    const articlesBox = document.getElementById('articles-box');
    const articlesGrid = document.getElementById('articles-grid');
    const articleViewer = document.getElementById('article-viewer');

    const searchInput = document.getElementById('search-input');
    const btnSearch = document.getElementById('btn-search');
    const btnClear = document.getElementById('btn-clear');
    const btnListen = document.getElementById('btn-listen');
    const stageBtns = document.querySelectorAll('.stage-btn');
    const resultsContainer = document.getElementById('results-container');
    const searchStatus = document.getElementById('search-status');

    let currentStage = 'all';
    let lastResultsData = null;
    let isSpeaking = false;
    let currentArticlePage = 1;

    // --- Toggle Pyramid & Articles ---
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

    // --- Render 24 Articles Grid (2 Pages x 12) ---
    function getArticleByNumber(num) {
        if (typeof ARTICLES_DATA !== 'undefined' && Array.isArray(ARTICLES_DATA)) {
            return ARTICLES_DATA.find(a => Number(a.id) === num || Number(a.number) === num) || ARTICLES_DATA[num - 1];
        }
        return null;
    }

    function renderArticlesGrid() {
        if (!articlesGrid) return;
        articlesGrid.innerHTML = '';

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
                if (articleViewer) {
                    articleViewer.style.display = 'block';
                    if (art && art.content && art.content.trim() !== '') {
                        const paras = art.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                        articleViewer.innerHTML = `<h3>${i}. ${art.title || 'مقال رقم ' + i}</h3>${paras}`;
                    } else {
                        articleViewer.innerHTML = `<h3>المقال رقم ${i}</h3><p>هذا الموضع مهيأ لإضافة البحث والمقال رقم ${i} قريباً.</p>`;
                    }
                }
            });
            articlesGrid.appendChild(btn);
        }

        // شريط التنقل بين الصفحتين مع السهم الأوسط المتجه للأسفل
        let paginationBar = document.getElementById('articles-pagination');
        if (!paginationBar) {
            paginationBar = document.createElement('div');
            paginationBar.id = 'articles-pagination';
            paginationBar.className = 'articles-pagination';
            articlesGrid.parentNode.insertBefore(paginationBar, articlesGrid.nextSibling);
        }

        paginationBar.innerHTML = `
            <button type="button" class="page-nav-btn" ${currentArticlePage === 1 ? 'disabled' : ''} id="prev-art-page">
                <span class="nav-arrow">▶</span>
                <span class="nav-label">السابق (1-12)</span>
            </button>
            <div class="down-scroll-hint" title="المقال يُعرض في الأسفل">⬇</div>
            <button type="button" class="page-nav-btn" ${currentArticlePage === 2 ? 'disabled' : ''} id="next-art-page">
                <span class="nav-label">التالي (13-24)</span>
                <span class="nav-arrow">◀</span>
            </button>
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

    // --- Stage Filter Buttons ---
    stageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            stageBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStage = btn.dataset.stage || 'all';
            if (lastResultsData) {
                renderSearchResults(lastResultsData);
            }
        });
    });

    // --- Search, Clear & Listen ---
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const q = searchInput ? searchInput.value.trim() : '';
            if (q) runSearch(q);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if (q) runSearch(q);
            }
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            stopAudio();
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            if (resultsContainer) resultsContainer.innerHTML = '';
            if (searchStatus) searchStatus.style.display = 'none';
            lastResultsData = null;
        });
    }

    function stopAudio() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        isSpeaking = false;
        if (btnListen) {
            btnListen.classList.remove('speaking');
            btnListen.textContent = 'استمع';
        }
    }

    if (btnListen) {
        btnListen.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) {
                alert('عذراً، المتصفح لا يدعم القراءة الصوتية.');
                return;
            }
            if (isSpeaking) {
                stopAudio();
                return;
            }
            const text = resultsContainer ? resultsContainer.innerText.trim() : '';
            if (!text) {
                alert('يرجى البحث عن كلمة أولاً للاستماع إلى النتائج.');
                return;
            }
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'ar-SA';
            utter.rate = 0.95;
            utter.onend = stopAudio;
            utter.onerror = stopAudio;
            isSpeaking = true;
            btnListen.classList.add('speaking');
            btnListen.textContent = 'إيقاف';
            window.speechSynthesis.speak(utter);
        });
    }

    // --- Arabic Normalization & Root Engine ---
    function removeTashkeel(text) {
        return text ? text.replace(/[\u064B-\u065F\u0670\u0640]/g, '') : '';
    }

    function normalizeArabic(text) {
        return removeTashkeel(text)
            .replace(/[إأآا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء');
    }

    function highlightText(text, terms) {
        if (!text || !terms || !terms.length) return text;
        const cleanTerms = [...new Set(terms.map(t => normalizeArabic(t)).filter(t => t.length >= 2))];
        if (!cleanTerms.length) return text;

        return text.split(/(\s+)/).map(word => {
            if (/^\s+$/.test(word)) return word;
            const norm = normalizeArabic(word).replace(/[^\u0621-\u064A]/g, '');
            if (!norm) return word;
            const matched = cleanTerms.some(t => norm === t || norm.includes(t));
            return matched ? `<span class="hl-term">${word}</span>` : word;
        }).join('');
    }

    function getRootAndDerivations(query) {
        const clean = removeTashkeel(query).replace(/[^\u0621-\u064A\s]/g, '').trim();
        const firstWord = normalizeArabic(clean.split(/\s+/)[0] || '');

        const rootsDict = {
            'صلاح': 'ص ل ح', 'صلح': 'ص ل ح', 'صالح': 'ص ل ح', 'مصلح': 'ص ل ح', 'اصلاح': 'ص ل ح', 'صالحات': 'ص ل ح', 'يصلح': 'ص ل ح',
            'فوز': 'ف و ز', 'فاز': 'ف و ز', 'فائز': 'ف و ز', 'فائزون': 'ف و ز', 'مفاز': 'ف و ز', 'مفازا': 'ف و ز',
            'رحمة': 'ر ح م', 'رحم': 'ر ح م', 'رحيم': 'ر ح م', 'رحمن': 'ر ح م', 'ارحم': 'ر ح م',
            'علم': 'ع ل م', 'عالم': 'ع ل م', 'عليم': 'ع ل م', 'يعلم': 'ع ل م', 'تعلم': 'ع ل م',
            'صدق': 'ص د ق', 'صادق': 'ص د ق', 'صديق': 'ص د ق', 'يصدق': 'ص د ق', 'صدقة': 'ص د ق',
            'حق': 'ح ق ق', 'حقيقة': 'ح ق ق', 'احق': 'ح ق ق', 'يحق': 'ح ق ق',
            'هدي': 'ه د ي', 'هدى': 'ه د ي', 'هادي': 'ه د ي', 'مهتدي': 'ه د ي', 'يهدي': 'ه د ي',
            'امن': 'أ م ن', 'ايمان': 'أ م ن', 'مؤمن': 'أ م ن', 'مؤمنون': 'أ م ن',
            'تقوي': 'و ق ي', 'تقوى': 'و ق ي', 'متقين': 'و ق ي', 'اتقوا': 'و ق ي',
            'صبر': 'ص ب ر', 'صابر': 'ص ب ر', 'صابرين': 'ص ب ر', 'اصبر': 'ص ب ر',
            'شكر': 'ش ك ر', 'شاكر': 'ش ك ر', 'شكور': 'ش ك ر', 'يشكر': 'ش ك ر',
            'ذكر': 'ذ ك ر', 'ذاكر': 'ذ ك ر', 'تذكرة': 'ذ ك ر', 'يذكر': 'ذ ك ر',
            'قلب': 'ق ل ب', 'قلوب': 'ق ل ب', 'ينقلب': 'ق ل ب',
            'نفس': 'ن ف س', 'انفس': 'ن ف س', 'نفوس': 'ن ف س',
            'عمل': 'ع م ل', 'عامل': 'ع م ل', 'اعمال': 'ع م ل', 'يعمل': 'ع م ل',
            'فلاح': 'ف ل ح', 'مفلحون': 'ف ل ح', 'افلح': 'ف ل ح', 'يفلح': 'ف ل ح',
            'احسان': 'ح س ن', 'حسن': 'ح س ن', 'حسنة': 'ح س ن', 'محسنين': 'ح س ن',
            'عدل': 'ع د ل', 'عادل': 'ع د ل', 'يعدل': 'ع د ل', 'اعدلوا': 'ع د ل',
            'ظلم': 'ظ ل م', 'ظالم': 'ظ ل م', 'ظلمات': 'ظ ل م', 'يظلم': 'ظ ل م',
            'نور': 'ن و ر', 'منير': 'ن و ر', 'انوار': 'ن و ر',
            'غفر': 'غ ف ر', 'غفور': 'غ ف ر', 'مغفرة': 'غ ف ر', 'استغفر': 'غ ف ر',
            'توبة': 'ت و ب', 'تاب': 'ت و ب', 'تواب': 'ت و ب', 'يتوب': 'ت و ب'
        };

        let root = rootsDict[firstWord];
        if (!root) {
            let w = firstWord.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
            w = w.replace(/(ون|ين|ات|ان|تان|تين|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');
            if (w.length > 3 && /^[يتنأ]/.test(w)) w = w.slice(1);
            if (w.length > 3 && w[1] === 'ا') w = w[0] + w.slice(2);
            if (w.length > 3 && w[0] === 'م') w = w.slice(1);
            const letters = w.split('').slice(0, 3);
            root = letters.join(' ');
        }

        const r = root.split(' ');
        const isTri = r.length === 3;
        const c1 = r[0] || '', c2 = r[1] || '', c3 = r[2] || '';

        const past = isTri ? `${c1}${c2}${c3}` : clean;
        const present = isTri ? `ي${c1}${c2}${c3}` : `ي${clean}`;
        const activePart = isTri ? `${c1}ا${c2}${c3}` : `م${clean}`;
        const passivePart = isTri ? `م${c1}${c2}و${c3}` : `مُ${clean}`;

        const tokens = [...new Set([clean, past, present, activePart, passivePart].filter(t => t && t.length >= 2))];

        return { clean, root, past, present, activePart, passivePart, masdar: clean, tokens };
    }

    // --- Quran Search API ---
    async function searchQuranAPI(primaryWord, tokens) {
        const map = new Map();
        const queries = [...new Set([primaryWord, ...tokens.slice(0, 2)])].filter(q => q && q.length >= 2);

        for (const q of queries) {
            try {
                const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/quran-simple-clean`);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && data.data && Array.isArray(data.data.matches)) {
                    for (const m of data.data.matches) {
                        const key = `${m.surah.number}:${m.numberInSurah}`;
                        if (!map.has(key)) {
                            map.set(key, {
                                surahName: m.surah.name,
                                surahNumber: m.surah.number,
                                revelationType: m.surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
                                ayahNumber: m.numberInSurah,
                                text: m.text
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        return Array.from(map.values()).sort((a, b) =>
            a.surahNumber !== b.surahNumber ? a.surahNumber - b.surahNumber : a.ayahNumber - b.ayahNumber
        );
    }

    // --- Main Search Runner ---
    async function runSearch(query) {
        stopAudio();
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (searchStatus) searchStatus.style.display = 'flex';

        try {
            const morph = getRootAndDerivations(query);
            const verses = await searchQuranAPI(morph.clean, morph.tokens);

            lastResultsData = { query, morph, verses };
            if (searchStatus) searchStatus.style.display = 'none';
            renderSearchResults(lastResultsData);
        } catch (err) {
            if (searchStatus) searchStatus.style.display = 'none';
            if (resultsContainer) {
                resultsContainer.innerHTML = `<div class="stage-card"><div class="stage-body" style="color:#b91c1c;font-weight:700;">تعذر الاتصال بقاعدة البيانات القرآنية حالياً. يرجى المحاولة مرة أخرى.</div></div>`;
            }
        }
    }

    // --- Render 6 Stages ---
    function renderSearchResults(data) {
        if (!resultsContainer) return;
        const { query, morph, verses } = data;
        const makki = verses.filter(v => v.revelationType === 'مكية');
        const madani = verses.filter(v => v.revelationType === 'مدنية');

        let html = '';

        if (currentStage === 'all' || currentStage === '1') {
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 1: الجذر اللغوي والأصل الاشتقاقي</div>
                <div class="stage-body">
                    <p><strong>الكلمة المبحوثة:</strong> ${query}</p>
                    <p><strong>الجذر اللغوي:</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.2rem;">(${morph.root})</span></p>
                    <p style="margin-top:8px;color:#475569;">يمثل هذا الجذر الأصل الدلالي الجامع الذي تتفرع منه الصيغ القرآنية المرتبطة باللفظ.</p>
                </div>
            </div>`;
        }

        if (currentStage === 'all' || currentStage === '2') {
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 2: التصريفات والاشتقاقات الصرفية</div>
                <div class="stage-body">
                    <table class="deriv-table">
                        <thead>
                            <tr>
                                <th>الصيغة الصرفية</th>
                                <th>اللفظ القياسي</th>
                                <th>الدلالة الوظيفية</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>الفعل الماضي</td><td><strong>${morph.past}</strong></td><td>دلالة الثبوت والتحقق</td></tr>
                            <tr><td>الفعل المضارع</td><td><strong>${morph.present}</strong></td><td>دلالة التجدد والاستمرار</td></tr>
                            <tr><td>المصدر / الاسم</td><td><strong>${morph.masdar}</strong></td><td>دلالة الحدث المجرد والمعنى الكلي</td></tr>
                            <tr><td>اسم الفاعل</td><td><strong>${morph.activePart}</strong></td><td>من قام بالفعل واتصف به</td></tr>
                            <tr><td>اسم المفعول</td><td><strong>${morph.passivePart}</strong></td><td>ما وقع عليه أثر الفعل</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        }

        if (currentStage === 'all' || currentStage === '3') {
            const list = verses.slice(0, 15);
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 3: الشواهد القرآنية الكاملة (${verses.length} موضعاً)</div>
                <div class="stage-body">
                    ${verses.length === 0
                        ? `<p>لم يتم العثور على مطابقات نصية مباشرة. جرب البحث بصيغة مفردة أو فعل مجرد.</p>`
                        : list.map(v => `
                            <div class="verse-box">
                                <div class="verse-text">﴿ ${highlightText(v.text, morph.tokens)} ﴾</div>
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

        if (currentStage === 'all' || currentStage === '4') {
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 4: التدرج السياقي (المكي والمدني)</div>
                <div class="stage-body">
                    <div class="deriv-group-title">أولاً: المواضع المكية (${makki.length} آية) — التأسيس العقدي وبناء التصور</div>
                    ${makki.slice(0, 5).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightText(v.text, morph.tokens)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('') || '<p>لا توجد مواضع مكية مطابقة.</p>'}

                    <div class="deriv-group-title">ثانياً: المواضع المدنية (${madani.length} آية) — التشريع والتطبيق المجتمعي</div>
                    ${madani.slice(0, 5).map(v => `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightText(v.text, morph.tokens)} ﴾</div>
                            <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                        </div>
                    `).join('') || '<p>لا توجد مواضع مدنية مطابقة.</p>'}
                </div>
            </div>`;
        }

        if (currentStage === 'all' || currentStage === '5') {
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 5: اللطائف البيانية والمقاصد التركيبية</div>
                <div class="stage-body">
                    <div class="irab-box">
                        <strong>الملاحظة البيانية:</strong> ورود مادة <strong>(${morph.root})</strong> في القرآن الكريم يتنوع بين الصيغة الاسمية الدالة على الثبات والرسوخ، والصيغة الفعلية الدالة على الحركية والتجدد وفق مقتضى الحال والسياق.
                    </div>
                    <p style="margin-top:10px;"><strong>إحصاء الانتشار:</strong> وردت الصيغ المرتبطة بالبحث في <strong>${verses.length}</strong> آية؛ منها <strong>${makki.length}</strong> في السور المكية و<strong>${madani.length}</strong> في السور المدنية.</p>
                </div>
            </div>`;
        }

        if (currentStage === 'all' || currentStage === '6') {
            html += `
            <div class="stage-card">
                <div class="stage-header">المرحلة 6: الخلاصة التدبرية والعملية (منهج الصلاح والفوز)</div>
                <div class="stage-body">
                    <div class="stage6-directive">
                        إن التدبر المنهجي لمادة <strong>«${query}»</strong> عبر مراحل الهرم البحثي يكشف ترابط المعنى اللغوي بالتنزيل القرآني؛ ليُثمر علماً نافعاً يورث <strong>الصلاح</strong> في القلب والسلوك، ويُحقق <strong>الفوز</strong> في الدنيا والآخرة.
                    </div>
                </div>
            </div>`;
        }

        resultsContainer.innerHTML = html;
    }
});
