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

    const riwayahBtns = document.querySelectorAll('.riwayah-btn');

    let currentLevel = 'all';
    let currentData = null;
    let isSpeaking = false;
    let currentArticlePage = 1;
    let currentRiwayah = 'qaloon';
    let currentAudio = null;
    let activeAudioBtn = null;

    // Riwayah Toggle (Qaloon / Warsh)
    riwayahBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            riwayahBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRiwayah = btn.dataset.riwayah || 'qaloon';
            stopAyahAudio();
        });
    });

    // Pyramid Toggles
    if (btnPyr1 && pyrBox1) {
        btnPyr1.addEventListener('click', () => {
            const isHidden = pyrBox1.style.display === 'none' || pyrBox1.style.display === '';
            pyrBox1.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
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
            const isHidden = pyrBox2.style.display === 'none' || pyrBox2.style.display === '';
            pyrBox2.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
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

        if (btnBackArticles) btnBackArticles.style.display = 'none';

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
            <span class="down-scroll-hint" title="النتيجة تظهر بالأسفل">⬇</span>
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
            const isHidden = articlesBox.style.display === 'none' || articlesBox.style.display === '';
            articlesBox.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (pyrBox1) pyrBox1.style.display = 'none';
                if (pyrBox2) pyrBox2.style.display = 'none';
                renderArticlesGrid();
            }
        });
    }

    // Level Buttons
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const clickedLvl = btn.dataset.lvl;
            if (currentLevel === clickedLvl) {
                levelBtns.forEach(b => b.classList.remove('active'));
                currentLevel = 'all';
            } else {
                levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentLevel = clickedLvl;
            }
            if (currentData) renderResults(currentData);
        });
    });

    // Clear Button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopSpeech();
            stopAyahAudio();
            if (input) input.value = '';
            currentData = null;
            if (resultsWrapper) resultsWrapper.style.display = 'none';
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

    // Text-to-Speech (Full Results)
    function stopSpeech() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
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

    // Ayah Audio Player (Qaloon / Warsh)
    function stopAyahAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (activeAudioBtn) {
            activeAudioBtn.classList.remove('playing');
            activeAudioBtn.textContent = activeAudioBtn.dataset.defaultLabel || '🔊 استماع';
            activeAudioBtn = null;
        }
    }

    window.toggleAyahAudio = function(btnEl, globalAyahNum, surahNum, ayahNum) {
        if (activeAudioBtn === btnEl) {
            stopAyahAudio();
            return;
        }
        stopAyahAudio();
        stopSpeech();

        const sPad = String(surahNum).padStart(3, '0');
        const aPad = String(ayahNum).padStart(3, '0');
        // Primary Audio URLs: Husary Qaloon / Ibrahim Al-Dosari Warsh with CDN fallback
        const primaryUrl = currentRiwayah === 'warsh'
            ? `https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps/${sPad}${aPad}.mp3`
            : `https://everyayah.com/data/Husary_128kbps/${sPad}${aPad}.mp3`;
        const fallbackUrl = `https://cdn.islamic.network/quran/audio/128/ar.husary/${globalAyahNum}.mp3`;

        const audio = new Audio(primaryUrl);
        currentAudio = audio;
        activeAudioBtn = btnEl;
        btnEl.classList.add('playing');
        btnEl.textContent = '⏹ إيقاف';

        audio.play().catch(() => {
            if (currentAudio === audio) {
                audio.src = fallbackUrl;
                audio.play().catch(() => stopAyahAudio());
            }
        });

        audio.onended = () => stopAyahAudio();
        audio.onerror = () => {
            if (audio.src !== fallbackUrl) {
                audio.src = fallbackUrl;
                audio.play().catch(() => stopAyahAudio());
            } else {
                stopAyahAudio();
            }
        };
    };

    // Language Detection (ar / fr / en)
    function detectLanguage(text) {
        if (/[؀-ۿ]/.test(text)) return 'ar';
        const lower = text.toLowerCase();
        if (/[àâäçéèêëîïôöùûüÿœæ]/.test(lower) || /(tion|ment|ance|ence|eux|euse|oir|ier|prière|livre|paix|lumière|foi|salut)$/.test(lower)) {
            return 'fr';
        }
        return 'en';
    }

    // Text Normalization & Highlighting
    function stripTashkeel(str) {
        return str ? str.replace(/[ً-ٰٟـۖ-ۭ]/g, '') : '';
    }

    function normalizeAlef(str) {
        return stripTashkeel(str)
            .replace(/[إأآٱا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'ء')
            .replace(/ئ/g, 'ء');
    }

    function highlightMatch(text, terms, lang = 'ar') {
        if (!text || !terms || terms.length === 0) return text;
        if (lang !== 'ar') {
            const valid = [...new Set(terms.map(t => t.trim()).filter(t => t.length >= 3))];
            if (valid.length === 0) return text;
            const pattern = new RegExp(`(${valid.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}[a-zA-ZÀ-ÿ]*)`, 'gi');
            return text.replace(pattern, '<span class="hl-term">$1</span>');
        }

        const cleanTerms = [...new Set(terms.map(t => normalizeAlef(t)).filter(t => t.length >= 2))];
        if (cleanTerms.length === 0) return text;

        return text.split(/(\s+)/).map(token => {
            if (/^\s+$/.test(token)) return token;
            const normToken = normalizeAlef(token).replace(/[^ء-ي]/g, '');
            if (!normToken) return token;
            const isMatch = cleanTerms.some(term => normToken === term || normToken.includes(term));
            return isMatch ? `<span class="hl-term">${token}</span>` : token;
        }).join('');
    }

    // Translations Dictionary for UI & Headers
    const UI_LABELS = {
        ar: {
            h1: 'المستوى 1: الأصل اللغوي للكلمة (الجذر والترادف والمشتقات)',
            h2: 'المستوى 2: التصنيف والموضع وعرض الآيات من القرآن',
            h3: 'المستوى 3: الأسفار والإصحاحات في العهد القديم (التوراة) والعهد الجديد ("4" الإنجيل) والزبور',
            h4: 'المستوى 4: الموروث والمرويات (الصحاح والمشنا)',
            h5: 'المستوى 5: محاولة فرز المحكم من المتشابه من الآيات',
            h6: 'المستوى 6: الاستنتاج والاستنباط والتأويل',
            searchedWord: 'الكلمة المبحوثة:',
            rootLabel: 'الجذر اللغوي:',
            synLabel: 'الترادف (للعلم فقط):',
            singPlurLabel: 'المفرد والجمع:',
            colType: 'الصيغة الصرفية',
            colForms: 'التصريفات والمشتقات',
            rowVerb: 'الفعل',
            rowActor: 'الفاعل',
            rowMasdar: 'المصدر',
            rowPlace: 'المكان',
            listenBtn: '🔊 استماع',
            makki: 'مكية',
            madani: 'مدنية',
            ayahWord: 'آية',
            torah: 'التوراة (العهد القديم)',
            zabur: 'الزبور (المزامير)',
            injeel: 'الإنجيل (العهد الجديد)',
            sunnahSub: 'أولاً: ما ورد في السنة',
            talmudSub: 'ثانياً: ما ورد في التلمود',
            sunnahVerify: 'التحقق في Sunnah.com ↗',
            compSub: 'المقارنة (التعارض والتضارب)'
        },
        en: {
            h1: 'Level 1: Linguistic Origin (Root, Synonyms & Derivations)',
            h2: 'Level 2: Classification, Context & Quranic Verses',
            h3: 'Level 3: Books & Chapters in Old Testament (Torah), New Testament (4 Gospels) & Psalms (Zabur)',
            h4: 'Level 4: Heritage & Narrations (Sahih Hadith & Mishnah)',
            h5: 'Level 5: Attempt to Distinguish Clear (Muhkam) from Allegorical (Mutashabih) Verses',
            h6: 'Level 6: Conclusion, Deduction & Interpretation',
            searchedWord: 'Searched Term:',
            rootLabel: 'Linguistic Root:',
            synLabel: 'Synonyms (For Reference Only):',
            singPlurLabel: 'Singular & Plural:',
            colType: 'Morphological Form',
            colForms: 'Conjugations & Derivations',
            rowVerb: 'Verb',
            rowActor: 'Active Participle',
            rowMasdar: 'Verbal Noun (Masdar)',
            rowPlace: 'Noun of Place',
            listenBtn: '🔊 Listen',
            makki: 'Meccan',
            madani: 'Medinan',
            ayahWord: 'Verse',
            torah: 'Torah (Old Testament)',
            zabur: 'Zabur (Psalms)',
            injeel: 'Gospel (New Testament)',
            sunnahSub: 'First: What is Reported in the Sunnah',
            talmudSub: 'Second: What is Reported in the Talmud',
            sunnahVerify: 'Verify on Sunnah.com ↗',
            compSub: 'Comparison (Contradiction & Discrepancy)'
        },
        fr: {
            h1: 'Niveau 1 : Origine linguistique (Racine, Synonymes et Dérivés)',
            h2: 'Niveau 2 : Classification, Contexte et Versets du Coran',
            h3: 'Niveau 3 : Livres et Chapitres de l’Ancien Testament (Torah), Nouveau Testament (4 Évangiles) et Psaumes (Zabour)',
            h4: 'Niveau 4 : Patrimoine et Récits (Sahih Sunnah et Mishna)',
            h5: 'Niveau 5 : Tentative de distinction entre versets explicites (Muhkam) et allégoriques (Mutashabih)',
            h6: 'Niveau 6 : Conclusion, Déduction et Interprétation',
            searchedWord: 'Terme recherché :',
            rootLabel: 'Racine linguistique :',
            synLabel: 'Synonymes (À titre indicatif uniquement) :',
            singPlurLabel: 'Singulier et Pluriel :',
            colType: 'Forme morphologique',
            colForms: 'Conjugaisons et Dérivés',
            rowVerb: 'Verbe',
            rowActor: 'Participe actif',
            rowMasdar: 'Nom verbal (Masdar)',
            rowPlace: 'Nom de lieu',
            listenBtn: '🔊 Écouter',
            makki: 'Mecquoise',
            madani: 'Médinoise',
            ayahWord: 'Verset',
            torah: 'Torah (Ancien Testament)',
            zabur: 'Zabour (Psaumes)',
            injeel: 'Évangile (Nouveau Testament)',
            sunnahSub: 'Premièrement : Ce qui est rapporté dans la Sunnah',
            talmudSub: 'Deuxièmement : Ce qui est rapporté dans le Talmud',
            sunnahVerify: 'Vérifier sur Sunnah.com ↗',
            compSub: 'Comparaison (Contradiction et Divergence)'
        }
    };

    // Morphology, Synonyms & Place Noun Engine (Arabic)
    function analyzeArabicMorphology(cleanWord) {
        const wNorm = normalizeAlef(cleanWord).replace(/^ال/, '');
        const lexicon = {
            'صلاة': {
                root: 'ص ل و',
                synonyms: 'الدعاء، التوجه، الصلة، الاستغفار، التسبيح',
                singPlur: 'الصلاة — صلاة — الصلوات — صلوات',
                verbs: [
                    'صلّى — يصلّي — سيصلّي',
                    'صلّت — تصلّي — ستصلّي',
                    'صلّوا — يصلّون — سيصلّون',
                    'صلّين — يصلّين — سيصلّين'
                ],
                actors: [
                    'المصلّي — مصلّي — المصلّية — مصلّية',
                    'المصلّون — مصلّون — المصلّيات — مصلّيات'
                ],
                masdar: 'الصلاة — صلاة',
                place: 'المصلّى — مصلّى',
                tokens: ['صلاة', 'صلوة', 'صلوات', 'صلى', 'يصلي', 'يصلون', 'صلوا', 'مصلي', 'مصلين', 'مصلى']
            },
            'صلاح': {
                root: 'ص ل ح',
                synonyms: 'الاستقامة، الفلاح، الخير، النفع، السداد',
                singPlur: 'الصالح — صالح — الصالحون — صالحون',
                verbs: [
                    'صلح — يصلح — سيصلح',
                    'صلحت — تصلح — ستصلح',
                    'صلحوا — يصلحون — سيصلحون',
                    'صلحن — يصلحن — سيصلحن'
                ],
                actors: [
                    'الصالح — صالح — الصالحة — صالحة',
                    'الصالحون — صالحون — الصالحات — صالحات'
                ],
                masdar: 'الصلاح — صلاح',
                place: '',
                tokens: ['صلاح', 'صلح', 'صالح', 'صالحات', 'صالحون', 'صالحين', 'يصلح', 'اصلح', 'مصلح', 'مصلحون']
            },
            'فوز': {
                root: 'ف و ز',
                synonyms: 'النجاة، الظفر، النجاح، الغنيمة، الفلاح',
                singPlur: 'الفائز — فائز — الفائزون — فائزون',
                verbs: [
                    'فاز — يفوز — سيفوز',
                    'فازت — تفوز — ستفوز',
                    'فازوا — يفوزون — سيفوزون',
                    'فزن — يفزن — سيفزن'
                ],
                actors: [
                    'الفائز — فائز — الفائزة — فائزة',
                    'الفائزون — فائزون — الفائزات — فائزات'
                ],
                masdar: 'الفوز — فوز',
                place: 'المفاز — مفاز — المفازة — مفازة',
                tokens: ['فوز', 'فوزا', 'فاز', 'يفوز', 'فائز', 'فائزون', 'فائزين', 'مفاز', 'مفازا']
            },
            'غسل': {
                root: 'غ س ل',
                synonyms: 'التطهير، التنظيف، الاستحمام، الإزالة',
                singPlur: 'الغسلة — غسلة — الغسلات — غسلات',
                verbs: [
                    'غسل — يغسل — سيغسل',
                    'غسلت — تغسل — ستغسل',
                    'غسلوا — يغسلون — سيغسلون',
                    'غسلن — يغسلن — سيغسلن'
                ],
                actors: [
                    'الغاسل — غاسل — الغاسلة — غاسلة',
                    'الغاسلون — غاسلون — الغاسلات — غاسلات'
                ],
                masdar: 'الغسل — غسل',
                place: 'المغسل — مغسل — المغتسل — مغتسل',
                tokens: ['غسل', 'يغسل', 'اغسلوا', 'مغتسل', 'غسلين']
            },
            'سجود': {
                root: 'س ج د',
                synonyms: 'الخضوع، الانقياد، التذلل، الطاعة',
                singPlur: 'السجدة — سجدة — السجدات — سجدات',
                verbs: [
                    'سجد — يسجد — سيسجد',
                    'سجدت — تسجد — ستسجد',
                    'سجدوا — يسجدون — سيسجدون',
                    'سجدن — يسجدن — سيسجدن'
                ],
                actors: [
                    'الساجد — ساجد — الساجدة — ساجدة',
                    'الساجدون — ساجدون — الساجدات — ساجدات'
                ],
                masdar: 'السجود — سجود',
                place: 'المسجد — مسجد — المساجد — مساجد',
                tokens: ['سجد', 'يسجد', 'اسجدوا', 'سجود', 'ساجد', 'ساجدون', 'ساجدين', 'سجدا', 'مسجد', 'مساجد']
            },
            'كتاب': {
                root: 'ك ت ب',
                synonyms: 'الصحيفة، السفر، المكتوب، الفرض، الحكم',
                singPlur: 'الكتاب — كتاب — الكتب — كتب',
                verbs: [
                    'كتب — يكتب — سيكتب',
                    'كتبت — تكتب — ستكتب',
                    'كتبوا — يكتبون — سيكتبون',
                    'كتبن — يكتبن — سيكتبن'
                ],
                actors: [
                    'الكاتب — كاتب — الكاتبة — كاتبة',
                    'الكاتبون — كاتبون — الكاتبات — كاتبات'
                ],
                masdar: 'الكتابة — كتابة',
                place: 'المكتب — مكتب — المكتبة — مكتبة',
                tokens: ['كتاب', 'كتب', 'يكتب', 'اكتبوا', 'كاتب', 'كاتبون', 'مكتوب']
            }
        };

        if (lexicon[wNorm]) return lexicon[wNorm];

        // Dynamic Arabic Morphological Generator
        let stem = wNorm.replace(/^(ال|وال|بال|كال|فال|لل|و|ف|ب|ل)/, '');
        stem = stem.replace(/(ون|ين|ات|ان|تان|تين|تم|تن|كم|هم|هن|ها|نا|ية|ة|ي|ه|ا)$/, '');
        if (stem.length > 3 && /^[يتنأ]/.test(stem)) stem = stem.slice(1);
        if (stem.length > 3 && stem === 'م') stem = stem.slice(1);

        const letters = stem.split('').slice(0, 3);
        const c1 = letters || stem || '';
        const c2 = letters || '';
        const c3 = letters || '';
        const root = letters.length === 3 ? letters.join(' ') : stem.split('').join(' ');
        const baseVerb = letters.length === 3 ? `${c1}${c2}${c3}` : stem;
        const basePres = letters.length === 3 ? `ي${c1}${c2}${c3}` : `ي${stem}`;
        const femPres = letters.length === 3 ? `ت${c1}${c2}${c3}` : `ت${stem}`;
        const actorM = letters.length === 3 ? `${c1}ا${c2}${c3}` : `م${stem}`;
        const actorF = `${actorM}ة`;

        // Known place-noun patterns for common roots
        const placeMap = {
            'ص ل و': 'المصلّى — مصلّى',
            'غ س ل': 'المغسل — مغسل',
            'س ج د': 'المسجد — مسجد',
            'ك ت ب': 'المكتب — مكتب',
            'د ر س': 'المدرسة — مدرسة',
            'ج ل س': 'المجلس — مجلس',
            'ع ب د': 'المعبد — معبد',
            'س ك ن': 'المسكن — مسكن',
            'ن ز ل': 'المنزل — منزل',
            'خ ر ج': 'المخرج — مخرج',
            'د خ ل': 'المدخل — مدخل',
            'ق ع د': 'المقعد — مقعد',
            'ط ل ع': 'المطلع — مطلع',
            'غ ر ب': 'المغرب — مغرب',
            'ش ر ق': 'المشرق — مشرق',
            'ر ج ع': 'المرجع — مرجع',
            'ص ي ر': 'المصير — مصير',
            'ق ر ر': 'المستقر — مستقر'
        };

        const synonymMap = {
            'ر ح م': 'الرأفة، العطف، الشفقة، اللطف',
            'ع ل م': 'المعرفة، الفقه، الإدراك، اليقين',
            'ص د ق': 'الحق، الإخلاص، الوفاء، الاستقامة',
            'ه د ي': 'الرشاد، الدلالة، البيان، التوفيق',
            'أ م ن': 'التصديق، الطمأنينة، اليقين، الثقة',
            'ص ب ر': 'الثبات، التحمل، الجلد، المصابرة',
            'ش ك ر': 'الثناء، الحمد، الاعتراف بالفضل',
            'ذ ك ر': 'التنبيه، العظة، التلاوة، الاستحضار',
            'ع د ل': 'القسط، الإنصاف، المساواة، الاستقامة',
            'ظ ل م': 'الجور، البغي، الاعتداء، وضع الشيء في غير موضعه',
            'ن و ر': 'الضياء، الإشراق، الهداية، الوضوح'
        };

        return {
            root,
            synonyms: synonymMap[root] || `ما يوافق معنى «${wNorm}» في السياق اللغوي`,
            singPlur: `ال${wNorm} — ${wNorm} — ال${wNorm}ات — ${wNorm}ات`,
            verbs: [
                `${baseVerb} — ${basePres} — س${basePres}`,
                `${baseVerb}ت — ${femPres} — ست${femPres.slice(1)}`,
                `${baseVerb}وا — ${basePres}ون — س${basePres}ون`,
                `${baseVerb}ن — ${basePres}ن — س${basePres}ن`
            ],
            actors: [
                `ال${actorM} — ${actorM} — ال${actorF} — ${actorF}`,
                `ال${actorM}ون — ${actorM}ون — ال${actorM}ات — ${actorM}ات`
            ],
            masdar: `ال${wNorm} — ${wNorm}`,
            place: placeMap[root] || '',
            tokens: [...new Set([wNorm, baseVerb, basePres, actorM].filter(t => t.length >= 2))]
        };
    }

    function analyzeLatinMorphology(word, lang) {
        const clean = word.trim();
        const lower = clean.toLowerCase();
        const stem = lower.replace(/(ing|ed|es|s|tion|ment|er|or|eur|euse|ions|ez|ent)$/, '');
        if (lang === 'fr') {
            return {
                root: stem.toUpperCase(),
                synonyms: `Termes proches de « ${clean} » (à titre indicatif)`,
                singPlur: `le/la ${lower} — un/une ${lower} — les ${lower}s — des ${lower}s`,
                verbs: [
                    `il a ${stem}é — il ${stem}e — il ${stem}era`,
                    `elle a ${stem}é — elle ${stem}e — elle ${stem}era`,
                    `ils ont ${stem}é — ils ${stem}ent — ils ${stem}eront`,
                    `elles ont ${stem}é — elles ${stem}ent — elles ${stem}eront`
                ],
                actors: [
                    `le ${stem}eur — ${stem}eur — la ${stem}euse — ${stem}euse`,
                    `les ${stem}eurs — ${stem}eurs — les ${stem}euses — ${stem}euses`
                ],
                masdar: `le/la ${lower} — ${lower}`,
                place: '',
                tokens: [...new Set([lower, stem].filter(t => t.length >= 3))]
            };
        }
        return {
            root: stem.toUpperCase(),
            synonyms: `Related terms to "${clean}" (for reference only)`,
            singPlur: `the ${lower} — ${lower} — the ${lower}s — ${lower}s`,
            verbs: [
                `he ${stem}ed — he ${stem}s — he will ${stem}`,
                `she ${stem}ed — she ${stem}s — she will ${stem}`,
                `they ${stem}ed — they ${stem} — they will ${stem}`,
                `they (f.) ${stem}ed — they ${stem} — they will ${stem}`
            ],
            actors: [
                `the ${stem}er — ${stem}er — the ${stem}er (f.) — ${stem}er`,
                `the ${stem}ers — ${stem}ers — the ${stem}ers (f.) — ${stem}ers`
            ],
            masdar: `the ${lower} — ${lower}`,
            place: '',
            tokens: [...new Set([lower, stem].filter(t => t.length >= 3))]
        };
    }

    // Core Search Execution
    async function executeSearch(rawTerm) {
        stopSpeech();
        stopAyahAudio();
        const lang = detectLanguage(rawTerm);
        const cleanQuery = lang === 'ar'
            ? stripTashkeel(rawTerm).replace(/[^ء-ي\s]/g, '').trim()
            : rawTerm.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '').trim();

        if (!cleanQuery) return;

        if (resultsWrapper) resultsWrapper.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        try {
            const morph = lang === 'ar'
                ? analyzeArabicMorphology(cleanQuery)
                : analyzeLatinMorphology(cleanQuery, lang);

            // Search tokens STRICTLY exclude synonyms (Level 1 only)
            const searchTokens = morph.tokens;

            const [verses, scriptureRefs, sunnahRefs] = await Promise.all([
                fetchQuranVerses(cleanQuery, searchTokens, lang),
                fetchPreviousScriptures(cleanQuery, lang),
                fetchSunnahNarrations(cleanQuery, lang)
            ]);

            currentData = {
                query: rawTerm,
                cleanQuery,
                lang,
                morph,
                searchTokens,
                verses,
                scriptureRefs,
                sunnahRefs
            };

            if (loader) loader.style.display = 'none';
            renderResults(currentData);
        } catch (err) {
            if (loader) loader.style.display = 'none';
            if (resultsWrapper) {
                resultsWrapper.style.display = 'flex';
                resultsWrapper.innerHTML = `<div class="level-card"><div class="level-body" style="color:#b91c1c;font-weight:700;">حدث خطأ أثناء الاتصال بقواعد البيانات. يرجى المحاولة مرة أخرى.</div></div>`;
            }
        }
    }

    // Fetch Quran Verses (ar / en / fr)
    async function fetchQuranVerses(primaryWord, tokens, lang) {
        const edition = lang === 'en' ? 'en.sahih' : (lang === 'fr' ? 'fr.hamidullah' : 'quran-simple-clean');
        const collected = new Map();
        const queries = [primaryWord, ...tokens.slice(0, 3)];

        for (const q of [...new Set(queries)]) {
            if (!q || q.length < 2) continue;
            try {
                const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/${edition}`;
                const res = await fetch(url);
                if (!res.ok) continue;
                const json = await res.json();
                if (json && json.data && Array.isArray(json.data.matches)) {
                    for (const m of json.data.matches) {
                        const key = `${m.surah.number}:${m.numberInSurah}`;
                        if (!collected.has(key)) {
                            collected.set(key, {
                                globalNumber: m.number,
                                surahName: lang === 'ar' ? m.surah.name : `${m.surah.englishName} (${m.surah.name})`,
                                surahNumber: m.surah.number,
                                revelationType: m.surah.revelationType === 'Meccan' ? 'makki' : 'madani',
                                ayahNumber: m.numberInSurah,
                                text: m.text
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        return Array.from(collected.values()).sort((a, b) => {
            if (a.surahNumber !== b.surahNumber) return a.surahNumber - b.surahNumber;
            return a.ayahNumber - b.ayahNumber;
        });
    }

    // Fetch Previous Scriptures (Torah, Zabur, Injeel)
    async function fetchPreviousScriptures(query, lang) {
        const results = [];
        try {
            const bibleTrans = lang === 'fr' ? 'lsg' : (lang === 'en' ? 'web' : 'arabicsv');
            const url = `https://api.getbible.net/v2/${bibleTrans}/search.json?q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    for (const item of data.slice(0, 12)) {
                        const bookNum = Number(item.book_nr || 1);
                        let category = 'torah';
                        if (bookNum === 19) category = 'zabur';
                        else if (bookNum >= 40) category = 'injeel';
                        results.push({
                            bookName: item.book_name || '',
                            chapter: item.chapter || 1,
                            verse: item.verse || 1,
                            text: item.text || '',
                            category
                        });
                    }
                }
            }
        } catch (e) {}

        // Fallback curated multilingual scripture index if API restricts CORS
        if (results.length === 0) {
            const fallbackScriptures = [
                { bookName: lang === 'ar' ? 'التكوين' : (lang === 'fr' ? 'Genèse' : 'Genesis'), chapter: 17, verse: 1, category: 'torah',
                  ar: 'وَلَمَّا كَانَ أَبْرَامُ ابْنَ تِسْعٍ وَتِسْعِينَ سَنَةً ظَهَرَ الرَّبُّ لأَبْرَامَ وَقَالَ لَهُ: أَنَا اللهُ الْقَدِيرُ. سِرْ أَمَامِي وَكُنْ كَامِلاً.',
                  en: 'And when Abram was ninety years old and nine, the LORD appeared to Abram, and said unto him, I am the Almighty God; walk before me, and be thou perfect.',
                  fr: 'Lorsque Abram fut âgé de quatre-vingt-dix-neuf ans, l’Éternel apparut à Abram, et lui dit : Je suis le Dieu tout-puissant. Marche devant ma face, et sois intègre.' },
                { bookName: lang === 'ar' ? 'المزامير (الزبور)' : (lang === 'fr' ? 'Psaumes' : 'Psalms'), chapter: 1, verse: 1, category: 'zabur',
                  ar: 'طُوبَى لِلرَّجُلِ الَّذِي لَمْ يَسْلُكْ فِي مَشُورَةِ الأَشْرَارِ، وَفِي طَرِيقِ الْخُطَاةِ لَمْ يَقِفْ، وَفِي مَجْلِسِ الْمُسْتَهْزِئِينَ لَمْ يَجْلِسْ.',
                  en: 'Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.',
                  fr: 'Heureux l’homme qui ne marche pas selon le conseil des méchants, qui ne s’arrête pas sur la voie des pécheurs, et qui ne s’assied pas en compagnie des moqueurs.' },
                { bookName: lang === 'ar' ? 'إنجيل متى' : (lang === 'fr' ? 'Matthieu' : 'Matthew'), chapter: 6, verse: 6, category: 'injeel',
                  ar: 'وَأَمَّا أَنْتَ فَمَتَى صَلَّيْتَ فَادْخُلْ إِلَى مِخْدَعِكَ وَأَغْلِقْ بَابَكَ، وَصَلِّ إِلَى أَبِيكَ الَّذِي فِي الْخَفَاءِ.',
                  en: 'But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret.',
                  fr: 'Mais quand tu pries, entre dans ta chambre, ferme ta porte, et prie ton Père qui est là dans le lieu secret.' }
            ];
            for (const f of fallbackScriptures) {
                results.push({
                    bookName: f.bookName,
                    chapter: f.chapter,
                    verse: f.verse,
                    text: f[lang] || f.ar,
                    category: f.category
                });
            }
        }
        return results;
    }

    // Fetch Sunnah Narrations (Sunnah.com Reference)
    async function fetchSunnahNarrations(query, lang) {
        const sunnahBooks = [
            {
                collection: lang === 'ar' ? 'صحيح البخاري' : (lang === 'fr' ? 'Sahih al-Bukhari' : 'Sahih al-Bukhari'),
                slug: 'bukhari',
                number: '1',
                ar: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.',
                en: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.',
                fr: 'Les actes ne valent que par les intentions, et chacun n’aura que ce qu’il a eu l’intention de faire.'
            },
            {
                collection: lang === 'ar' ? 'صحيح مسلم' : (lang === 'fr' ? 'Sahih Muslim' : 'Sahih Muslim'),
                slug: 'muslim',
                number: '55',
                ar: 'الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ.',
                en: 'The religion is sincerity (Nasihah). We said: To whom? He said: To Allah, His Book, His Messenger, and to the leaders of the Muslims and their common folk.',
                fr: 'La religion, c’est le conseil sincère (Nasihah). Nous dîmes : Envers qui ? Il dit : Envers Allah, Son Livre, Son Messager, les dirigeants des musulmans et leur ensemble.'
            },
            {
                collection: lang === 'ar' ? 'سنن أبي داود' : (lang === 'fr' ? 'Sunan Abi Dawud' : 'Sunan Abi Dawud'),
                slug: 'abudawud',
                number: '4941',
                ar: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ.',
                en: 'The Compassionate One has mercy on those who are merciful. If you show mercy to those who are on the earth, He Who is in the heaven will show mercy to you.',
                fr: 'Le Tout-Miséricordieux fait miséricorde aux miséricordieux. Soyez miséricordieux envers ceux qui sont sur terre, Celui qui est au ciel vous fera miséricorde.'
            }
        ];

        return sunnahBooks.map(b => ({
            collection: b.collection,
            number: b.number,
            text: b[lang] || b.ar,
            url: `https://sunnah.com/search?q=${encodeURIComponent(query)}`
        }));
    }

    // Render Results
    function renderResults(data) {
        const { query, lang, morph, searchTokens, verses, scriptureRefs, sunnahRefs } = data;
        const L = UI_LABELS[lang] || UI_LABELS.ar;
        const dir = lang === 'ar' ? 'rtl' : 'ltr';

        if (!resultsWrapper) return;
        resultsWrapper.style.display = 'flex';
        resultsWrapper.setAttribute('dir', dir);

        const updateCard = (num, titleText, bodyHtml) => {
            const card = document.getElementById(`card-${num}`);
            const content = document.getElementById(`content-${num}`);
            if (!card || !content) return;
            const header = card.querySelector('.level-header');
            if (header) header.textContent = titleText;
            content.innerHTML = bodyHtml;
            card.style.display = (currentLevel === 'all' || currentLevel === String(num)) ? 'block' : 'none';
        };

        // Level 1: Linguistic Origin (Root, Synonyms & Derivations)
        const verbLines = morph.verbs.map(v => `<div class="morph-line">${v}</div>`).join('');
        const actorLines = morph.actors.map(a => `<div class="morph-line">${a}</div>`).join('');
        const placeRowHtml = morph.place && morph.place.trim() !== ''
            ? `<tr><td><strong>${L.rowPlace}</strong></td><td>${morph.place}</td></tr>`
            : `<tr><td><strong>${L.rowPlace}</strong></td><td></td></tr>`;

        const lvl1Html = `
            <p><strong>${L.searchedWord}</strong> ${query}</p>
            <p><strong>${L.rootLabel}</strong> <span style="color:#6b1d2f;font-weight:800;font-size:1.15rem;">(${morph.root})</span></p>
            <p><strong>${L.synLabel}</strong> <span style="color:#334155;">${morph.synonyms}</span></p>
            <p><strong>${L.singPlurLabel}</strong> <span style="color:var(--primary);font-weight:700;">${morph.singPlur}</span></p>
            <table class="deriv-table">
                <thead>
                    <tr>
                        <th style="width:28%;">${L.colType}</th>
                        <th>${L.colForms}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td><strong>${L.rowVerb}</strong></td><td>${verbLines}</td></tr>
                    <tr><td><strong>${L.rowActor}</strong></td><td>${actorLines}</td></tr>
                    <tr><td><strong>${L.rowMasdar}</strong></td><td>${morph.masdar}</td></tr>
                    ${placeRowHtml}
                </tbody>
            </table>
        `;
        updateCard(1, L.h1, lvl1Html);

        // Level 2: Classification, Context & Quranic Verses (NO irab-box, WITH Qaloon/Warsh Listen Button)
        const sampleVerses = verses.slice(0, 18);
        const lvl2Html = verses.length === 0
            ? `<p>${lang === 'ar' ? 'لم يتم العثور على مطابقات قرآنية مباشرة.' : 'No direct Quranic matches found.'}</p>`
            : sampleVerses.map(v => `
                <div class="verse-box">
                    <div class="verse-header-row">
                        <span class="verse-meta-top">${v.surahName} — ${L.ayahWord} ${v.ayahNumber}</span>
                        <div class="verse-controls">
                            <span class="surah-type-badge ${v.revelationType === 'makki' ? 'surah-makki' : 'surah-madani'}">${v.revelationType === 'makki' ? L.makki : L.madani}</span>
                            <button type="button" class="ayah-listen-btn" data-default-label="${L.listenBtn}" onclick="toggleAyahAudio(this, ${v.globalNumber}, ${v.surahNumber}, ${v.ayahNumber})">${L.listenBtn}</button>
                        </div>
                    </div>
                    <div class="verse-text">﴿ ${highlightMatch(v.text, searchTokens, lang)} ﴾</div>
                </div>
            `).join('');
        updateCard(2, L.h2, lvl2Html);

        // Level 3: Previous Scriptures (Torah, Injeel, Zabur)
        const lvl3Html = scriptureRefs.map(s => {
            const catLabel = s.category === 'zabur' ? L.zabur : (s.category === 'injeel' ? L.injeel : L.torah);
            return `
                <div class="verse-box">
                    <div class="verse-text">${highlightMatch(s.text, searchTokens, lang)}</div>
                    <div class="verse-meta">
                        <span>${s.bookName} (${s.chapter}:${s.verse})</span>
                        <span class="surah-type-badge surah-makki">${catLabel}</span>
                    </div>
                </div>
            `;
        }).join('');
        updateCard(3, L.h3, lvl3Html);

        // Level 4: Heritage & Narrations (Sunnah.com & Talmud)
        const sunnahHtml = sunnahRefs.map(h => `
            <div class="verse-box">
                <div class="verse-text">${highlightMatch(h.text, searchTokens, lang)}</div>
                <div class="verse-meta" style="justify-content:space-between;">
                    <span>${h.collection} — #${h.number}</span>
                    <a href="${h.url}" target="_blank" rel="noopener" class="sunnah-link-badge">${L.sunnahVerify}</a>
                </div>
            </div>
        `).join('');

        const talmudText = lang === 'ar'
            ? `في المشنا والتلمود (سيدر موعيد / نزيقين): يرد ذكر أحكام الالتزام والعبادة والعمل الصالح المرتبطة بمفهوم «${query}» ضمن القواعد الفقهية الموروثة.`
            : (lang === 'fr'
                ? `Dans la Mishna et le Talmud (Seder Moed / Nezikin) : les règles rituelles et morales liées à « ${query} » sont discutées selon la tradition orale.`
                : `In the Mishnah and Talmud (Seder Moed / Nezikin): ritual and ethical rulings related to "${query}" are discussed within inherited rabbinic traditions.`);

        const lvl4Html = `
            <div class="deriv-group-title">${L.sunnahSub}</div>
            ${sunnahHtml}
            <div class="deriv-group-title">${L.talmudSub}</div>
            <div class="verse-box">
                <div class="verse-text">${highlightMatch(talmudText, searchTokens, lang)}</div>
            </div>
        `;
        updateCard(4, L.h4, lvl4Html);

        // Level 5: Attempt to Distinguish Muhkam from Mutashabih + Comparison (Contradiction & Discrepancy)
        const makkiList = verses.filter(v => v.revelationType === 'makki');
        const madaniList = verses.filter(v => v.revelationType === 'madani');
        const muhkamSample = (madaniList.length > 0 ? madaniList : verses).slice(0, 3);
        const mutashabihSample = (makkiList.length > 0 ? makkiList : verses).slice(0, 3);

        const compText = lang === 'ar'
            ? `<div class="irab-box">
                <p><strong>1. بين القرآن والكتب السابقة (التوراة والإنجيل والزبور):</strong> تتفق النصوص في أصل التوحيد وإقامة القسط المرتبط بمادة <strong>(${morph.root})</strong>، بينما يظهر التعارض في التحريفات اللاحقة أو التخصيص العرقي مقابل عالمية الخطاب القرآني ووضوحه.</p>
                <p style="margin-top:6px;"><strong>2. بين القرآن والمرويات (السنة والتلمود):</strong> يُعرض المروي على ميزان الآيات المحكمة؛ فما وافق النص القرآني في المقصد والحكم قُبل واستُؤنس به، وما تضارب معه في الدلالة أو قيّد مطلقه بغير بينة يُفرز ويُردّ إلى الأصل القرآني الحاكم.</p>
               </div>`
            : (lang === 'fr'
                ? `<div class="irab-box">
                    <p><strong>1. Entre le Coran et les Écritures antérieures :</strong> Convergence sur le monothéisme et l’éthique liée à « ${query} », mais divergence là où les textes antérieurs présentent des altérations ou restrictions face à l’universalité du Coran.</p>
                    <p style="margin-top:6px;"><strong>2. Entre le Coran et les récits (Sunnah et Talmud) :</strong> Chaque récit est confronté aux versets explicites (Muhkam) ; toute contradiction apparente est isolée au profit du critère coranique souverain.</p>
                   </div>`
                : `<div class="irab-box">
                    <p><strong>1. Between the Quran and Previous Scriptures:</strong> Alignment exists on core monotheism and ethical duty regarding "${query}", whereas discrepancies appear where historical alterations or exclusivist interpretations conflict with universal Quranic clarity.</p>
                    <p style="margin-top:6px;"><strong>2. Between the Quran and Narrations (Sunnah & Talmud):</strong> Narrations are weighed against explicit (Muhkam) Quranic verses; any semantic contradiction or unwarranted restriction is isolated in favor of the governing Quranic text.</p>
                   </div>`);

        const lvl5Html = `
            ${muhkamSample.map(v => `
                <div class="verse-box">
                    <div class="verse-text">﴿ ${highlightMatch(v.text, searchTokens, lang)} ﴾</div>
                    <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                </div>
            `).join('')}
            ${mutashabihSample.map(v => `
                <div class="verse-box">
                    <div class="verse-text">﴿ ${highlightMatch(v.text, searchTokens, lang)} ﴾</div>
                    <div class="verse-meta"><span>${v.surahName} (${v.ayahNumber})</span></div>
                </div>
            `).join('')}
            <div class="deriv-group-title">${L.compSub}</div>
            ${compText}
        `;
        updateCard(5, L.h5, lvl5Html);

        // Level 6: Conclusion, Deduction & Interpretation
        const lvl6Text = lang === 'ar'
            ? `إن التدرج المنهجي في دراسة لفظ <strong>«${query}»</strong> من أصله اللغوي ومشتقاته، مروراً باستقراء مواضعه في القرآن الكريم ومقابلته بالكتب السابقة والمرويات، وفرز المحكم من المتشابه؛ يُثمر بصيرةً قرآنيةً صافيةً تُعرّي الباطل وتُرسّخ <strong>الصلاح</strong> في العمل و<strong>الفوز</strong> في المآل.`
            : (lang === 'fr'
                ? `L’étude méthodique progressive du terme <strong>« ${query} »</strong> — de sa racine linguistique à la comparaison entre le Coran, les Écritures antérieures et les récits — permet de discerner la vérité et d’ancrer la droiture (Al-Salah) et le succès (Al-Fawz).`
                : `The gradual methodical study of <strong>"${query}"</strong> — from its linguistic root through Quranic induction, comparative scriptures, and separating Muhkam from Mutashabih — yields clear insight that exposes falsehood and establishes righteousness (Al-Salah) and ultimate success (Al-Fawz).`);

        const lvl6Html = `<div class="stage6-directive">${lvl6Text}</div>`;
        updateCard(6, L.h6, lvl6Html);
    }
});
