document.addEventListener('DOMContentLoaded', function() {
    var cachedQuran = {};
    var cachedBible = { ar: null, en: null };
    var cachedSunniHadith = { ar: null, en: null };
    var levelCache = {};

    var BOOKS_AR = ["التكوين","الخروج","اللاويين","العدد","التثنية","يشوع","القضاة","راعوث","صموئيل الأول","صموئيل الثاني","ملوك الأول","ملوك الثاني","أخبار الأيام الأول","أخبار الأيام الثاني","عزرا","نحميا","أستير","أيوب","المزامير (الزبور)","الأمثال","الجامعة","نشيد الأنشاد","إشعياء","إرميا","مراثي إرميا","حزقيال","دانيال","هوشع","يوئيل","عاموس","عوبديا","يونان","ميخا","ناحوم","حبقوق","صفنيا","حجي","زكريا","ملاخي","إنجيل متى","إنجيل مرقس","إنجيل لوقا","إنجيل يوحنا","أعمال الرسل","رومية","كورنثوس الأولى","كورنثوس الثانية","غلاطية","أفسس","فيلبي","كولوسي","تسالونيكي الأولى","تسالونيكي الثانية","تيموثاوس الأولى","تيموثاوس الثانية","تيطس","فليمون","العبرانيين","يعقوب","بطرس الأولى","بطرس الثانية","يوحنا الأولى","يوحنا الثانية","يوحنا الثالثة","يهوذا","رؤيا يوحنا"];

    var BOOKS_EN = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

    function isEnglishText(t) { return /[a-zA-Z]/.test(t); }
    function noHtml(t) { return t ? t.replace(/<[^>]*>/g, '') : ''; }

    function normAr(t) {
        if (!t) return '';
        return t
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي');
    }

    function hl(t, w, isEn) {
        if (!w || !t) return t;
        if (isEn) {
            var esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return t.replace(new RegExp('(' + esc + ')', 'gi'), '<mark class="highlight-word">$1</mark>');
        }
        var cleanW = normAr(w.trim());
        if (!cleanW) return t;

        var chars = cleanW.split('');
        var patternParts = chars.map(function(ch) {
            var cPat = ch;
            if (ch === 'ا') cPat = '[اأإآٱ]';
            else if (ch === 'ه') cPat = '[هة]';
            else if (ch === 'ي') cPat = '[يى]';
            else cPat = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return cPat + '[\u064B-\u065F\u0670\u0640]*';
        });
        var regex = new RegExp('(' + patternParts.join('') + ')', 'g');
        return t.replace(regex, '<mark class="highlight-word">$1</mark>');
    }

    // أزرار الهرم
    var btnPyr1 = document.getElementById('btn-pyr-1');
    var btnPyr2 = document.getElementById('btn-pyr-2');
    var btnBack1 = document.getElementById('btn-back-1');
    var btnBack2 = document.getElementById('btn-back-2');

    if (btnPyr1) {
        btnPyr1.addEventListener('click', function() {
            var b1 = document.getElementById('pyramid-box-1');
            var b2 = document.getElementById('pyramid-box-2');
            if (b2) b2.style.display = 'none';
            if (b1) b1.style.display = (b1.style.display === 'block') ? 'none' : 'block';
        });
    }

    if (btnPyr2) {
        btnPyr2.addEventListener('click', function() {
            var b1 = document.getElementById('pyramid-box-1');
            var b2 = document.getElementById('pyramid-box-2');
            if (b1) b1.style.display = 'none';
            if (b2) b2.style.display = (b2.style.display === 'block') ? 'none' : 'block';
        });
    }

    if (btnBack1) {
        btnBack1.addEventListener('click', function() {
            var b1 = document.getElementById('pyramid-box-1');
            if (b1) b1.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (btnBack2) {
        btnBack2.addEventListener('click', function() {
            var b2 = document.getElementById('pyramid-box-2');
            if (b2) b2.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // زر فسخ
    var clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            var input = document.getElementById('quran-word');
            if (input) input.value = '';
            var wrapper = document.getElementById('results-wrapper');
            if (wrapper) wrapper.style.display = 'none';
            var loader = document.getElementById('loader');
            if (loader) loader.style.display = 'none';
            for (var i = 1; i <= 6; i++) {
                var c = document.getElementById('content-' + i);
                if (c) c.innerHTML = '';
            }
            levelCache = {};
            document.querySelectorAll('.level-btn').forEach(function(b) { b.classList.remove('active'); });
        });
    }

    // زر ابدأ التدبر والإدخال
    var submitBtn = document.getElementById('submit-btn');
    var quranInput = document.getElementById('quran-word');

    if (submitBtn) {
        submitBtn.addEventListener('click', function() { selectLevel(1); });
    }
    if (quranInput) {
        quranInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') selectLevel(1);
        });
    }

    // أزرار المستويات 1 - 6
    document.querySelectorAll('.level-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var lvl = parseInt(this.getAttribute('data-lvl'), 10);
            if (lvl) selectLevel(lvl);
        });
    });

    async function getQuranMatches(word, isEn) {
        var cleanQuery = isEn ? word.trim() : normAr(word.trim()).replace(/ه$/, 'ة');
        var key = (isEn ? "en_" : "ar_") + cleanQuery.toLowerCase();
        if (cachedQuran[key]) return cachedQuran[key];
        var ed = isEn ? 'en.sahih' : 'quran-simple-clean';
        var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(cleanQuery) + '/all/' + ed;
        var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
        var m = (res && res.data && res.data.matches) ? res.data.matches : [];
        if (!isEn && m.length === 0 && cleanQuery.startsWith('ال') && cleanQuery.length > 4) {
            var noAl = cleanQuery.slice(2);
            var url2 = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(noAl) + '/all/' + ed;
            var res2 = await fetch(url2).then(function(r) { return r.json(); }).catch(function() { return null; });
            m = (res2 && res2.data && res2.data.matches) ? res2.data.matches : [];
        }
        cachedQuran[key] = m;
        return m;
    }

    async function getBible(isEn) {
        var lang = isEn ? 'en' : 'ar';
        if (cachedBible[lang]) return cachedBible[lang];
        var url = isEn 
            ? 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json' 
            : 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ar_svd.json';
        var r = await fetch(url).then(function(res) { return res.json(); }).catch(function() { return null; });
        cachedBible[lang] = r;
        return r;
    }

    async function getTalmudMishnah(word, isEn) {
        var queryTerm = word.trim();
        if (!isEn) {
            var dict = {
                "الصلاه": "prayer", "صلاه": "prayer", "الكتاب": "book", "كتاب": "book",
                "الله": "God", "الرب": "Lord", "السبت": "Sabbath", "سبت": "Sabbath",
                "الزكاه": "charity", "زكاه": "charity", "الصوم": "fasting", "صوم": "fasting",
                "الطلاق": "divorce", "طلاق": "divorce", "الزواج": "marriage", "زواج": "marriage",
                "الميراث": "inheritance", "ميراث": "inheritance", "الربا": "usury", "ربا": "usury",
                "الدم": "blood", "دم": "blood", "اللحم": "meat", "لحم": "meat",
                "الخنزير": "swine", "خنزير": "swine", "الشهاده": "testimony", "شهاده": "testimony",
                "القسم": "oath", "يمين": "oath", "النذر": "vow", "نذر": "vow",
                "الهيكل": "Temple", "هيكل": "Temple", "التوراه": "Torah", "توراه": "Torah",
                "موسي": "Moses", "ابراهيم": "Abraham", "داود": "David", "سليمان": "Solomon"
            };
            var norm = normAr(queryTerm);
            if (dict[norm]) {
                queryTerm = dict[norm];
            } else {
                var trUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(queryTerm) + '&langpair=ar|en';
                var trRes = await fetch(trUrl).then(function(r) { return r.json(); }).catch(function() { return null; });
                if (trRes && trRes.responseData && trRes.responseData.translatedText) {
                    queryTerm = trRes.responseData.translatedText.replace(/[^a-zA-Z ]/g, '').trim();
                }
            }
        }

        if (!queryTerm) return [];

        var url = 'https://www.sefaria.org/api/search-wrapper';
        var payload = {
            query: queryTerm,
            type: "text",
            field: "naive_lemmatizer",
            slop: 10,
            size: 12,
            filters: ["Mishnah", "Talmud"],
            filter_fields: ["path", "path"]
        };

        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function(r) { return r.json(); }).catch(function() { return null; });

        var hits = (res && res.hits && res.hits.hits) ? res.hits.hits : [];
        return hits.map(function(h) {
            var src = h._source || {};
            var hlText = (h.highlight && h.highlight.naive_lemmatizer && h.highlight.naive_lemmatizer.length > 0)
                ? h.highlight.naive_lemmatizer.join(' ... ')
                : (src.naive_lemmatizer || '');
            return {
                ref: src.ref || "Mishnah / Talmud",
                text: noHtml(hlText),
                searchedTerm: queryTerm
            };
        }).filter(function(item) { return item.text.length > 0; });
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
        var q = isEn ? word : normAr(word).replace(/ه$/, 'ة');
        var url = 'https://www.thaqalayn-api.net/api/v2/allbooks/search?q=' + encodeURIComponent(q);
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

    async function selectLevel(lvl) {
        var inputEl = document.getElementById('quran-word');
        var word = inputEl ? inputEl.value.trim() : '';
        if (!word) {
            alert('يرجى كتابة اللفظ المراد تدبره أولاً / Please enter a word first');
            return;
        }
        var isEn = isEnglishText(word);

        var hAr = [
            "المستوى الأول: الصرف والاشتقاق والمعجم",
            "المستوى الثاني: السياق والآيات القرآنية",
            "المستوى الثالث: الكتب السابقة (العهد القديم والجديد والتلمود)",
            "المستوى الرابع: الميزان القرآني والمرويات",
            "المستوى الخامس: الأحكام المحكمة والمقاصد",
            "المستوى السادس: علوم القمة والتأويل"
        ];
        var hEn = [
            "Level 1: Morphology & Lexicon",
            "Level 2: Syntax & Quranic Verses",
            "Level 3: Previous Scriptures (Old & New Testaments, Talmud)",
            "Level 4: Quranic Criterion & Narrations",
            "Level 5: Decisive Rulings (Muhkam)",
            "Level 6: Summit Sciences & Ta'wil"
        ];

        document.querySelectorAll('.level-btn').forEach(function(b, i) {
            b.classList.toggle('active', i + 1 === lvl);
        });

        document.querySelectorAll('.level-card').forEach(function(c, i) {
            var hd = c.querySelector('.level-header');
            if (hd) hd.textContent = isEn ? hEn[i] : hAr[i];
            c.setAttribute('dir', isEn ? 'ltr' : 'rtl');
            c.style.textAlign = isEn ? 'left' : 'right';
            c.classList.toggle('active-card', i + 1 === lvl);
        });

        var wrapper = document.getElementById('results-wrapper');
        var loader = document.getElementById('loader');
        var loaderText = document.getElementById('loader-text');
        var btn = document.getElementById('submit-btn');

        if (loaderText) {
            loaderText.textContent = isEn ? 'Contemplating across levels...' : 'جاري التدبر بحسب المستويات';
        }

        var cacheKey = (isEn ? "EN_" : "AR_") + word.toLowerCase() + "_L" + lvl;
        if (levelCache[cacheKey]) {
            document.getElementById('content-' + lvl).innerHTML = levelCache[cacheKey];
            if (loader) loader.style.display = 'none';
            if (wrapper) wrapper.style.display = 'flex';
            return;
        }

        if (wrapper) wrapper.style.display = 'none';
        if (loader) loader.style.display = 'block';
        if (btn) btn.disabled = true;

        var cleanW = isEn ? word.toLowerCase() : normAr(word);
        var enc = encodeURIComponent(word);

        try {
            var out = "";

            if (lvl === 1) {
                var m1 = await getQuranMatches(word, isEn);
                var wDom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
                var wRes = await fetch('https://' + wDom + '/api/rest_v1/page/summary/' + enc).then(function(r) { return r.json(); }).catch(function() { return null; });
                
                if (isEn) {
                    var stem = cleanW.replace(/(ing|ed|es|s|ly|ness|ful|less)$/, '');
                    out += '<div class="section-block"><span class="section-label">1. Stem Analysis:</span><div>Core stem: <strong>(' + stem.toUpperCase() + ')</strong></div></div>';
                    out += '<div class="section-block"><span class="section-label">2. Definition:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'Lexical overview of ' + word) + '</div></div>';
                    out += '<div class="section-block"><span class="section-label">3. Quranic Frequency:</span><div>Appears in <strong>' + m1.length + '</strong> verse(s).</div></div>';
                } else {
                    var root = cleanW.replace(/^ال/, '').replace(/^[وميتنا]/, '').replace(/[هونيا]$/, '');
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
                    out += '<div class="section-block">' + (isEn ? 'No exact verses found. Try root word.' : 'لم يتم العثور على آيات مطابقة تماماً، جرب كتابة اللفظ بدون زوائد.') + '</div>';
                } else {
                    m2.slice(0, 25).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ']</div><div class="verse-text">' + hl(v.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 3) {
                var bible = await getBible(isEn);
                var oldTestament = [];
                var newTestament = [];

                if (Array.isArray(bible)) {
                    for (var bi = 0; bi < bible.length; bi++) {
                        var bName = isEn ? (BOOKS_EN[bi] || bible[bi].name) : (BOOKS_AR[bi] || bible[bi].name);
                        var chaps = bible[bi].chapters || [];
                        for (var ci = 0; ci < chaps.length; ci++) {
                            var verses = chaps[ci] || [];
                            for (var vi = 0; vi < verses.length; vi++) {
                                var vTxt = isEn ? verses[vi].toLowerCase() : normAr(verses[vi]);
                                var searchTarget = isEn ? cleanW : cleanW;
                                var altTarget = (!isEn && cleanW.startsWith('ال') && cleanW.length > 4) ? cleanW.slice(2) : cleanW;
                                
                                if (vTxt.indexOf(searchTarget) !== -1 || vTxt.indexOf(altTarget) !== -1) {
                                    var itemObj = { book: bName, ch: ci + 1, vs: vi + 1, text: verses[vi] };
                                    if (bi < 39 && oldTestament.length < 10) {
                                        oldTestament.push(itemObj);
                                    } else if (bi >= 39 && newTestament.length < 10) {
                                        newTestament.push(itemObj);
                                    }
                                }
                                if (oldTestament.length >= 10 && newTestament.length >= 10) break;
                            }
                            if (oldTestament.length >= 10 && newTestament.length >= 10) break;
                        }
                        if (oldTestament.length >= 10 && newTestament.length >= 10) break;
                    }
                }

                // 1. العهد القديم
                out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Old Testament (Torah & Prophets):' : '1. العهد القديم (التوراة والأنبياء):') + '</span></div>';
                if (oldTestament.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matching passages found in the Old Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد القديم.') + '</div>';
                } else {
                    oldTestament.forEach(function(bm) {
                        out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div class="verse-text">' + hl(bm.text, word, isEn) + '</div></div>';
                    });
                }

                // 2. العهد الجديد
                out += '<div class="section-block" style="margin-top:16px;"><span class="section-label">' + (isEn ? '2. New Testament (Gospels & Epistles):' : '2. العهد الجديد (الأناجيل والرسائل):') + '</span></div>';
                if (newTestament.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matching passages found in the New Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد الجديد.') + '</div>';
                } else {
                    newTestament.forEach(function(bm) {
                        out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div class="verse-text">' + hl(bm.text, word, isEn) + '</div></div>';
                    });
                }

                // 3. التلمود (المشنا)
                var talmudItems = await getTalmudMishnah(word, isEn);
                out += '<div class="section-block" style="margin-top:16px;"><span class="section-label">' + (isEn ? '3. Talmud & Mishnah:' : '3. التلمود (المشنا):') + '</span></div>';
                if (talmudItems.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No matching passages retrieved from Talmud/Mishnah.' : 'لم يتم العثور على نصوص مطابقة في التلمود (المشنا) لهذا اللفظ.') + '</div>';
                } else {
                    talmudItems.forEach(function(tm) {
                        out += '<div class="verse-item" dir="ltr" style="text-align:left;"><div class="verse-meta">[' + tm.ref + ']</div><div class="verse-text">' + hl(tm.text, tm.searchedTerm, true) + '</div></div>';
                    });
                }
            }
            else if (lvl === 4) {
                var sunni = await getSunniHadith(isEn);
                var altW = (!isEn && cleanW.startsWith('ال') && cleanW.length > 4) ? cleanW.slice(2) : cleanW;
                var sFound = sunni.filter(function(h) {
                    var txt = isEn ? h.text.toLowerCase() : normAr(h.text);
                    return txt.indexOf(cleanW) !== -1 || txt.indexOf(altW) !== -1;
                }).slice(0, 8);
                var shia = await getShiaHadith(word, isEn);
                var ibadi = await getIbadiHadith(word, isEn);
                var allH = sFound.concat(shia.slice(0, 5)).concat(ibadi.slice(0, 4));

                if (allH.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No narrations retrieved for this term.' : 'لم يتم العثور على مرويات مطابقة لهذا اللفظ في قواعد البيانات المتاحة.') + '</div>';
                } else {
                    allH.forEach(function(item) {
                        out += '<div class="verse-item"><div class="verse-meta">' + item.source + ' (' + item.num + ')</div><div class="verse-text">' + hl(item.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 5) {
                var m5 = await getQuranMatches(word, isEn);
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Criterion Rule:' : 'قاعدة الإحكام:') + '</span><div>' + (isEn ? 'Every concept must be weighed against the clear decisive verses of the Quran.' : 'يُرد المتشابه والمرويات إلى الآيات المحكمات البينات في كتاب الله لفهم الحكم الصحيح.') + '</div></div>';
                if (m5.length > 0) {
                    out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Key Reference Verses:' : 'شواهد محورية من التنزيل:') + '</span></div>';
                    m5.slice(0, 5).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ']</div><div class="verse-text">' + hl(v.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 6) {
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Summit Conclusion for (' + word + '):' : 'خلاصة التدبر الهرمي للفظ (' + word + '):') + '</span><div>' + (isEn ? 'By ascending from linguistic roots through Quranic context and decisive verses, the true meaning is purified from distortion.' : 'بالتدرج من الجذر اللغوي في القاعدة، مروراً بالسياق القرآني والمقارنة، ووصولاً إلى المحكم، يتجلى المعنى الصافي للفظ بعيداً عن التحريف أو الإسقاط.') + '</div></div>';
            }

            levelCache[cacheKey] = out;
            document.getElementById('content-' + lvl).innerHTML = out;
        } catch (err) {
            document.getElementById('content-' + lvl).innerHTML = '<div class="section-block">' + (isEn ? 'Error loading data. Please try again.' : 'حدث خطأ أثناء جلب البيانات، يرجى المحاولة مرة أخرى.') + '</div>';
        } finally {
            if (loader) loader.style.display = 'none';
            if (wrapper) wrapper.style.display = 'flex';
            if (btn) btn.disabled = false;
        }
    }
});