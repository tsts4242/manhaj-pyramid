renderActiveLevel(currentData);
            }
        });
    });

    function stopAyahAudio() {
        if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.textContent = UI_TEXT[currentLang].listenAyah;
            activeAudioBtn.classList.remove('playing');
            activeAudioBtn = null;
        }
    }

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

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopAyahAudio();
            stopSpeech();
            if (input) input.value = '';
            currentData = null;
            if (resultsWrapper) resultsWrapper.style.display = 'none';
            if (loader) loader.style.display = 'none';
            levelBtns.forEach(b => b.classList.remove('active'));
            if (input) input.focus();
        });
    }

    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) return;
            if (isSpeaking) {
                stopSpeech();
                return;
            }
            const visibleCard = document.getElementById(`card-${currentLevel}`);
            const text = visibleCard ? visibleCard.innerText.trim() : '';
            if (!text) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = currentLang === 'ar' ? 'ar-SA' : (currentLang === 'fr' ? 'fr-FR' : 'en-US');
            u.onend = () => stopSpeech();
            u.onerror = () => stopSpeech();
            isSpeaking = true;
            listenBtn.classList.add('speaking');
            listenBtn.textContent = 'إيقاف';
            window.speechSynthesis.speak(u);
        });
    }

    function detectLanguage(text) {
        if (/[؀-ۿ]/.test(text)) return 'ar';
        if (/[éèêëàâîïôûùüçœæ]/i.test(text) || /(tion|ment|ance|ence|eux|euse|ique)$/i.test(text.trim())) return 'fr';
        return 'en';
    }

    function normalizeArabic(str) {
        return str
            ? str.replace(/[ً-ٰٟـ]/g, '')
                 .replace(/[إأآٱ]/g, 'ا')
                 .replace(/ى/g, 'ي')
                 .replace(/ؤ/g, 'ء')
                 .replace(/ئ/g, 'ء')
            : '';
    }

    function highlightExactWord(text, term, lang) {
        if (!text || !term) return text;
        const cleanTerm = term.trim();
        if (!cleanTerm) return text;

        if (lang === 'ar') {
            const normTarget = normalizeArabic(cleanTerm);
            return text.split(/(\s+)/).map(tok => {
                if (/^\s+$/.test(tok)) return tok;
                const bare = normalizeArabic(tok).replace(/[^ء-ي]/g, '');
                if (bare === normTarget || bare === 'ال' + normTarget || bare === 'و' + normTarget || bare === 'ف' + normTarget || bare === 'ب' + normTarget || bare === 'ل' + normTarget) {
                    return `<span class="hl-term">${tok}</span>`;
                }
                return tok;
            }).join('');
        } else {
            const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
            return text.replace(regex, '<span class="hl-term">$1</span>');
        }
    }

    function getArabicRoot(word) {
        let w = normalizeArabic(word).split(/\s+/)[0] || '';
        w = w.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        w = w.replace(/(ون|ين|ات|ان|تان|تين|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');
        if (w.length > 3 && /^[يتنأ]/.test(w)) w = w.slice(1);
        const letters = w.split('').slice(0, 3);
        return letters.join(' ');
    }

    async function fetchQuranVerses(term, lang) {
        const results = [];
        try {
            if (lang === 'ar') {
                const clean = term.replace(/[ً-ٰٟ]/g, '').trim();
                const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(clean)}/all/quran-simple-clean`);
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    for (const m of json.data.matches) {
                        results.push({
                            number: m.number,
                            surahName: m.surah.name,
                            surahNumber: m.surah.number,
                            ayahNumber: m.numberInSurah,
                            revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                            arText: m.text,
                            transText: ''
                        });
                    }
                }
            } else {
                const edition = lang === 'fr' ? 'fr.hamidullah' : 'en.sahih';
                const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(term)}/all/${edition}`);
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    for (const m of json.data.matches) {
                        results.push({
                            number: m.number,
                            surahName: m.surah.englishName,
                            surahNumber: m.surah.number,
                            ayahNumber: m.numberInSurah,
                            revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                            arText: '',
                            transText: m.text
                        });
                    }
                }
            }
        } catch (e) {}
        return results;
    }

    async function fetchScriptures(term, lang) {
        const items = [];
        const books = [
            { id: 'Genesis', nameAr: 'سفر التكوين', nameEn: 'Genesis', nameFr: 'Genèse', type: 'torah' },
            { id: 'Exodus', nameAr: 'سفر الخروج', nameEn: 'Exodus', nameFr: 'Exode', type: 'torah' },
            { id: 'Psalms', nameAr: 'سفر المزامير', nameEn: 'Psalms', nameFr: 'Psaumes', type: 'zabur' },
            { id: 'Matthew', nameAr: 'إنجيل متى', nameEn: 'Matthew', nameFr: 'Matthieu', type: 'injil' },
            { id: 'John', nameAr: 'إنجيل يوحنا', nameEn: 'John', nameFr: 'Jean', type: 'injil' }
        ];
        try {
            const q = encodeURIComponent(term);
            const res = await fetch(`https://bible-api.com/${q}`);
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.verses)) {
                    for (const v of data.verses) {
                        items.push({
                            book: v.book_name,
                            chapter: v.chapter,
                            verse: v.verse,
                            text: v.text,
                            type: v.book_name.toLowerCase().includes('psalm') ? 'zabur' : 'injil'
                        });
                    }
                }
            }
        } catch (e) {}

        if (items.length === 0) {
            const sampleBook = books[0];
            const bName = lang === 'ar' ? sampleBook.nameAr : (lang === 'fr' ? sampleBook.nameFr : sampleBook.nameEn);
            items.push({
                book: bName,
                chapter: 1,
                verse: 1,
                text: lang === 'ar'
                    ? `مرجع استقرائي للفظ (${term}) في الأسفار السابقة للبحث والمقارنة.`
                    : `Scriptural reference for (${term}) in previous scriptures for comparative study.`,
                type: 'torah',
                externalUrl: `https://www.biblegateway.com/quicksearch/?quicksearch=${encodeURIComponent(term)}`
            });
        }
        return items;
    }

    async function fetchSunnahAndTalmud(term, lang) {
        const sunnah = [];
        const talmud = [];

        const collections = [
            { ar: 'صحيح البخاري', en: 'Sahih al-Bukhari', fr: 'Sahih al-Bukhari', slug: 'bukhari' },
            { ar: 'صحيح مسلم', en: 'Sahih Muslim', fr: 'Sahih Muslim', slug: 'muslim' },
            { ar: 'مسند الربيع بن حبيب', en: 'Musnad al-Rabi ibn Habib', fr: 'Musnad al-Rabi', slug: 'musnad-al-rabi' },
            { ar: 'موطأ مالك', en: 'Muwatta Malik', fr: 'Muwatta Malik', slug: 'malik' },
            { ar: 'سنن أبي داود', en: 'Sunan Abi Dawud', fr: 'Sunan Abi Dawud', slug: 'abudawud' },
            { ar: 'جامع الترمذي', en: 'Jami at-Tirmidhi', fr: 'Jami at-Tirmidhi', slug: 'tirmidhi' }
        ];

        try {
            const res = await fetch(`https://www.sefaria.org/api/search-wrapper?q=${encodeURIComponent(term)}&size=8`);
            if (res.ok) {
                const json = await res.json();
                const hits = (json && json.hits && json.hits.hits) ? json.hits.hits : [];
                for (const h of hits) {
                    const src = h._source || {};
                    const ref = src.ref || '';
                    let cat = lang === 'ar' ? 'التلمود البابلي' : (lang === 'fr' ? 'Talmud de Babylone' : 'Babylonian Talmud');
                    if (ref.toLowerCase().includes('yerushalmi')) {
                        cat = lang === 'ar' ? 'التلمود الفلسطيني' : (lang === 'fr' ? 'Talmud de Jérusalem' : 'Jerusalem Talmud');
                    } else if (ref.toLowerCase().includes('mishnah')) {
                        cat = lang === 'ar' ? 'المشنا' : (lang === 'fr' ? 'Mishna' : 'Mishnah');
                    }
                    const txt = (h.highlight && h.highlight.exact && h.highlight.exact[0])
                        ? h.highlight.exact[0].replace(/<[^>]+>/g, '')
                        : (src.exact || ref);
                    talmud.push({
                        category: cat,
                        ref: ref,
                        text: txt,
                        url: `https://www.sefaria.org/${encodeURIComponent(ref.replace(/\s+/g, '_'))}`
                    });
                }
            }
        } catch (e) {}

        if (talmud.length === 0) {
            talmud.push({
                category: lang === 'ar' ? 'المشنا / التلمود البابلي / التلمود الفلسطيني' : 'Mishnah / Babylonian & Jerusalem Talmud',
                ref: term,
                text: lang === 'ar'
                    ? `استقراء مواضع لفظ «${term}» في نصوص المشنا والتلمود البابلي والتلمود الفلسطيني.`
                    : `Occurrences of "${term}" across Mishnah, Babylonian Talmud, and Jerusalem Talmud.`,
                url: `https://www.sefaria.org/search?q=${encodeURIComponent(term)}`
            });
        }

        collections.forEach(c => {
            const bookName = lang === 'ar' ? c.ar : (lang === 'fr' ? c.fr : c.en);
            sunnah.push({
                book: bookName,
                text: lang === 'ar'
                    ? `استقراء روايات لفظ «${term}» في ${bookName} وفق فهرسة Sunnah.com.`
                    : (lang === 'fr'
                        ? `Occurrences du terme « ${term} » dans ${bookName} (indexation Sunnah.com).`
                        : `Occurrences of "${term}" in ${bookName} (Sunnah.com index).`),
                url: `https://sunnah.com/search?q=${encodeURIComponent(term)}`
            });
        });

        return { sunnah, talmud };
    }

    function playAyahAudio(ayahNumber, btn) {
        const t = UI_TEXT[currentLang];
        if (activeAudioBtn === btn && activeAudio) {
            stopAyahAudio();
            return;
        }
        stopAyahAudio();

        let reciter = 'ar.husary';
        if (currentRiwayah === 'qaloon') reciter = 'ar.husarymujawwad';
        if (currentRiwayah === 'warsh') reciter = 'ar.ibrahimakhbar';

        const audioUrl = `https://cdn.islamic.network/quran/audio/64/${reciter}/${ayahNumber}.mp3`;
        const audio = new Audio(audioUrl);
        activeAudio = audio;
        activeAudioBtn = btn;
        btn.textContent = t.stopAyah;
        btn.classList.add('playing');

        audio.play().catch(() => {
            const fallback = new Audio(`https://cdn.islamic.network/quran/audio/64/ar.husary/${ayahNumber}.mp3`);
            activeAudio = fallback;
            fallback.play().catch(() => stopAyahAudio());
            fallback.onended = () => stopAyahAudio();
        });

        audio.onended = () => stopAyahAudio();
    }

    async function executeSearch() {
        const raw = input ? input.value.trim() : '';
        if (!raw) return;

        stopAyahAudio();
        stopSpeech();

        currentLang = detectLanguage(raw);
        if (resultsWrapper) resultsWrapper.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        setActiveLevelButton('1');

        const [verses, scriptures, heritage] = await Promise.all([
            fetchQuranVerses(raw, currentLang),
            fetchScriptures(raw, currentLang),
            fetchSunnahAndTalmud(raw, currentLang)
        ]);

        currentData = {
            term: raw,
            lang: currentLang,
            root: currentLang === 'ar' ? getArabicRoot(raw) : raw.toLowerCase(),
            verses,
            scriptures,
            heritage
        };

        if (loader) loader.style.display = 'none';
        if (resultsWrapper) {
            resultsWrapper.style.display = 'flex';
            resultsWrapper.dir = UI_TEXT[currentLang].dir;
        }
        renderActiveLevel(currentData);
    }

    function renderActiveLevel(data) {
        const t = UI_TEXT[data.lang];
        for (let i = 1; i <= 6; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) {
                card.style.display = String(i) === currentLevel ? 'block' : 'none';
                const header = card.querySelector('.level-header');
                if (header) header.textContent = t.levels[i];
            }
        }

        const contentEl = document.getElementById(`content-${currentLevel}`);
        if (!contentEl) return;

        if (currentLevel === '1') {
            contentEl.innerHTML = `
                <p><strong>${t.wordLabel}</strong> ${data.term}</p>
                <p><strong>${t.rootLabel}</strong> <span style="color:#6b1d2f;font-weight:800;">(${data.root})</span></p>
                <p><strong>${t.quranCount}</strong> ${data.verses.length} ${t.times}</p>
            `;
        } else if (currentLevel === '2') {
            if (!data.verses.length) {
                contentEl.innerHTML = `<p>${t.noVerses}</p>`;
                return;
            }
            contentEl.innerHTML = `
                <p style="margin-bottom:10px;font-weight:700;">${t.quranCount} ${data.verses.length} ${t.times}</p>
                ${data.verses.map(v => {
                    const displayTxt = data.lang === 'ar' ? v.arText : v.transText;
                    const badgeClass = v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani';
                    const badgeLabel = v.revelationType === 'makki' ? t.makki : t.madani;
                    return `
                        <div class="verse-box">
                            <div class="verse-text">﴿ ${highlightExactWord(displayTxt, data.term, data.lang)} ﴾</div>
                            <div class="verse-meta">
                                <span>${v.surahName} — ${v.ayahNumber}</span>
                                <span class="surah-type-badge ${badgeClass}">${badgeLabel}</span>
                                <button type="button" class="ayah-audio-btn" data-ayah="${v.number}">${t.listenAyah}</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
            contentEl.querySelectorAll('.ayah-audio-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    playAyahAudio(btn.dataset.ayah, btn);
                });
            });
        } else if (currentLevel === '3') {
            contentEl.innerHTML = data.scriptures.map(s => `
                <div class="verse-box">
                    <div class="verse-text">${highlightExactWord(s.text, data.term, data.lang)}</div>
                    <div class="verse-meta">
                        <span>${s.book} (${s.chapter}:${s.verse})</span>
                        <span class="surah-type-badge surah-makki">${t[s.type] || s.type}</span>
                        ${s.externalUrl ? `<a href="${s.externalUrl}" target="_blank" rel="noopener" class="sunnah-link">BibleGateway ↗</a>` : ''}
                    </div>
                </div>
            `).join('');
        } else if (currentLevel === '4') {
            const sunnahHtml = data.heritage.sunnah.map(h => `
                <div class="verse-box">
                    <div class="verse-text">${highlightExactWord(h.text, data.term, data.lang)}</div>
                    <div class="verse-meta">
                        <span class="surah-type-badge surah-madani">${h.book}</span>
                        <a href="${h.url}" target="_blank" rel="noopener" class="sunnah-link">${t.sourceBtn}</a>
                    </div>
                </div>
            `).join('');

            const talmudHtml = data.heritage.talmud.map(m => `
                <div class="verse-box">
                    <div class="verse-text">${highlightExactWord(m.text, data.term, data.lang)}</div>
                    <div class="verse-meta">
                        <span class="surah-type-badge surah-makki">${m.category}</span>
                        <span>${m.ref}</span>
                        <a href="${m.url}" target="_blank" rel="noopener" class="sunnah-link">Sefaria ↗</a>
                    </div>
                </div>
            `).join('');

            contentEl.innerHTML = `
                <div class="deriv-group-title">${t.sunnahTitle}</div>
                ${sunnahHtml}
                <div class="deriv-group-title">${t.talmudTitle}</div>
                ${talmudHtml}
            `;
        } else if (currentLevel === '5') {
            const makki = data.verses.filter(v => v.revelationType === 'makki');
            const madani = data.verses.filter(v => v.revelationType === 'madani');
            contentEl.innerHTML = `
                <div class="deriv-group-title">${t.makkiSection} (${makki.length})</div>
                ${makki.map(v => `
                    <div class="verse-box">
                        <div class="verse-text">﴿ ${highlightExactWord(data.lang === 'ar' ? v.arText : v.transText, data.term, data.lang)} ﴾</div>
                        <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                    </div>
                `).join('')}
                <div class="deriv-group-title">${t.madaniSection} (${madani.length})</div>
                ${madani.map(v => `
                    <div class="verse-box">
                        <div class="verse-text">﴿ ${highlightExactWord(data.lang === 'ar' ? v.arText : v.transText, data.term, data.lang)} ﴾</div>
                        <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                    </div>
                `).join('')}
            `;
        } else if (currentLevel === '6') {
            contentEl.innerHTML = `
                <div class="stage6-directive">
                    <strong>${t.wordLabel} «${data.term}»</strong><br>
                    ${t.stage6Note}
                </div>
            `;
        }
    }

    if (submitBtn) submitBtn.addEventListener('click', executeSearch);
    if (input) {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') executeSearch();
        });
    }
});

