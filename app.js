document.addEventListener('DOMContentLoaded', function() {
    var cachedQuran = {};
    var cachedSunniHadith = { ar: null, en: null };
    var levelCache = {};
    var activeLevel = 1;
    var activeArticleNum = null;

    var SURAH_TYPES = {
        1:"مكية",2:"مدنية",3:"مدنية",4:"مدنية",5:"مدنية",6:"مكية",7:"مكية",8:"مدنية",9:"مدنية",10:"مكية",
        11:"مكية",12:"مكية",13:"مدنية",14:"مكية",15:"مكية",16:"مكية",17:"مكية",18:"مكية",19:"مكية",20:"مكية",
        21:"مكية",22:"مدنية",23:"مكية",24:"مدنية",25:"مكية",26:"مكية",27:"مكية",28:"مكية",29:"مكية",30:"مكية",
        31:"مكية",32:"مكية",33:"مدنية",34:"مكية",35:"مكية",36:"مكية",37:"مكية",38:"مكية",39:"مكية",40:"مكية",
        41:"مكية",42:"مكية",43:"مكية",44:"مكية",45:"مكية",46:"مكية",47:"مدنية",48:"مدنية",49:"مدنية",50:"مكية",
        51:"مكية",52:"مكية",53:"مكية",54:"مكية",55:"مدنية",56:"مكية",57:"مدنية",58:"مدنية",59:"مدنية",60:"مدنية",
        61:"مدنية",62:"مدنية",63:"مدنية",64:"مدنية",65:"مدنية",66:"مدنية",67:"مكية",68:"مكية",69:"مكية",70:"مكية",
        71:"مكية",72:"مكية",73:"مكية",74:"مكية",75:"مكية",76:"مدنية",77:"مكية",78:"مكية",79:"مكية",80:"مكية",
        81:"مكية",82:"مكية",83:"مكية",84:"مكية",85:"مكية",86:"مكية",87:"مكية",88:"مكية",89:"مكية",90:"مكية",
        91:"مكية",92:"مكية",93:"مكية",94:"مكية",95:"مكية",96:"مكية",97:"مكية",98:"مدنية",99:"مدنية",100:"مكية",
        101:"مكية",102:"مكية",103:"مكية",104:"مكية",105:"مكية",106:"مكية",107:"مكية",108:"مكية",109:"مكية",110:"مدنية",
        111:"مكية",112:"مكية",113:"مكية",114:"مكية"
    };

    function isEnglishText(t) { return /[a-zA-Z]/.test(t); }
    function noHtml(t) { return t ? t.replace(/<[^>]*>/g, '') : ''; }

    function normAr(t) {
        if (!t) return '';
        return t
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي');
    }

    function getQuranSearchVariants(w) {
        var base = normAr(w.trim());
        var variants = [w.trim()];
        if (variants.indexOf(base) === -1) variants.push(base);
        var uthmani = base.replace(/صلاه/g, 'صلوه').replace(/زكاه/g, 'زكوه').replace(/حياه/g, 'حيوه').replace(/ربا/g, 'ربوا');
        if (variants.indexOf(uthmani) === -1) variants.push(uthmani);
        return variants;
    }

    function buildFlexRegex(w, isEn) {
        if (!w) return null;
        if (isEn) {
            var esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp('(' + esc + ')', 'gi');
        }
        var clean = normAr(w.trim());
        if (!clean) return null;
        var pat = '';
        for (var i = 0; i < clean.length; i++) {
            var ch = clean[i];
            if (ch === 'ا') pat += '[اأإآٱ]';
            else if (ch === 'ه') pat += '[ةه]';
            else if (ch === 'ي') pat += '[يى]';
            else if (ch === 'و') pat += '[وؤ]';
            else pat += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pat += '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*';
        }
        pat = pat.replace(/ا\[[^\]]*\]و\[[^\]]*\]\[ةه\]/g, '[اأإآٱو][\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*[ةه]');
        return new RegExp('(' + pat + ')', 'g');
    }

    function hl(t, w, isEn) {
        if (!w || !t) return t;
        var rx = buildFlexRegex(w, isEn);
        if (!rx) return t;
        return t.replace(rx, '<mark class="highlight-word">$1</mark>');
    }

    function matchesClean(text, word, isEn) {
        if (!text || !word) return false;
        if (isEn) return text.toLowerCase().indexOf(word.toLowerCase()) !== -1;
        var nText = normAr(text);
        var nWord = normAr(word);
        if (nText.indexOf(nWord) !== -1) return true;
        var uth = nWord.replace(/صلاه/g, 'صلوه').replace(/زكاه/g, 'زكوه').replace(/حياه/g, 'حيوه');
        return nText.indexOf(uth) !== -1;
    }

    // بناء شبكة المقالات (1 - 30)
    var grid = document.getElementById('articles-grid');
    if (grid) {
        for (var n = 1; n <= 30; n++) {
            (function(num) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'art-num-btn';
                b.textContent = num;
                b.addEventListener('click', function() {
                    activeArticleNum = num;
                    document.querySelectorAll('.art-num-btn').forEach(function(x) { x.classList.remove('active'); });
                    b.classList.add('active');
                    var art = (typeof MY_ARTICLES !== 'undefined' && MY_ARTICLES[num]) ? MY_ARTICLES[num] : { title: 'مقال رقم ' + num, content: 'لم يتم إضافة نص لهذا المقال بعد.' };
                    document.getElementById('article-title').textContent = art.title;
                    document.getElementById('article-body').textContent = art.content;
                    document.getElementById('article-viewer').style.display = 'block';
                });
                grid.appendChild(b);
            })(n);
        }
    }

    function hideAllTopBoxes() {
        var b1 = document.getElementById('pyramid-box-1');
        var b2 = document.getElementById('pyramid-box-2');
        var ba = document.getElementById('articles-box');
        if (b1) b1.style.display = 'none';
        if (b2) b2.style.display = 'none';
        if (ba) ba.style.display = 'none';
    }

    document.getElementById('btn-pyr-1').addEventListener('click', function() {
        var b1 = document.getElementById('pyramid-box-1');
        var isOpen = b1.style.display === 'block';
        hideAllTopBoxes();
        b1.style.display = isOpen ? 'none' : 'block';
    });

    document.getElementById('btn-articles').addEventListener('click', function() {
        var ba = document.getElementById('articles-box');
        var isOpen = ba.style.display === 'block';
        hideAllTopBoxes();
        ba.style.display = isOpen ? 'none' : 'block';
    });

    document.getElementById('btn-pyr-2').addEventListener('click', function() {
        var b2 = document.getElementById('pyramid-box-2');
        var isOpen = b2.style.display === 'block';
        hideAllTopBoxes();
        b2.style.display = isOpen ? 'none' : 'block';
    });

    document.getElementById('btn-back-1').addEventListener('click', hideAllTopBoxes);
    document.getElementById('btn-back-2').addEventListener('click', hideAllTopBoxes);
    document.getElementById('btn-back-articles').addEventListener('click', hideAllTopBoxes);

    // زر الاستماع
    var listenBtn = document.getElementById('listen-btn');
    listenBtn.addEventListener('click', function() {
        if (!('speechSynthesis' in window)) {
            alert('المتصفح لا يدعم القراءة الصوتية');
            return;
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            listenBtn.textContent = 'استماع';
            listenBtn.classList.remove('speaking');
            return;
        }
        var textToRead = '';
        var artBox = document.getElementById('articles-box');
        var artViewer = document.getElementById('article-viewer');
        if (artBox && artBox.style.display === 'block' && artViewer && artViewer.style.display === 'block') {
            textToRead = document.getElementById('article-title').innerText + '. ' + document.getElementById('article-body').innerText;
        } else {
            var activeContent = document.getElementById('content-' + activeLevel);
            if (activeContent && activeContent.innerText.trim()) {
                textToRead = activeContent.innerText;
            }
        }
        if (!textToRead) {
            alert('يرجى إجراء بحث أو فتح مقال أولاً للاستماع إليه');
            return;
        }
        var utter = new SpeechSynthesisUtterance(textToRead);
        utter.lang = isEnglishText(textToRead.slice(0, 40)) ? 'en-US' : 'ar-SA';
        utter.rate = 0.95;
        utter.onend = function() {
            listenBtn.textContent = 'استماع';
            listenBtn.classList.remove('speaking');
        };
        listenBtn.textContent = 'إيقاف';
        listenBtn.classList.add('speaking');
        window.speechSynthesis.speak(utter);
    });

    // زر فسخ
    document.getElementById('clear-btn').addEventListener('click', function() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        listenBtn.textContent = 'استماع';
        listenBtn.classList.remove('speaking');
        document.getElementById('quran-word').value = '';
        document.getElementById('results-wrapper').style.display = 'none';
        document.getElementById('loader').style.display = 'none';
        for (var i = 1; i <= 6; i++) {
            document.getElementById('content-' + i).innerHTML = '';
        }
        levelCache = {};
        document.querySelectorAll('.level-btn').forEach(function(b) { b.classList.remove('active'); });
    });

    document.getElementById('submit-btn').addEventListener('click', function() { runLevel(1); });
    document.getElementById('quran-word').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') runLevel(1);
    });

    document.querySelectorAll('.level-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var lvl = parseInt(this.getAttribute('data-lvl'), 10);
            runLevel(lvl);
        });
    });

    async function getQuranMatches(word, isEn) {
        var key = (isEn ? "en_" : "ar_") + word.toLowerCase();
        if (cachedQuran[key]) return cachedQuran[key];
        var ed = isEn ? 'en.sahih' : 'quran-simple-clean';
        var queries = isEn ? [word] : getQuranSearchVariants(word);
        var allMatches = [];
        var seen = {};
        for (var q = 0; q < queries.length; q++) {
            var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(queries[q]) + '/all/' + ed;
            var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
            var m = (res && res.data && res.data.matches) ? res.data.matches : [];
            for (var i = 0; i < m.length; i++) {
                var uid = m[i].surah.number + ':' + m[i].numberInSurah;
                if (!seen[uid] && matchesClean(m[i].text, word, isEn)) {
                    seen[uid] = true;
                    allMatches.push(m[i]);
                }
            }
        }
        cachedQuran[key] = allMatches;
        return allMatches;
    }

    async function searchBollsBible(word, isEn) {
        var trans = isEn ? 'KJV' : 'SVD';
        var q = isEn ? word : normAr(word);
        var url = 'https://bolls.life/v2/find/' + trans + '?search=' + encodeURIComponent(q);
        var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
        var items = Array.isArray(res) ? res : (res && res.results ? res.results : []);
        var oldT = [], newT = [];
        items.forEach(function(it) {
            var bNum = parseInt(it.book, 10) || 1;
            var obj = {
                bookName: it.book_name || (isEn ? 'Book ' + bNum : 'سفر رقم ' + bNum),
                chapter: it.chapter || 1,
                verse: it.verse || 1,
                text: noHtml(it.text || '')
            };
            if (bNum <= 39) {
                if (oldT.length < 12) oldT.push(obj);
            } else {
                if (newT.length < 12) newT.push(obj);
            }
        });
        return { oldT: oldT, newT: newT };
    }

    async function getSunniHadith(isEn) {
        var lang = isEn ? 'en' : 'ar';
        if (cachedSunniHadith[lang]) return cachedSunniHadith[lang];
        var u1 = isEn
            ? 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari.min.json'
            : 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json';
        var r1 = await fetch(u1).then(function(r) { return r.json(); }).catch(function() { return null; });
        var list = [];
        if (r1 && r1.hadiths) {
            r1.hadiths.forEach(function(h) {
                list.push({ source: isEn ? "Sahih al-Bukhari" : "صحيح البخاري", num: h.hadithnumber, text: h.text });
            });
        }
        cachedSunniHadith[lang] = list;
        return list;
    }

    async function getShiaHadith(word, isEn) {
        var url = 'https://www.thaqalayn-api.net/api/v2/allbooks/search?q=' + encodeURIComponent(word);
        var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return []; });
        if (!Array.isArray(res)) return [];
        return res.slice(0, 8).map(function(h) {
            return {
                source: h.book || (isEn ? "Al-Kafi / Shia" : "الكافي / الشيعة"),
                num: h.id || "-",
                text: isEn ? (h.englishText || h.text || "") : (h.arabicText || h.text || "")
            };
        }).filter(function(x) { return x.text.length > 0; });
    }

    async function getIbadiHadith(word, isEn) {
        var dom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
        var q = isEn ? (word + ' Musnad al-Rabi ibn Habib') : (word + ' مسند الربيع بن حبيب');
        var res = await fetch('https://' + dom + '/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&format=json&origin=*').then(function(r) { return r.json(); }).catch(function() { return null; });
        var items = (res && res.query && res.query.search) ? res.query.search.slice(0, 4) : [];
        return items.map(function(it, idx) {
            return { source: (isEn ? "Musnad al-Rabi (Ibadi) — " : "مسند الربيع (الإباضية) — ") + it.title, num: idx + 1, text: noHtml(it.snippet) };
        });
    }

    async function getTalmudMishnah(word, isEn) {
        var searchWord = word;
        if (!isEn) {
            var tr = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=ar|en').then(function(r) { return r.json(); }).catch(function() { return null; });
            if (tr && tr.responseData && tr.responseData.translatedText) {
                searchWord = tr.responseData.translatedText.replace(/[^a-zA-Z ]/g, '').trim();
            }
        }
        var url = 'https://www.sefaria.org/api/search-wrapper?q=' + encodeURIComponent(searchWord) + '&type=text&field=naive_lemmatizer&filters[]=Mishnah&filters[]=Talmud&size=8';
        var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
        var hits = (res && res.hits && res.hits.hits) ? res.hits.hits : [];
        return hits.map(function(h) {
            var src = h._source || {};
            var txt = (h.highlight && h.highlight.naive_lemmatizer) ? noHtml(h.highlight.naive_lemmatizer.join(' ... ')) : (src.version || '');
            return { ref: src.ref || 'Mishnah / Talmud', text: txt, term: searchWord };
        }).filter(function(x) { return x.text.length > 0; });
    }

    async function runLevel(lvl) {
        var word = document.getElementById('quran-word').value.trim();
        if (!word) {
            alert('يرجى كتابة اللفظ المراد تدبره أولاً');
            return;
        }
        activeLevel = lvl;
        var isEn = isEnglishText(word);

        var hAr = [
            "المستوى الأول: الصرف والاشتقاق والمعجم",
            "المستوى الثاني: السياق والآيات القرآنية",
            "المستوى الثالث: الكتب السابقة (العهد القديم والجديد)",
            "المستوى الرابع: المرويات الحديثية والتلمود (المشنا)",
            "المستوى الخامس: الآيات المحكمات والأحكام",
            "المستوى السادس: علوم القمة والتأويل"
        ];
        var hEn = [
            "Level 1: Morphology & Lexicon",
            "Level 2: Syntax & Quranic Verses",
            "Level 3: Previous Scriptures (Old & New Testaments)",
            "Level 4: Narrations & Talmud (Mishnah)",
            "Level 5: Decisive Rulings (Muhkam)",
            "Level 6: Summit Sciences & Ta'wil"
        ];

        document.querySelectorAll('.level-btn').forEach(function(b, i) {
            b.classList.toggle('active', i + 1 === lvl);
        });
        document.querySelectorAll('.level-card').forEach(function(c, i) {
            c.querySelector('.level-header').textContent = isEn ? hEn[i] : hAr[i];
            c.setAttribute('dir', isEn ? 'ltr' : 'rtl');
            c.style.textAlign = isEn ? 'left' : 'right';
            c.classList.toggle('active-card', i + 1 === lvl);
        });

        var wrapper = document.getElementById('results-wrapper');
        var loader = document.getElementById('loader');
        var loaderText = document.getElementById('loader-text');
        loaderText.textContent = isEn ? 'Searching across levels...' : 'جاري البحث بحسب المستويات';

        var cacheKey = (isEn ? "EN_" : "AR_") + word.toLowerCase() + "_L" + lvl;
        if (levelCache[cacheKey]) {
            document.getElementById('content-' + lvl).innerHTML = levelCache[cacheKey];
            loader.style.display = 'none';
            wrapper.style.display = 'flex';
            return;
        }

        wrapper.style.display = 'none';
        loader.style.display = 'block';

        try {
            var out = "";
            if (lvl === 1) {
                var m1 = await getQuranMatches(word, isEn);
                var wDom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
                var wRes = await fetch('https://' + wDom + '/api/rest_v1/page/summary/' + encodeURIComponent(word)).then(function(r) { return r.json(); }).catch(function() { return null; });
                if (isEn) {
                    var stem = word.toLowerCase().replace(/(ing|ed|es|s|ly|ness|ful|less)$/, '');
                    out += '<div class="section-block"><span class="section-label">1. Core Stem:</span><div><strong>(' + stem.toUpperCase() + ')</strong></div></div>';
                    out += '<div class="section-block"><span class="section-label">2. Lexical Definition:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'Lexical overview of ' + word) + '</div></div>';
                    out += '<div class="section-block"><span class="section-label">3. Quranic Frequency:</span><div>Appears in <strong>' + m1.length + '</strong> verse(s).</div></div>';
                } else {
                    var cleanW = normAr(word);
                    var root = cleanW.replace(/^ال/, '').replace(/^[وميتنأإ]/, '').replace(/[ةونيا]$/, '');
                    if (root.length > 3) root = root.replace(/[اوي]/g, '');
                    var rStr = root.length >= 2 ? root.split('').join(' - ') : cleanW.split('').join(' - ');
                    out += '<div class="section-block"><span class="section-label">1. الجذر اللغوي التقريبي:</span><div><strong>( ' + rStr + ' )</strong></div></div>';
                    out += '<div class="section-block"><span class="section-label">2. البيان المعجمي:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'مفهوم لفظ (' + word + ') في لسان العرب والسياق المعرفي.') + '</div></div>';
                    out += '<div class="section-block"><span class="section-label">3. الإحصاء القرآني:</span><div>ورد هذا اللفظ في <strong>' + m1.length + '</strong> موضعاً في القرآن الكريم.</div></div>';
                }
            }
            else if (lvl === 2) {
                var m2 = await getQuranMatches(word, isEn);
                if (m2.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matching verses found.' : 'لم يتم العثور على آيات مطابقة، جرب كتابة اللفظ المجرد.') + '</div>';
                } else {
                    m2.slice(0, 30).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        var sType = SURAH_TYPES[v.surah.number] || '';
                        var badge = isEn ? (sType === 'مكية' ? 'Meccan' : 'Medinan') : sType;
                        out += '<div class="verse-item"><div class="verse-meta"><span>[' + sName + ' : ' + v.numberInSurah + ']</span><span class="surah-type">' + badge + '</span></div><div>' + hl(v.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 3) {
                var bible = await searchBollsBible(word, isEn);
                out += '<div class="sub-section-title">' + (isEn ? '1. Old Testament' : '1. العهد القديم (التوراة والأسفار)') + '</div>';
                if (bible.oldT.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matches in Old Testament.' : 'لم يتم العثور على نصوص مطابقة في العهد القديم.') + '</div>';
                } else {
                    bible.oldT.forEach(function(b) {
                        out += '<div class="verse-item"><div class="verse-meta"><span>[' + b.bookName + ' ' + b.chapter + ':' + b.verse + ']</span></div><div>' + hl(b.text, word, isEn) + '</div></div>';
                    });
                }
                out += '<div class="sub-section-title">' + (isEn ? '2. New Testament' : '2. العهد الجديد (الإنجيل)') + '</div>';
                if (bible.newT.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matches in New Testament.' : 'لم يتم العثور على نصوص مطابقة في العهد الجديد.') + '</div>';
                } else {
                    bible.newT.forEach(function(b) {
                        out += '<div class="verse-item"><div class="verse-meta"><span>[' + b.bookName + ' ' + b.chapter + ':' + b.verse + ']</span></div><div>' + hl(b.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 4) {
                out += '<div class="sub-section-title">' + (isEn ? '1. Hadith Narrations' : '1. المرويات الحديثية') + '</div>';
                var sunni = await getSunniHadith(isEn);
                var sFound = sunni.filter(function(h) { return matchesClean(h.text, word, isEn); }).slice(0, 6);
                var shia = await getShiaHadith(word, isEn);
                var ibadi = await getIbadiHadith(word, isEn);
                var allH = sFound.concat(shia.slice(0, 4)).concat(ibadi.slice(0, 3));
                if (allH.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No narrations found.' : 'لم يتم العثور على مرويات مطابقة لهذا اللفظ.') + '</div>';
                } else {
                    allH.forEach(function(item) {
                        out += '<div class="verse-item"><div class="verse-meta"><span>' + item.source + ' (' + item.num + ')</span></div><div>' + hl(item.text, word, isEn) + '</div></div>';
                    });
                }

                out += '<div class="sub-section-title">' + (isEn ? '2. Talmud & Mishnah' : '2. التلمود (المشنا)') + '</div>';
                var talmud = await getTalmudMishnah(word, isEn);
                if (talmud.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No passages found in Talmud/Mishnah.' : 'لم يتم العثور على نصوص مطابقة في التلمود (المشنا).') + '</div>';
                } else {
                    talmud.forEach(function(tm) {
                        out += '<div class="verse-item" dir="ltr" style="text-align:left;"><div class="verse-meta"><span>[' + tm.ref + ']</span></div><div>' + hl(tm.text, tm.term, true) + '</div></div>';
                    });
                }
            }
            else if (lvl === 5) {
                var m5 = await getQuranMatches(word, isEn);
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Criterion Rule:' : 'قاعدة الإحكام:') + '</span><div>' + (isEn ? 'Every concept is weighed against clear decisive Quranic verses.' : 'يُرد المتشابه والمرويات إلى الآيات المحكمات البينات في كتاب الله لفهم الحكم الصحيح.') + '</div></div>';
                if (m5.length > 0) {
                    m5.slice(0, 8).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        var sType = SURAH_TYPES[v.surah.number] || '';
                        var badge = isEn ? (sType === 'مكية' ? 'Meccan' : 'Medinan') : sType;
                        out += '<div class="verse-item"><div class="verse-meta"><span>[' + sName + ' : ' + v.numberInSurah + ']</span><span class="surah-type">' + badge + '</span></div><div>' + hl(v.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 6) {
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Summit Conclusion for (' + word + '):' : 'خلاصة التدبر الهرمي للفظ (' + word + '):') + '</span><div>' + (isEn ? 'Ascending from linguistic roots through Quranic context and decisive verses purifies the true meaning.' : 'بالتدرج من الجذر اللغوي في القاعدة، مروراً بالسياق القرآني والمقارنة، ووصولاً إلى المحكم، يتجلى المعنى الصافي للفظ بعيداً عن التحريف أو الإسقاط.') + '</div></div>';
            }

            levelCache[cacheKey] = out;
            document.getElementById('content-' + lvl).innerHTML = out;
        } catch (err) {
            document.getElementById('content-' + lvl).innerHTML = '<div class="section-block">حدث خطأ أثناء جلب البيانات، يرجى المحاولة مرة أخرى.</div>';
        } finally {
            loader.style.display = 'none';
            wrapper.style.display = 'flex';
        }
    }
});
