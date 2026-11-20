document.addEventListener('DOMContentLoaded', function() {
    var cachedQuran = {};
    var cachedSunniHadith = { ar: null, en: null };
    var levelCache = {};
    var activeLevel = 1;

    var BIBLE_BOOKS_AR = [
        "التكوين","الخروج","اللاويين","العدد","التثنية","يشوع","القضاة","راعوث","صموئيل الأول","صموئيل الثاني",
        "ملوك الأول","ملوك الثاني","أخبار الأيام الأول","أخبار الأيام الثاني","عزرا","نحميا","أستير","أيوب","المزامير","الأمثال",
        "الجامعة","نشيد الأنشاد","إشعياء","إرميا","مراثي إرميا","حزقيال","دانيال","هوشع","يوئيل","عاموس",
        "عوبديا","يونان","ميخا","ناحوم","حبقوق","صفنيا","حجي","زكريا","ملاخي",
        "إنجيل متى","إنجيل مرقس","إنجيل لوقا","إنجيل يوحنا","أعمال الرسل","رومية","كورنثوس الأولى","كورنثوس الثانية",
        "غلاطية","أفسس","فيلبي","كولوسي","تسالونيكي الأولى","تسالونيكي الثانية","تيموثاوس الأولى","تيموثاوس الثانية",
        "تيطس","فليمون","العبرانيين","يعقوب","بطرس الأولى","بطرس الثانية","يوحنا الأولى","يوحنا الثانية","يوحنا الثالثة","يهوذا","رؤيا يوحنا"
    ];

    var BIBLE_BOOKS_EN = [
        "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel",
        "1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs",
        "Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
        "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
        "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
        "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy",
        "Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
    ];

    function isEnglishText(t) {
        return /[a-zA-Z]/.test(t);
    }

    function normAr(t) {
        if (!t) return '';
        return t
            .replace(/[ً-ٰٟۖ-ۭ]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/صلوه/g, 'صلاه')
            .replace(/زكوه/g, 'زكاه')
            .replace(/حيوه/g, 'حياه')
            .replace(/ربوا/g, 'ربا');
    }

    function noHtml(t) {
        return t ? t.replace(/<[^>]*>/g, '') : '';
    }

    function buildArabicFlexibleRegex(word) {
        var clean = normAr(word.trim());
        if (!clean) return null;
        var diac = '[\u064B-\u065F\u0670\u06D6-\u06ED]*';
        var pattern = '';
        for (var i = 0; i < clean.length; i++) {
            var ch = clean[i];
            if (ch === 'ا') {
                pattern += '[اأإآٱ]';
            } else if (ch === 'ه') {
                pattern += '[هة]';
            } else if (ch === 'ي') {
                pattern += '[يى]';
            } else if (ch === 'و') {
                pattern += '[وا]';
            } else {
                pattern += ch.replace(/[.*+?^${}()|[\]\]/g, '\$&');
            }
            if (i < clean.length - 1) {
                pattern += diac;
            }
        }
        return new RegExp('(' + pattern + ')', 'g');
    }

    function hl(text, word, isEn) {
        if (!word || !text) return text;
        if (isEn) {
            var esc = word.trim().replace(/[.*+?^${}()|[\]\]/g, '\$&');
            return text.replace(new RegExp('(' + esc + ')', 'gi'), '<mark class="highlight-word">$1</mark>');
        }
        var rx = buildArabicFlexibleRegex(word);
        if (!rx) return text;
        var out = text.replace(rx, '<mark class="highlight-word">$1</mark>');
        var bare = normAr(word.trim()).replace(/^ال/, '');
        if (out === text && bare.length >= 2) {
            var rx2 = buildArabicFlexibleRegex(bare);
            if (rx2) out = text.replace(rx2, '<mark class="highlight-word">$1</mark>');
        }
        return out;
    }

    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        var listenBtn = document.getElementById('listen-btn');
        if (listenBtn) {
            listenBtn.classList.remove('speaking');
            var word = document.getElementById('quran-word').value.trim();
            listenBtn.textContent = isEnglishText(word) ? 'Listen' : 'الاستماع';
        }
    }

    // أزرار الهرم
    document.getElementById('btn-pyr-1').addEventListener('click', function() {
        var b1 = document.getElementById('pyramid-box-1');
        var b2 = document.getElementById('pyramid-box-2');
        b2.style.display = 'none';
        b1.style.display = (b1.style.display === 'block') ? 'none' : 'block';
    });

    document.getElementById('btn-pyr-2').addEventListener('click', function() {
        var b1 = document.getElementById('pyramid-box-1');
        var b2 = document.getElementById('pyramid-box-2');
        b1.style.display = 'none';
        b2.style.display = (b2.style.display === 'block') ? 'none' : 'block';
    });

    document.getElementById('btn-back-1').addEventListener('click', function() {
        document.getElementById('pyramid-box-1').style.display = 'none';
    });

    document.getElementById('btn-back-2').addEventListener('click', function() {
        document.getElementById('pyramid-box-2').style.display = 'none';
    });

    // زر فسخ
    document.getElementById('clear-btn').addEventListener('click', function() {
        stopSpeech();
        document.getElementById('quran-word').value = '';
        document.getElementById('results-wrapper').style.display = 'none';
        document.getElementById('loader').style.display = 'none';
        for (var i = 1; i <= 6; i++) {
            document.getElementById('content-' + i).innerHTML = '';
        }
        levelCache = {};
        document.querySelectorAll('.level-btn').forEach(function(b) {
            b.classList.remove('active');
        });
    });

    // زر الاستماع
    document.getElementById('listen-btn').addEventListener('click', function() {
        if (!('speechSynthesis' in window)) {
            alert('المتصفح لا يدعم القراءة الصوتية');
            return;
        }
        if (window.speechSynthesis.speaking) {
            stopSpeech();
            return;
        }
        var activeBody = document.getElementById('content-' + activeLevel);
        var textToRead = activeBody ? activeBody.innerText.trim() : '';
        if (!textToRead) {
            alert('يرجى بدء التدبر أولاً لعرض النص المراد الاستماع إليه');
            return;
        }
        var isEn = isEnglishText(textToRead.slice(0, 80));
        var utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = isEn ? 'en-US' : 'ar-SA';
        utterance.rate = 0.95;

        var listenBtn = document.getElementById('listen-btn');
        listenBtn.classList.add('speaking');
        listenBtn.textContent = isEn ? 'Stop' : 'إيقاف';

        utterance.onend = function() { stopSpeech(); };
        utterance.onerror = function() { stopSpeech(); };
        window.speechSynthesis.speak(utterance);
    });

    // زر ابدأ التدبر والإدخال
    document.getElementById('submit-btn').addEventListener('click', function() {
        runLevel(1);
    });
    document.getElementById('quran-word').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') runLevel(1);
    });

    // أزرار المستويات 1 - 6
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
        var terms = [word.trim()];
        if (!isEn) {
            var n = normAr(word.trim());
            if (terms.indexOf(n) === -1) terms.push(n);
            var bare = n.replace(/^ال/, '');
            if (bare.length >= 2 && terms.indexOf(bare) === -1) terms.push(bare);
        }

        var allMatches = [];
        var seen = {};
        for (var i = 0; i < terms.length; i++) {
            var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(terms[i]) + '/all/' + ed;
            try {
                var r = await fetch(url);
                var res = await r.json();
                var m = (res && res.data && res.data.matches) ? res.data.matches : [];
                m.forEach(function(item) {
                    var uid = item.surah.number + ':' + item.numberInSurah;
                    if (!seen[uid]) {
                        seen[uid] = true;
                        allMatches.push(item);
                    }
                });
                if (allMatches.length > 0 && i === 0) break;
            } catch (e) {}
        }
        cachedQuran[key] = allMatches;
        return allMatches;
    }

    async function translateToEnglish(word) {
        if (isEnglishText(word)) return word;
        try {
            var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=ar|en';
            var r = await fetch(url);
            var data = await r.json();
            if (data && data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText.replace(/[^a-zA-Z\s]/g, '').trim();
            }
        } catch (e) {}
        return word;
    }

    async function searchBibleBolls(word, isEn) {
        var trans = isEn ? 'YLT' : 'SVD';
        var query = isEn ? word.trim() : normAr(word.trim());
        var url = 'https://bolls.life/find/' + trans + '/?search=' + encodeURIComponent(query);
        try {
            var r = await fetch(url);
            var data = await r.json();
            if (Array.isArray(data) && data.length > 0) return data;
            if (!isEn) {
                var bare = query.replace(/^ال/, '');
                if (bare.length >= 2 && bare !== query) {
                    var r2 = await fetch('https://bolls.life/find/' + trans + '/?search=' + encodeURIComponent(bare));
                    var data2 = await r2.json();
                    if (Array.isArray(data2)) return data2;
                }
            }
        } catch (e) {}
        return [];
    }

    async function getSunniHadith(isEn) {
        var lang = isEn ? 'en' : 'ar';
        if (cachedSunniHadith[lang]) return cachedSunniHadith[lang];
        var u1 = isEn
            ? 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari.min.json'
            : 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json';
        try {
            var r = await fetch(u1);
            var r1 = await r.json();
            var list = [];
            if (r1 && r1.hadiths) {
                r1.hadiths.forEach(function(h) {
                    list.push({
                        source: isEn ? "Sahih al-Bukhari" : "صحيح البخاري",
                        num: h.hadithnumber,
                        text: h.text
                    });
                });
            }
            cachedSunniHadith[lang] = list;
            return list;
        } catch (e) {
            return [];
        }
    }

    async function getShiaHadith(word, isEn) {
        var url = 'https://www.thaqalayn-api.net/api/v2/allbooks/search?q=' + encodeURIComponent(word);
        try {
            var r = await fetch(url);
            var res = await r.json();
            if (!Array.isArray(res)) return [];
            return res.slice(0, 8).map(function(h) {
                return {
                    source: h.book || (isEn ? "Al-Kafi / Shia" : "الكافي / الشيعة"),
                    num: h.id || "-",
                    text: isEn ? (h.englishText || h.text || "") : (h.arabicText || h.text || "")
                };
            }).filter(function(x) { return x.text.length > 0; });
        } catch (e) {
            return [];
        }
    }

    async function getTalmudMishnah(word, isEn) {
        var enTerm = await translateToEnglish(word);
        var url = 'https://www.sefaria.org/api/search-wrapper?q=' + encodeURIComponent(enTerm) + '&type=text&field=naive_lemmatizer&filters[]=Mishnah&filters[]=Talmud&size=8';
        try {
            var r = await fetch(url);
            var res = await r.json();
            var hits = (res && res.hits && res.hits.hits) ? res.hits.hits : [];
            return hits.map(function(hit) {
                var src = hit._source || {};
                var ref = src.ref || "Mishnah / Talmud";
                var snippet = (hit.highlight && hit.highlight.naive_lemmatizer)
                    ? hit.highlight.naive_lemmatizer.join(' ... ')
                    : (src.exact || "");
                return {
                    ref: ref,
                    text: noHtml(snippet),
                    enTerm: enTerm
                };
            }).filter(function(x) { return x.text.length > 0; });
        } catch (e) {
            return [];
        }
    }

    function getSurahTypeBadge(revType, isEn) {
        var isMed = (revType || '').toLowerCase() === 'medinan';
        if (isEn) {
            return '<span class="surah-badge ' + (isMed ? 'medinan' : '') + '">' + (isMed ? 'Medinan' : 'Meccan') + '</span>';
        }
        return '<span class="surah-badge ' + (isMed ? 'medinan' : '') + '">' + (isMed ? 'مدنية' : 'مكية') + '</span>';
    }

    async function runLevel(lvl) {
        stopSpeech();
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
            "المستوى الثالث: العهد القديم والجديد",
            "المستوى الرابع: المرويات الحديثية والتلمود (المشنا)",
            "المستوى الخامس: الآيات المحكمات والأحكام",
            "المستوى السادس: علوم القمة والتأويل"
        ];
        var hEn = [
            "Level 1: Morphology & Lexicon",
            "Level 2: Syntax & Quranic Verses",
            "Level 3: Old & New Testaments",
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
        loaderText.textContent = isEn ? 'Contemplating across levels...' : 'جاري التدبر بحسب المستويات';

        var cacheKey = (isEn ? "EN_" : "AR_") + word.toLowerCase() + "_L" + lvl;
        if (levelCache[cacheKey]) {
            document.getElementById('content-' + lvl).innerHTML = levelCache[cacheKey];
            loader.style.display = 'none';
            wrapper.style.display = 'flex';
            return;
        }

        wrapper.style.display = 'none';
        loader.style.display = 'block';

        var cleanW = isEn ? word.toLowerCase() : normAr(word);
        var enc = encodeURIComponent(word);
        var out = "";

        try {
            if (lvl === 1) {
                var m1 = await getQuranMatches(word, isEn);
                var wDom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
                var wRes = await fetch('https://' + wDom + '/api/rest_v1/page/summary/' + enc).then(function(r) { return r.json(); }).catch(function() { return null; });

                if (isEn) {
                    var stem = cleanW.replace(/(ing|ed|es|s|ly|ness|ful|less)$/, '');
                    out += '<div class="section-block"><span class="section-label">1. Core Stem:</span><div><strong>(' + stem.toUpperCase() + ')</strong></div></div>';
                    out += '<div class="section-block"><span class="section-label">2. Lexical Definition:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'Lexical overview of ' + word) + '</div></div>';
                    out += '<div class="section-block"><span class="section-label">3. Quranic Frequency:</span><div>Appears in <strong>' + m1.length + '</strong> verse(s).</div></div>';
                } else {
                    var root = cleanW.replace(/^ال/, '').replace(/^[وميتنا]/, '').replace(/[هونيا]$/, '');
                    if (root.length > 3) root = root.replace(/[اوي]/g, '');
                    var rStr = root.length >= 2 ? root.split('').join(' - ') : cleanW.split('').join(' - ');
                    out += '<div class="section-block"><span class="section-label">1. الجذر اللغوي التقريبي:</span><div><strong>( ' + rStr + ' )</strong></div></div>';
                    out += '<div class="section-block"><span class="section-label">2. البيان المعجمي:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'مفهوم لفظ (' + word + ') في اللسان العربي والسياق المعرفي.') + '</div></div>';
                    out += '<div class="section-block"><span class="section-label">3. الإحصاء القرآني:</span><div>ورد هذا اللفظ في <strong>' + m1.length + '</strong> موضعاً في القرآن الكريم.</div></div>';
                }
            }
            else if (lvl === 2) {
                var m2 = await getQuranMatches(word, isEn);
                if (m2.length === 0) {
                    out += '<div class="section-block">' + (isEn ? 'No exact verses found.' : 'لم يتم العثور على آيات مطابقة، جرب كتابة أصل اللفظ.') + '</div>';
                } else {
                    m2.slice(0, 30).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        var badge = getSurahTypeBadge(v.surah.revelationType, isEn);
                        out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + '] ' + badge + '</div><div>' + hl(v.text, word, isEn) + '</div></div>';
                    });
                }
            }
            else if (lvl === 3) {
                var bHits = await searchBibleBolls(word, isEn);
                var otHits = bHits.filter(function(x) { return x.book >= 1 && x.book <= 39; }).slice(0, 12);
                var ntHits = bHits.filter(function(x) { return x.book >= 40 && x.book <= 66; }).slice(0, 12);

                out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Old Testament (Torah & Prophets):' : '1. العهد القديم (التوراة والأنبياء):') + '</span>';
                if (otHits.length === 0) {
                    out += '<div>' + (isEn ? 'No matching passages in the Old Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد القديم.') + '</div>';
                } else {
                    otHits.forEach(function(item) {
                        var bName = isEn ? (BIBLE_BOOKS_EN[item.book - 1] || ('Book ' + item.book)) : (BIBLE_BOOKS_AR[item.book - 1] || ('سفر ' + item.book));
                        out += '<div class="verse-item"><div class="verse-meta">[' + bName + ' ' + item.chapter + ':' + item.verse + ']</div><div>' + hl(noHtml(item.text), word, isEn) + '</div></div>';
                    });
                }
                out += '</div>';

                out += '<div class="section-block"><span class="section-label">' + (isEn ? '2. New Testament (Gospels & Epistles):' : '2. العهد الجديد (الأناجيل والرسائل):') + '</span>';
                if (ntHits.length === 0) {
                    out += '<div>' + (isEn ? 'No matching passages in the New Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد الجديد.') + '</div>';
                } else {
                    ntHits.forEach(function(item) {
                        var bName = isEn ? (BIBLE_BOOKS_EN[item.book - 1] || ('Book ' + item.book)) : (BIBLE_BOOKS_AR[item.book - 1] || ('سفر ' + item.book));
                        out += '<div class="verse-item"><div class="verse-meta">[' + bName + ' ' + item.chapter + ':' + item.verse + ']</div><div>' + hl(noHtml(item.text), word, isEn) + '</div></div>';
                    });
                }
                out += '</div>';
            }
            else if (lvl === 4) {
                var sunni = await getSunniHadith(isEn);
                var bareW = cleanW.replace(/^ال/, '');
                var sFound = sunni.filter(function(h) {
                    var txt = isEn ? h.text.toLowerCase() : normAr(h.text);
                    return txt.indexOf(cleanW) !== -1 || (bareW.length >= 2 && txt.indexOf(bareW) !== -1);
                }).slice(0, 8);
                var shia = await getShiaHadith(word, isEn);
                var allH = sFound.concat(shia.slice(0, 5));

                out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Hadith Narrations:' : '1. المرويات الحديثية:') + '</span>';
                if (allH.length === 0) {
                    out += '<div>' + (isEn ? 'No matching Hadith narrations found.' : 'لم يتم العثور على مرويات حديثية مطابقة لهذا اللفظ.') + '</div>';
                } else {
                    allH.forEach(function(item) {
                        out += '<div class="verse-item"><div class="verse-meta">' + item.source + ' (' + item.num + ')</div><div>' + hl(item.text, word, isEn) + '</div></div>';
                    });
                }
                out += '</div>';

                var talmudHits = await getTalmudMishnah(word, isEn);
                out += '<div class="section-block"><span class="section-label">' + (isEn ? '2. Talmud (Mishnah):' : '2. التلمود (المشنا):') + '</span>';
                if (talmudHits.length === 0) {
                    out += '<div>' + (isEn ? 'No matching passages found in Talmud / Mishnah.' : 'لم يتم العثور على نصوص مطابقة في التلمود (المشنا).') + '</div>';
                } else {
                    talmudHits.forEach(function(tItem) {
                        out += '<div class="verse-item"><div class="verse-meta">[' + tItem.ref + ']</div><div dir="ltr" style="text-align:left;">' + hl(tItem.text, tItem.enTerm, true) + '</div></div>';
                    });
                }
                out += '</div>';
            }
            else if (lvl === 5) {
                var m5 = await getQuranMatches(word, isEn);
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Criterion Rule:' : 'قاعدة الإحكام:') + '</span><div>' + (isEn ? 'Every concept must be weighed against the clear decisive verses of the Quran.' : 'يُرد المتشابه والمرويات إلى الآيات المحكمات البينات في كتاب الله لفهم الحكم الصحيح.') + '</div></div>';
                if (m5.length > 0) {
                    out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Key Reference Verses:' : 'شواهد محورية من التنزيل:') + '</span>';
                    m5.slice(0, 8).forEach(function(v) {
                        var sName = isEn ? v.surah.englishName : v.surah.name;
                        var badge = getSurahTypeBadge(v.surah.revelationType, isEn);
                        out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + '] ' + badge + '</div><div>' + hl(v.text, word, isEn) + '</div></div>';
                    });
                    out += '</div>';
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
            loader.style.display = 'none';
            wrapper.style.display = 'flex';
        }
    }
});
