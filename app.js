document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('quran-word');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const listenBtn = document.getElementById('listen-btn');
    const levelBtns = document.querySelectorAll('.level-btn');
    const riwayahBtns = document.querySelectorAll('.riwayah-btn');
    const loader = document.getElementById('loader');
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

    let currentLevel = 'all';
    let currentRiwayah = 'qaloon';
    let currentData = null;
    let isSpeaking = false;
    let currentAudio = null;
    let activeAudioBtn = null;
    let currentArticlePage = 1;

    // 1. Pyramids & Articles Toggles
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
    if (btnBack1 && boxPyr1) btnBack1.addEventListener('click', () => boxPyr1.style.display = 'none');

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
    if (btnBack2 && boxPyr2) btnBack2.addEventListener('click', () => boxPyr2.style.display = 'none');

    if (btnBackArticles) btnBackArticles.style.display = 'none';

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

    // 2. Riwayah Selector (Qaloon / Warsh)
    riwayahBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            riwayahBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRiwayah = btn.dataset.riwayah;
            stopAyahAudio();
        });
    });

    // 3. Ayah Audio Playback (Qaloon & Warsh)
    function stopAyahAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.classList.remove('playing');
            activeAudioBtn.innerHTML = activeAudioBtn.dataset.isEn === '1' ? '🔊 Listen' : '🔊 استماع';
            activeAudioBtn = null;
        }
    }

    function pad3(n) {
        return String(n).padStart(3, '0');
    }

    window.playAyahAudio = function(btn, surahNum, ayahNum) {
        if (activeAudioBtn === btn) {
            stopAyahAudio();
            return;
        }
        stopAyahAudio();
        stopSpeech();

        const code = `${pad3(surahNum)}${pad3(ayahNum)}`;
        // EveryAyah reliable CDNs for Qaloon (Husary_Muallim / Qaloon) & Warsh (Ibrahim_Al_Dosary / Warsh)
        const primaryUrl = currentRiwayah === 'qaloon'
            ? `https://everyayah.com/data/Husary_Qaloon_128kbps/${code}.mp3`
            : `https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps/${code}.mp3`;
        const fallbackUrl = currentRiwayah === 'qaloon'
            ? `https://everyayah.com/data/Husary_128kbps/${code}.mp3`
            : `https://everyayah.com/data/warsh/warsh_yassin_al_jazaery_64kbps/${code}.mp3`;

        activeAudioBtn = btn;
        btn.classList.add('playing');
        btn.innerHTML = btn.dataset.isEn === '1' ? '⏹ Stop' : '⏹ إيقاف';

        const audio = new Audio(primaryUrl);
        currentAudio = audio;

        audio.onerror = () => {
            if (currentAudio === audio) {
                const fallbackAudio = new Audio(fallbackUrl);
                currentAudio = fallbackAudio;
                fallbackAudio.onended = () => stopAyahAudio();
                fallbackAudio.onerror = () => stopAyahAudio();
                fallbackAudio.play().catch(() => stopAyahAudio());
            }
        };

        audio.onended = () => stopAyahAudio();
        audio.play().catch(() => {
            audio.onerror();
        });
    };

    // 4. Level Buttons
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lvl = btn.dataset.lvl;
            if (btn.classList.contains('active') && currentLevel === lvl) {
                btn.classList.remove('active');
                currentLevel = 'all';
            } else {
                levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentLevel = lvl;
            }
            if (currentData) renderResults(currentData);
        });
    });

    // 5. Clear & Speech Buttons
    clearBtn.addEventListener('click', () => {
        stopSpeech();
        stopAyahAudio();
        input.value = '';
        currentData = null;
        resultsWrapper.style.display = 'none';
        for (let i = 1; i <= 6; i++) {
            const c = document.getElementById(`card-${i}`);
            if (c) c.style.display = 'none';
        }
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
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        isSpeaking = false;
        listenBtn.classList.remove('speaking');
        listenBtn.textContent = 'استماع';
    }

    listenBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
            alert('عذراً، متصفحك لا يدعم القراءة الصوتية.');
            return;
        }
        if (isSpeaking) {
            stopSpeech();
            return;
        }
        stopAyahAudio();
        const textToRead = resultsWrapper.innerText.trim();
        if (!textToRead) {
            alert('يرجى البحث أولاً للاستماع إلى النتائج.');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        const isEn = currentData && currentData.lang === 'en';
        utterance.lang = isEn ? 'en-US' : 'ar-SA';
        utterance.rate = 0.95;
        utterance.onend = () => stopSpeech();
        utterance.onerror = () => stopSpeech();
        isSpeaking = true;
        listenBtn.classList.add('speaking');
        listenBtn.textContent = isEn ? 'Stop' : 'إيقاف';
        window.speechSynthesis.speak(utterance);
    });

    // 6. Language Detection & Normalization
    function detectLanguage(text) {
        return /[a-zA-Z]/.test(text) ? 'en' : 'ar';
    }

    function stripTashkeel(str) {
        return str ? str.replace(/[\u064B-\u065F\u0670\u0640]/g, '') : '';
    }

    function normalizeAlef(str) {
        return stripTashkeel(str)
            .replace(/[إأآٱا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء');
    }

    function highlightMatch(text, terms, lang) {
        if (!text || !terms || terms.length === 0) return text;
        if (lang === 'en') {
            const escaped = terms.filter(t => t.length >= 2).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            if (escaped.length === 0) return text;
            const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
            return text.replace(regex, '<span class="hl-term">$1</span>');
        }
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

    // 7. Arabic Root & Derivations
    function extractArabicRoot(word) {
        let w = normalizeAlef(word).split(/\s+/)[0] || '';
        const knownRoots = {
            'صلاح': 'ص ل ح', 'صلح': 'ص ل ح', 'صالح': 'ص ل ح', 'مصلح': 'ص ل ح', 'اصلاح': 'ص ل ح', 'صالحات': 'ص ل ح',
            'فوز': 'ف و ز', 'فاز': 'ف و ز', 'فائز': 'ف و ز', 'فائزون': 'ف و ز', 'مفاز': 'ف و ز',
            'صلاة': 'ص ل و', 'صلاه': 'ص ل و', 'صلوات': 'ص ل و', 'يصلي': 'ص ل و', 'صلى': 'ص ل و', 'مصلين': 'ص ل و',
            'كتاب': 'ك ت ب', 'كتب': 'ك ت ب', 'يكتب': 'ك ت ب', 'كاتب': 'ك ت ب', 'مكتوب': 'ك ت ب',
            'رحمة': 'ر ح م', 'رحم': 'ر ح م', 'رحيم': 'ر ح م', 'رحمن': 'ر ح م',
            'علم': 'ع ل م', 'عالم': 'ع ل م', 'عليم': 'ع ل م', 'يعلم': 'ع ل م',
            'صدق': 'ص د ق', 'صادق': 'ص د ق', 'صديق': 'ص د ق', 'صدقة': 'ص د ق',
            'حق': 'ح ق ق', 'حقيقة': 'ح ق ق', 'احق': 'ح ق ق',
            'هدي': 'ه د ي', 'هدى': 'ه د ي', 'هادي': 'ه د ي', 'يهدي': 'ه د ي',
            'امن': 'أ م ن', 'ايمان': 'أ م ن', 'مؤمن': 'أ م ن', 'مؤمنون': 'أ م ن',
            'تقوي': 'و ق ي', 'تقوى': 'و ق ي', 'متقين': 'و ق ي', 'اتقوا': 'و ق ي',
            'صبر': 'ص ب ر', 'صابر': 'ص ب ر', 'صابرين': 'ص ب ر', 'اصبر': 'ص ب ر',
            'شكر': 'ش ك ر', 'شاكر': 'ش ك ر', 'شكور': 'ش ك ر', 'يشكر': 'ش ك ر',
            'ذكر': 'ذ ك ر', 'ذاكر': 'ذ ك ر', 'تذكرة': 'ذ ك ر', 'يذكر': 'ذ ك ر',
            'عمل': 'ع م ل', 'عامل': 'ع م ل', 'اعمال': 'ع م ل', 'يعمل': 'ع م ل',
            'نور': 'ن و ر', 'منير': 'ن و ر', 'انوار': 'ن و ر',
            'ظلم': 'ظ ل م', 'ظالم': 'ظ ل م', 'ظلمات': 'ظ ل م',
            'عدل': 'ع د ل', 'عادل': 'ع د ل', 'يعدل': 'ع د ل',
            'احسان': 'ح س ن', 'حسن': 'ح س ن', 'حسنة': 'ح س ن', 'محسنين': 'ح س ن',
            'فلاح': 'ف ل ح', 'مفلحون': 'ف ل ح', 'افلح': 'ف ل ح'
        };
        if (knownRoots[w]) return knownRoots[w];

        w = w.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        w = w.replace(/(ون|ين|ات|ان|تان|تين|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');
        if (w.length > 3 && /^[يتنأ]/.test(w)) w = w.slice(1);
        const letters = w.split('').slice(0, 3);
        return letters.length === 3 ? letters.join(' ') : w.split('').join(' ');
    }

    function buildDerivations(cleanWord, rootStr, lang) {
        if (lang === 'en') {
            const base = cleanWord.toLowerCase();
            return {
                past: base,
                present: base,
                activePart: base,
                passivePart: base,
                masdar: base,
                searchTokens: [base]
            };
        }
        const r = rootStr.split(' ');
        const isTri = r.length === 3;
        const c1 = r[0] || '', c2 = r[1] || '', c3 = r[2] || '';
        const past = isTri ? `${c1}${c2}${c3}` : cleanWord;
        const present = isTri ? `ي${c1}${c2}${c3}` : `ي${cleanWord}`;
        const activePart = isTri ? `${c1}ا${c2}${c3}` : `م${cleanWord}`;
        const passivePart = isTri ? `م${c1}${c2}و${c3}` : `مُ${cleanWord}`;
        const masdar = cleanWord;

        return {
            past, present, activePart, passivePart, masdar,
            searchTokens: [...new Set([cleanWord, past, present, activePart, passivePart].filter(t => t && t.length >= 2))]
        };
    }

    // 8. Fetch Quran Verses (Arabic & English)
    async function fetchQuranicVerses(primaryWord, tokens, lang) {
        const collected = new Map();

        if (lang === 'en') {
            try {
                const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(primaryWord)}/all/en.sahih`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.data && Array.isArray(json.data.matches)) {
                        for (const m of json.data.matches.slice(0, 25)) {
                            const key = `${m.surah.number}:${m.numberInSurah}`;
                            collected.set(key, {
                                surahName: m.surah.englishName,
                                surahArName: m.surah.name,
                                surahNumber: m.surah.number,
                                revelationType: m.surah.revelationType === 'Meccan' ? 'Meccan' : 'Medinan',
                                ayahNumber: m.numberInSurah,
                                text: m.text
                            });
                        }
                    }
                }
            } catch (e) {}
            return Array.from(collected.values()).sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);
        }

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
            } catch (e) {}
        }

        return Array.from(collected.values()).sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);
    }

    // 9. Fetch Hadith from Sunnah.com / Hadith API (Arabic & English)
    async function fetchSunnahHadiths(query, lang) {
        const results = [];
        const books = lang === 'en'
            ? [
                { id: 'eng-bukhari', name: 'Sahih al-Bukhari', slug: 'bukhari' },
                { id: 'eng-muslim', name: 'Sahih Muslim', slug: 'muslim' },
                { id: 'eng-abudawud', name: 'Sunan Abi Dawud', slug: 'abudawud' },
                { id: 'eng-tirmidhi', name: 'Jami` at-Tirmidhi', slug: 'tirmidhi' }
              ]
            : [
                { id: 'ara-bukhari', name: 'صحيح البخاري', slug: 'bukhari' },
                { id: 'ara-muslim', name: 'صحيح مسلم', slug: 'muslim' },
                { id: 'ara-abudawud', name: 'سنن أبي داود', slug: 'abudawud' },
                { id: 'ara-tirmidhi', name: 'جامع الترمذي', slug: 'tirmidhi' }
              ];

        const normQ = lang === 'en' ? query.toLowerCase() : normalizeAlef(query);

        // Fetch section 1 of major Sunnah.com collections via fast CDN mirror for instant zero-CORS search
        for (const book of books) {
            if (results.length >= 6) break;
            try {
                const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${book.id}/sections/1.json`;
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                if (data && Array.isArray(data.hadiths)) {
                    for (const h of data.hadiths) {
                        const textNorm = lang === 'en' ? (h.text || '').toLowerCase() : normalizeAlef(h.text || '');
                        if (textNorm.includes(normQ)) {
                            results.push({
                                bookName: book.name,
                                slug: book.slug,
                                hadithNumber: h.hadithnumber,
                                text: h.text,
                                url: `https://sunnah.com/${book.slug}:${h.hadithnumber}`
                            });
                            if (results.length >= 6) break;
                        }
                    }
                }
            } catch (e) {}
        }

        return results;
    }

    // 10. Core Search Execution
    async function executeSearch(rawTerm) {
        stopSpeech();
        stopAyahAudio();
        resultsWrapper.style.display = 'none';
        loader.style.display = 'flex';

        const lang = detectLanguage(rawTerm);
        const loaderSpan = loader.querySelector('.loader-single-line');
        if (loaderSpan) {
            loaderSpan.textContent = lang === 'en'
                ? 'Searching across levels (Quran & Sunnah.com)...'
                : 'جاري البحث بحسب المستويات...';
        }

        try {
            const cleanQuery = lang === 'en'
                ? rawTerm.replace(/[^a-zA-Z\s-]/g, '').trim()
                : stripTashkeel(rawTerm).replace(/[^\u0621-\u064A\s]/g, '').trim();

            const rootLetters = lang === 'en' ? cleanQuery.toUpperCase() : extractArabicRoot(cleanQuery);
            const derivData = buildDerivations(cleanQuery, rootLetters, lang);

            const [verses, hadiths] = await Promise.all([
                fetchQuranicVerses(cleanQuery, derivData.searchTokens, lang),
                fetchSunnahHadiths(cleanQuery, lang)
            ]);

            currentData = {
                lang,
                query: rawTerm,
                cleanQuery,
                root: rootLetters,
                derivations: derivData,
                verses,
                hadiths
            };

            loader.style.display = 'none';
            renderResults(currentData);
        } catch (err) {
            loader.style.display = 'none';
            resultsWrapper.style.display = 'flex';
            const c1 = document.getElementById('card-1');
            const b1 = document.getElementById('content-1');
            if (c1 && b1) {
                c1.style.display = 'block';
                b1.innerHTML = `<p style="color:#b91c1c;font-weight:700;">${lang === 'en' ? 'Connection error. Please try again.' : 'حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.'}</p>`;
            }
        }
    }

    // 11. Render Ayah Card Helper (NO irab-box, WITH Qaloon/Warsh Listen Button)
    function buildAyahHtml(v, tokens, lang) {
        const isEn = lang === 'en';
        const revBadgeClass = (v.revelationType === 'مكية' || v.revelationType === 'Meccan') ? 'surah-makki' : 'surah-madani';
        const verseDir = isEn ? 'dir="ltr"' : 'dir="rtl"';
        const metaText = isEn
            ? `Surah ${v.surahName} — Ayah ${v.ayahNumber}`
            : `[${v.surahName} : ${v.ayahNumber}]`;
        const listenLabel = isEn ? '🔊 Listen' : '🔊 استماع';

        return `
            <div class="verse-box" ${verseDir}>
                <div class="verse-text" style="${isEn ? 'font-family:Tajawal,sans-serif;font-size:1.05rem;line-height:1.7;' : ''}">
                    ${isEn ? highlightMatch(v.text, tokens, 'en') : `﴿ ${highlightMatch(v.text, tokens, 'ar')} ﴾`}
                </div>
                <div class="verse-meta">
                    <span>${metaText}</span>
                    <span class="surah-type-badge ${revBadgeClass}">${v.revelationType}</span>
                    <button type="button" class="ayah-audio-btn" data-is-en="${isEn ? '1' : '0'}" onclick="playAyahAudio(this, ${v.surahNumber}, ${v.ayahNumber})">${listenLabel}</button>
                </div>
            </div>
        `;
    }

    // 12. Render All 6 Levels According to Language
    function renderResults(data) {
        const { lang, query, root, derivations, verses, hadiths } = data;
        const isEn = lang === 'en';
        resultsWrapper.style.display = 'flex';
        resultsWrapper.dir = isEn ? 'ltr' : 'rtl';

        const headers = isEn
            ? [
                '1. Linguistic Root & Derivatives',
                '2. Syntax & Occurrences in the Quran',
                '3. Old & New Testaments (Torah & Gospel)',
                '4. Heritage & Narrations (Sunnah.com & Mishnah)',
                '5. Muhkam vs. Mutashabih Verses',
                '6. Deduction, Inference & Interpretation'
              ]
            : [
                '1. الأصل اللغوي للكلمة ومشتقاتها',
                '2. الإعراب والموقع في الكتاب (القرآن)',
                '3. العهد القديم والجديد (التوراة والإنجيل)',
                '4. الموروث والمرويات (الصحاح والمشنا)',
                '5. فرز المحكم من المتشابه من الآيات',
                '6. الاستنتاج والاستنباط والتأويل'
              ];

        for (let i = 1; i <= 6; i++) {
            const hEl = document.getElementById(`header-${i}`);
            if (hEl) hEl.textContent = headers[i - 1];
        }

        const showCard = (lvl, html) => {
            const card = document.getElementById(`card-${lvl}`);
            const body = document.getElementById(`content-${lvl}`);
            if (!card || !body) return;
            if (currentLevel === 'all' || currentLevel === String(lvl)) {
                card.style.display = 'block';
                body.innerHTML = html;
            } else {
                card.style.display = 'none';
            }
        };

        // Level 1
        showCard(1, isEn ? `
            <p><strong>Searched Term:</strong> ${query}</p>
            <p><strong>Lexical Base:</strong> <span style="color:#6b1d2f;font-weight:800;">(${root})</span></p>
            <p style="margin-top:8px;color:#475569;">Core semantic root connecting all Quranic contexts of this term.</p>
        ` : `
            <p><strong>الكلمة المبحوثة:</strong> ${query}</p>
            <p><strong>الجذر اللغوي المستخلص:</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.2rem;">(${root})</span></p>
            <table class="deriv-table">
                <thead>
                    <tr><th>الصيغة الصرفية</th><th>اللفظ القياسي</th><th>الدلالة الوظيفية</th></tr>
                </thead>
                <tbody>
                    <tr><td>الفعل الماضي</td><td><strong>${derivations.past}</strong></td><td>الثبوت والتحقق</td></tr>
                    <tr><td>الفعل المضارع</td><td><strong>${derivations.present}</strong></td><td>التجدد والاستمرار</td></tr>
                    <tr><td>المصدر / الاسم</td><td><strong>${derivations.masdar}</strong></td><td>الحدث المجرد والمعنى الكلي</td></tr>
                    <tr><td>اسم الفاعل</td><td><strong>${derivations.activePart}</strong></td><td>من قام بالفعل واتصف به</td></tr>
                    <tr><td>اسم المفعول</td><td><strong>${derivations.passivePart}</strong></td><td>ما وقع عليه أثر الفعل</td></tr>
                </tbody>
            </table>
        `);

        // Level 2
        const sampleVerses = verses.slice(0, 20);
        showCard(2, verses.length === 0
            ? `<p>${isEn ? 'No direct matches found in the Quran. Try another singular term.' : 'لم يتم العثور على مطابقات نصية مباشرة. جرب البحث بصيغة مفردة.'}</p>`
            : `<p style="margin-bottom:10px;font-weight:700;color:var(--primary);">${isEn ? `Total Occurrences: ${verses.length} verses` : `إجمالي المواضع القرآنية: ${verses.length} آية`}</p>`
              + sampleVerses.map(v => buildAyahHtml(v, derivations.searchTokens, lang)).join('')
        );

        // Level 3: Torah & Gospel
        const bibleSearchUrl = `https://www.biblegateway.com/quicksearch/?quicksearch=${encodeURIComponent(query)}&version=${isEn ? 'NIV' : 'NAV'}`;
        showCard(3, isEn ? `
            <div class="deriv-group-title">Comparative Study with Previous Scriptures (Torah & Gospel)</div>
            <p>Compare the semantic usage of <strong>"${query}"</strong> across the Old and New Testaments to trace continuity and textual alterations:</p>
            <p style="margin-top:10px;"><a href="${bibleSearchUrl}" target="_blank" rel="noopener" class="sunnah-link-btn">Search "${query}" in Old & New Testaments ↗</a></p>
        ` : `
            <div class="deriv-group-title">المقارنة المنهجية مع العهد القديم والجديد (التوراة والإنجيل)</div>
            <p>لتحرير دلالة لفظ <strong>«${query}»</strong> ومقارنتها بما ورد في الكتب السابقة وكشف مواطن الاتفاق أو التحريف:</p>
            <p style="margin-top:10px;"><a href="${bibleSearchUrl}" target="_blank" rel="noopener" class="sunnah-link-btn">استقراء لفظ «${query}» في التوراة والإنجيل ↗</a></p>
        `);

        // Level 4: Sunnah.com & Mishnah
        const sunnahSearchUrl = `https://sunnah.com/search?q=${encodeURIComponent(query)}`;
        const sefariaSearchUrl = `https://www.sefaria.org/search?q=${encodeURIComponent(query)}&tab=text&tpathFilters=Mishnah`;
        const hadithsHtml = hadiths.length > 0
            ? hadiths.map(h => `
                <div class="verse-box">
                    <div class="verse-text" style="font-size:1.08rem;line-height:1.85;">${highlightMatch(h.text, [query], lang)}</div>
                    <div class="verse-meta">
                        <span>[${h.bookName} — ${isEn ? 'Hadith' : 'حديث رقم'} ${h.hadithNumber}]</span>
                        <a href="${h.url}" target="_blank" rel="noopener" class="sunnah-badge-link">Sunnah.com ↗</a>
                    </div>
                </div>
            `).join('')
            : `<p style="margin-bottom:10px;">${isEn ? `Direct search on Sunnah.com for "${query}":` : `للاطلاع على كافة الروايات في الكتب التسعة على موقع Sunnah.com للفظ «${query}»:`}</p>`;

        showCard(4, `
            <div class="deriv-group-title">${isEn ? 'First: Sunnah.com Collections (The Nine Books)' : 'أولاً: المرويات في دواوين السنة (معتمد Sunnah.com)'}</div>
            ${hadithsHtml}
            <p style="margin-bottom:14px;"><a href="${sunnahSearchUrl}" target="_blank" rel="noopener" class="sunnah-link-btn">${isEn ? `Open Full Results on Sunnah.com ↗` : `فتح جميع نتائج «${query}» في Sunnah.com ↗`}</a></p>

            <div class="deriv-group-title">${isEn ? 'Second: Talmud & Mishnah' : 'ثانياً: ما ورد في التلمود (المشنا)'}</div>
            <p>${isEn ? `Cross-reference "${query}" in Mishnah texts:` : `مقارنة الموروث الروائي بما ورد في المشنا التلمودية حول لفظ «${query}»:`}</p>
            <p style="margin-top:8px;"><a href="${sefariaSearchUrl}" target="_blank" rel="noopener" class="sunnah-link-btn">${isEn ? 'Search in Mishnah ↗' : 'البحث في المشنا ↗'}</a></p>
        `);

        // Level 5: Muhkam vs Mutashabih (Meccan & Medinan)
        const makkiVerses = verses.filter(v => v.revelationType === 'مكية' || v.revelationType === 'Meccan');
        const madaniVerses = verses.filter(v => v.revelationType === 'مدنية' || v.revelationType === 'Medinan');
        showCard(5, `
            <div class="deriv-group-title">${isEn ? `Meccan Verses (${makkiVerses.length}) — Foundational Principles (Muhkam)` : `أولاً: الآيات المكية (${makkiVerses.length} آية) — التأسيس والمحكمات`}</div>
            ${makkiVerses.slice(0, 5).map(v => buildAyahHtml(v, derivations.searchTokens, lang)).join('') || `<p>${isEn ? 'No Meccan verses matched.' : 'لا توجد مواضع مكية مطابقة.'}</p>`}

            <div class="deriv-group-title">${isEn ? `Medinan Verses (${madaniVerses.length}) — Legislation & Contextual Application` : `ثانياً: الآيات المدنية (${madaniVerses.length} آية) — التفصيل والتنزيل العملي`}</div>
            ${madaniVerses.slice(0, 5).map(v => buildAyahHtml(v, derivations.searchTokens, lang)).join('') || `<p>${isEn ? 'No Medinan verses matched.' : 'لا توجد مواضع مدنية مطابقة.'}</p>`}
        `);

        // Level 6: Deduction & Interpretation
        showCard(6, isEn ? `
            <div class="stage6-directive">
                Methodical contemplation of <strong>"${query}"</strong> across the Quran and comparative sources reveals the governing Quranic rule (Muhkam) that exposes falsehood and leads to <strong>Righteousness (As-Salah)</strong> and <strong>Salvation (Al-Fawz)</strong>.
            </div>
        ` : `
            <div class="stage6-directive">
                إن استقراء لفظ <strong>«${query}»</strong> وربط محكماته في القرآن الكريم وتنقيته من شوائب الموروث يكشف المعنى الصافي الذي يُعرّي الباطل، ويُثمر <strong>الصلاح</strong> في الفهم والسلوك، ويُحقق <strong>الفوز</strong> في الدنيا والآخرة.
            </div>
        `);
    }
});
