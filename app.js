var cachedQuran = {};
var cachedBible = { ar: null, en: null };
var cachedSunniHadith = { ar: null, en: null };
var levelCache = {};

var BOOKS_AR = ["التكوين","الخروج","اللاويين","العدد","التثنية","يشوع","القضاة","راعوث","صموئيل الأول","صموئيل الثاني","ملوك الأول","ملوك الثاني","أخبار الأيام الأول","أخبار الأيام الثاني","عزرا","نحميا","أستير","أيوب","المزامير (الزبور)","الأمثال","الجامعة","نشيد الأنشاد","إشعياء","إرميا","مراثي إرميا","حزقيال","دانيال","هوشع","يوئيل","عاموس","عوبديا","يونان","ميخا","ناحوم","حبقوق","صفنيا","حجي","زكريا","ملاخي","إنجيل متى","إنجيل مرقس","إنجيل لوقا","إنجيل يوحنا","أعمال الرسل","رومية","كورنثوس الأولى","كورنثوس الثانية","غلاطية","أفسس","فيلبي","كولوسي","تسالونيكي الأولى","تسالونيكي الثانية","تيموثاوس الأولى","تيموثاوس الثانية","تيطس","فليمون","العبرانيين","يعقوب","بطرس الأولى","بطرس الثانية","يوحنا الأولى","يوحنا الثانية","يوحنا الثالثة","يهوذا","رؤيا يوحنا"];

var BOOKS_EN = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

function isEnglishText(t) { return /[a-zA-Z]/.test(t); }
function noTash(t) { return t ? t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') : ''; }
function noHtml(t) { return t ? t.replace(/<[^>]*>/g, '') : ''; }

function normAr(t) {
    if (!t) return '';
    return noTash(t)
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'ء')
        .replace(/ئ/g, 'ء')
        .replace(/صلوه/g, 'صلاه')
        .replace(/زكوه/g, 'زكاه')
        .replace(/حيوه/g, 'حياه')
        .replace(/ربوا/g, 'ربا');
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildArabicFlexibleRegex(word) {
    var clean = normAr(word.trim());
    if (!clean) return null;
    var tash = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*';
    var pattern = '';
    for (var i = 0; i < clean.length; i++) {
        var ch = clean[i];
        if (ch === 'ا') {
            pattern += '[اأإآٱ]' + tash;
        } else if (ch === 'ه') {
            pattern += '[ةه]' + tash;
        } else if (ch === 'ي') {
            pattern += '[يى]' + tash;
        } else if (ch === 'ل' && i + 1 < clean.length && clean[i + 1] === 'ا') {
            pattern += 'ل' + tash + '[اأإآٱو]' + tash;
            i++;
        } else {
            pattern += escapeRegExp(ch) + tash;
        }
    }
    try {
        return new RegExp('(' + pattern + ')', 'g');
    } catch (e) {
        return null;
    }
}

function hl(t, w, isEn) {
    if (!w || !t) return t;
    if (isEn) {
        var esc = escapeRegExp(w);
        return t.replace(new RegExp('(' + esc + ')', 'gi'), '<mark class="highlight-word">$1</mark>');
    }
    var rx = buildArabicFlexibleRegex(w);
    if (rx) {
        return t.replace(rx, '<mark class="highlight-word">$1</mark>');
    }
    return t.split(w).join('<mark class="highlight-word">' + w + '</mark>');
}

function togglePyramid(num) {
    var b1 = document.getElementById('pyramid-box-1');
    var b2 = document.getElementById('pyramid-box-2');
    var target = document.getElementById('pyramid-box-' + num);
    if (num === 1 && b2) b2.style.display = 'none';
    if (num === 2 && b1) b1.style.display = 'none';
    if (target) {
        target.style.display = (target.style.display === 'block') ? 'none' : 'block';
    }
}

function returnToMain() {
    var b1 = document.getElementById('pyramid-box-1');
    var b2 = document.getElementById('pyramid-box-2');
    if (b1) b1.style.display = 'none';
    if (b2) b2.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stopSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    var lBtn = document.getElementById('listen-btn');
    if (lBtn) {
        lBtn.textContent = 'الاستماع';
        lBtn.classList.remove('speaking');
    }
}

function toggleListen() {
    if (!('speechSynthesis' in window)) {
        alert('المتصفح لا يدعم القراءة الصوتية / Speech not supported');
        return;
    }
    var lBtn = document.getElementById('listen-btn');
    if (window.speechSynthesis.speaking) {
        stopSpeech();
        return;
    }
    var activeCard = document.querySelector('.level-card.active-card');
    if (!activeCard) {
        alert('يرجى بدء التدبر وعرض نتيجة مستوى أولاً للاستماع إليها');
        return;
    }
    var textToRead = activeCard.innerText || activeCard.textContent || '';
    textToRead = textToRead.trim();
    if (!textToRead) return;

    var isEn = activeCard.getAttribute('dir') === 'ltr';
    var utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isEn ? 'en-US' : 'ar-SA';
    utterance.rate = 0.95;

    utterance.onend = function() {
        stopSpeech();
    };
    utterance.onerror = function() {
        stopSpeech();
    };

    if (lBtn) {
        lBtn.textContent = isEn ? 'Stop' : 'إيقاف';
        lBtn.classList.add('speaking');
    }
    window.speechSynthesis.speak(utterance);
}

function clearInput() {
    stopSpeech();
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
    cachedQuran = {};
    levelCache = {};
    document.querySelectorAll('.level-btn').forEach(function(b) { b.classList.remove('active'); });
}

function getSurahTypeLabel(revType, isEn) {
    if (!revType) return '';
    var isMeccan = revType.toLowerCase() === 'meccan';
    if (isEn) {
        return isMeccan ? 'Meccan' : 'Medinan';
    }
    return isMeccan ? 'مكية' : 'مدنية';
}

async function getQuranMatches(word, isEn) {
    var cleanKey = isEn ? word.toLowerCase() : normAr(word);
    var key = (isEn ? "en_" : "ar_") + cleanKey;
    if (cachedQuran[key]) return cachedQuran[key];

    var ed = isEn ? 'en.sahih' : 'quran-simple-clean';
    var queries = [word];
    if (!isEn) {
        var n = normAr(word);
        if (queries.indexOf(n) === -1) queries.push(n);
        var othmani = n.replace(/صلاه/g, 'صلوة').replace(/زكاه/g, 'زكوة').replace(/حياه/g, 'حيوة');
        if (queries.indexOf(othmani) === -1) queries.push(othmani);
        var noAl = n.replace(/^ال/, '');
        if (noAl.length >= 2 && queries.indexOf(noAl) === -1) queries.push(noAl);
    }

    var allMatches = [];
    var seen = {};
    for (var i = 0; i < queries.length; i++) {
        var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(queries[i]) + '/all/' + ed;
        var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
        var m = (res && res.data && res.data.matches) ? res.data.matches : [];
        for (var j = 0; j < m.length; j++) {
            var uid = m[j].surah.number + ':' + m[j].numberInSurah;
            if (!seen[uid]) {
                if (isEn) {
                    if (m[j].text.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
                        seen[uid] = true;
                        allMatches.push(m[j]);
                    }
                } else {
                    var targetNorm = normAr(word).replace(/^ال/, '');
                    var verseNorm = normAr(m[j].text);
                    if (verseNorm.indexOf(targetNorm) !== -1) {
                        seen[uid] = true;
                        allMatches.push(m[j]);
                    }
                }
            }
        }
    }
    cachedQuran[key] = allMatches;
    return allMatches;
}

async function searchBollsBible(word, isEn) {
    var trans = isEn ? 'KJV' : 'SVD';
    var url = 'https://bolls.life/find/' + trans + '/?search=' + encodeURIComponent(word);
    var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return []; });
    if (!Array.isArray(res)) return { oldT: [], newT: [] };

    var oldT = [];
    var newT = [];
    for (var i = 0; i < res.length; i++) {
        var item = res[i];
        var bookIdx = (item.book || 1) - 1;
        var bName = isEn ? (BOOKS_EN[bookIdx] || ('Book ' + item.book)) : (BOOKS_AR[bookIdx] || ('سفر ' + item.book));
        var entry = {
            book: bName,
            ch: item.chapter,
            vs: item.verse,
            text: noHtml(item.text || '')
        };
        if (bookIdx < 39) {
            if (oldT.length < 12) oldT.push(entry);
        } else {
            if (newT.length < 12) newT.push(entry);
        }
        if (oldT.length >= 12 && newT.length >= 12) break;
    }
    return { oldT: oldT, newT: newT };
}

async function translateToEnForTalmud(word) {
    var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=ar|en';
    var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
    if (res && res.responseData && res.responseData.translatedText) {
        return res.responseData.translatedText.replace(/[^a-zA-Z\s]/g, '').trim();
    }
    return word;
}

async function getTalmudMishnah(word, isEn) {
    var searchWord = isEn ? word : await translateToEnForTalmud(word);
    if (!searchWord) return [];
    var url = 'https://www.sefaria.org/api/search-wrapper?query=' + encodeURIComponent(searchWord) + '&type=text&field=naive_lemmatizer&filters[]=Mishnah&filters[]=Talmud&size=10';
    var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
    var hits = (res && res.hits && res.hits.hits) ? res.hits.hits : [];
    return hits.map(function(h) {
        var src = h._source || {};
        var hlText = (h.highlight && h.highlight.naive_lemmatizer && h.highlight.naive_lemmatizer.length > 0)
            ? h.highlight.naive_lemmatizer.join(' ... ')
            : (src.versionTitle || '');
        return {
            ref: src.ref || 'Mishnah / Talmud',
            text: noHtml(hlText),
            queryUsed: searchWord
        };
    }).filter(function(x) { return x.text.length > 0; });
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

function startContemplation() {
    selectLevel(1);
}

async function selectLevel(lvl) {
    stopSpeech();
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
        "المستوى الثالث: الكتب السابقة (العهد القديم والجديد)",
        "المستوى الرابع: الميزان القرآني والمرويات والتلمود",
        "المستوى الخامس: الآيات المحكمات والأحكام",
        "المستوى السادس: علوم القمة والتأويل"
    ];
    var hEn = [
        "Level 1: Morphology & Lexicon",
        "Level 2: Syntax & Quranic Verses",
        "Level 3: Previous Scriptures (Old & New Testaments)",
        "Level 4: Quranic Criterion, Narrations & Talmud",
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
    var loaderLine = document.querySelector('.loader-single-line');
    var btn = document.getElementById('submit-btn');

    if (loaderLine) {
        loaderLine.textContent = isEn ? 'Contemplating across levels...' : 'جاري التدبر بحسب المستويات';
    }

    var cacheKey = (isEn ? "EN_" : "AR_") + (isEn ? word.toLowerCase() : normAr(word)) + "_L" + lvl;
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
                out += '<div class="section-block">' + (isEn ? 'No exact verses found. Try root word.' : 'لم يتم العثور على آيات مطابقة، جرب كتابة اللفظ بدون زوائد.') + '</div>';
            } else {
                m2.slice(0, 30).forEach(function(v) {
                    var sName = isEn ? v.surah.englishName : v.surah.name;
                    var sType = getSurahTypeLabel(v.surah.revelationType, isEn);
                    out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ' — ' + sType + ']</div><div class="verse-text">' + hl(v.text, word, isEn) + '</div></div>';
                });
            }
        }
        else if (lvl === 3) {
            var bibleRes = await searchBollsBible(word, isEn);
            out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Old Testament:' : '1. العهد القديم (التوراة والأسفار):') + '</span></div>';
            if (bibleRes.oldT.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No matching passages in Old Testament.' : 'لم يتم العثور على نصوص مطابقة في العهد القديم.') + '</div>';
            } else {
                bibleRes.oldT.forEach(function(bm) {
                    out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div class="verse-text">' + hl(bm.text, word, isEn) + '</div></div>';
                });
            }

            out += '<div class="section-block" style="margin-top:14px;"><span class="section-label">' + (isEn ? '2. New Testament:' : '2. العهد الجديد (الأناجيل والرسائل):') + '</span></div>';
            if (bibleRes.newT.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No matching passages in New Testament.' : 'لم يتم العثور على نصوص مطابقة في العهد الجديد.') + '</div>';
            } else {
                bibleRes.newT.forEach(function(bm) {
                    out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div class="verse-text">' + hl(bm.text, word, isEn) + '</div></div>';
                });
            }
        }
        else if (lvl === 4) {
            out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Islamic Narrations:' : '1. المرويات الحديثية:') + '</span></div>';
            var sunni = await getSunniHadith(isEn);
            var sFound = sunni.filter(function(h) {
                var txt = isEn ? h.text.toLowerCase() : normAr(h.text);
                return txt.indexOf(cleanW) !== -1;
            }).slice(0, 6);
            var shia = await getShiaHadith(word, isEn);
            var ibadi = await getIbadiHadith(word, isEn);
            var allH = sFound.concat(shia.slice(0, 4)).concat(ibadi.slice(0, 3));

            if (allH.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No narrations retrieved for this term.' : 'لم يتم العثور على مرويات مطابقة لهذا اللفظ في قواعد البيانات المتاحة.') + '</div>';
            } else {
                allH.forEach(function(item) {
                    out += '<div class="verse-item"><div class="verse-meta">' + item.source + ' (' + item.num + ')</div><div class="verse-text">' + hl(item.text, word, isEn) + '</div></div>';
                });
            }

            out += '<div class="section-block" style="margin-top:16px;"><span class="section-label">' + (isEn ? '2. Talmud (Mishnah):' : '2. التلمود (المشنا):') + '</span></div>';
            var talmudHits = await getTalmudMishnah(word, isEn);
            if (talmudHits.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No matching entries found in Mishnah / Talmud.' : 'لم يتم العثور على نصوص مطابقة في التلمود (المشنا) لهذا اللفظ.') + '</div>';
            } else {
                talmudHits.forEach(function(th) {
                    out += '<div class="verse-item" dir="ltr" style="text-align:left;"><div class="verse-meta">[Talmud / Mishnah — ' + th.ref + ']</div><div class="verse-text">' + hl(th.text, th.queryUsed, true) + '</div></div>';
                });
            }
        }
        else if (lvl === 5) {
            var m5 = await getQuranMatches(word, isEn);
            out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Criterion Rule:' : 'قاعدة الإحكام:') + '</span><div>' + (isEn ? 'Every concept must be weighed against the clear decisive verses of the Quran.' : 'يُرد المتشابه والمرويات إلى الآيات المحكمات البينات في كتاب الله لفهم الحكم الصحيح.') + '</div></div>';
            if (m5.length > 0) {
                out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Key Reference Verses:' : 'شواهد محورية من التنزيل:') + '</span></div>';
                m5.slice(0, 6).forEach(function(v) {
                    var sName = isEn ? v.surah.englishName : v.surah.name;
                    var sType = getSurahTypeLabel(v.surah.revelationType, isEn);
                    out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ' — ' + sType + ']</div><div class="verse-text">' + hl(v.text, word, isEn) + '</div></div>';
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
