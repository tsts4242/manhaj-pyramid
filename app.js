var cachedQuran = {};
var cachedBible = { ar: null, en: null };
var cachedSunniHadith = { ar: null, en: null };
var levelCache = {};

var BOOKS_AR = ["التكوين","الخروج","اللاويين","العدد","التثنية","يشوع","القضاة","راعوث","صموئيل الأول","صموئيل الثاني","ملوك الأول","ملوك الثاني","أخبار الأيام الأول","أخبار الأيام الثاني","عزرا","نحميا","أستير","أيوب","المزامير (الزبور)","الأمثال","الجامعة","نشيد الأنشاد","إشعياء","إرميا","مراثي إرميا","حزقيال","دانيال","هوشع","يوئيل","عاموس","عوبديا","يونان","ميخا","ناحوم","حبقوق","صفنيا","حجي","زكريا","ملاخي","إنجيل متى","إنجيل مرقس","إنجيل لوقا","إنجيل يوحنا","أعمال الرسل","رومية","كورنثوس الأولى","كورنثوس الثانية","غلاطية","أفسس","فيلبي","كولوسي","تسالونيكي الأولى","تسالونيكي الثانية","تيموثاوس الأولى","تيموثاوس الثانية","تيطس","فليمون","العبرانيين","يعقوب","بطرس الأولى","بطرس الثانية","يوحنا الأولى","يوحنا الثانية","يوحنا الثالثة","يهوذا","رؤيا يوحنا"];

var BOOKS_EN = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

function isEnglishText(t) { return /[a-zA-Z]/.test(t); }
function noTash(t) { return t ? t.replace(/[\u064B-\u065F\u0670]/g, '') : ''; }
function noHtml(t) { return t ? t.replace(/<[^>]*>/g, '') : ''; }

function hl(t, w, isEn) {
    if (!w || !t) return t;
    if (isEn) {
        var esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return t.replace(new RegExp('(' + esc + ')', 'gi'), '<mark class="highlight-word">$1</mark>');
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

function clearInput() {
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

async function getQuranMatches(word, isEn) {
    var key = (isEn ? "en_" : "ar_") + word.toLowerCase();
    if (cachedQuran[key]) return cachedQuran[key];
    var ed = isEn ? 'en.sahih' : 'quran-simple-clean';
    var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(word) + '/all/' + ed;
    var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
    var m = (res && res.data && res.data.matches) ? res.data.matches : [];
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
    return res.slice(0, 10).map(function(h) {
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
    var items = (res && res.query && res.query.search) ? res.query.search.slice(0, 5) : [];
    return items.map(function(it, idx) {
        return { source: (isEn ? "Musnad al-Rabi (Ibadi) — " : "مسند الربيع (الإباضية) — ") + it.title, num: idx + 1, text: noHtml(it.snippet) };
    });
}

function startContemplation() {
    selectLevel(1);
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
        "المستوى الثالث: الكتب السابقة (التوراة والإنجيل)",
        "المستوى الرابع: الميزان القرآني والروايات",
        "المستوى الخامس: الأحكام المحكمة والمقاصد",
        "المستوى السادس: علوم القمة والتأويل"
    ];
    var hEn = [
        "Level 1: Morphology & Lexicon",
        "Level 2: Syntax & Quranic Verses",
        "Level 3: Previous Scriptures",
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
    var loaderLine = document.querySelector('.loader-single-line');
    var btn = document.getElementById('submit-btn');

    if (loaderLine) {
        loaderLine.textContent = isEn ? 'Contemplating across levels...' : 'جاري التدبر بحسب المستويات';
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

    var cleanW = isEn ? word.toLowerCase() : noTash(word);
    var enc = encodeURIComponent(word);

    try {
        var out = "";

        if (lvl === 1) {
            var m1 = await getQuranMatches(word, isEn);
            var wDom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
            var wRes = await fetch('https://' + wDom + '/api/rest_v1/page/summary/' + enc).then(function(r) { return r.json(); }).catch(function() { return null; });
            
            if (isEn) {
                var stem = cleanW.replace(/(ing|ed|es|s|ly|ness|ful|less)$/, '');
                out += '<div class="tool-tag">Level Sciences: Morphology • Derivation • Lexicon</div>';
                out += '<div class="section-block"><span class="section-label">1. Stem Analysis:</span><div>Core stem: <strong>(' + stem.toUpperCase() + ')</strong></div></div>';
                out += '<div class="section-block"><span class="section-label">2. Definition:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'Lexical overview of ' + word) + '</div></div>';
                out += '<div class="section-block"><span class="section-label">3. Quranic Frequency:</span><div>Appears in <strong>' + m1.length + '</strong> verse(s).</div></div>';
            } else {
                var root = cleanW.replace(/^ال/, '').replace(/^[وميتنأإ]/, '').replace(/[ةونيا]$/, '');
                if (root.length > 3) root = root.replace(/[اوي]/g, '');
                var rStr = root.length >= 2 ? root.split('').join(' - ') : cleanW.split('').join(' - ');
                out += '<div class="tool-tag">علوم المستوى: الصرف • الاشتقاق • الترادف</div>';
                out += '<div class="section-block"><span class="section-label">1. الجذر اللغوي التقريبي:</span><div><strong>( ' + rStr + ' )</strong></div></div>';
                out += '<div class="section-block"><span class="section-label">2. البيان المعجمي:</span><div>' + ((wRes && wRes.extract) ? wRes.extract : 'مفهوم لفظ (' + word + ') في لسان العرب والسياق المعرفي.') + '</div></div>';
                out += '<div class="section-block"><span class="section-label">3. الإحصاء القرآني:</span><div>ورد هذا اللفظ في <strong>' + m1.length + '</strong> موضعاً في القرآن الكريم.</div></div>';
            }
        } 
        else if (lvl === 2) {
            var m2 = await getQuranMatches(word, isEn);
            out += '<div class="tool-tag">' + (isEn ? 'Level Sciences: Quranic Verses • Context' : 'علوم المستوى: الآيات القرآنية • السياق والسباق') + '</div>';
            if (m2.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No exact verses found. Try root word.' : 'لم يتم العثور على آيات مطابقة تماماً، جرب كتابة اللفظ بدون تشكيل أو زوائد.') + '</div>';
            } else {
                m2.slice(0, 25).forEach(function(v) {
                    var sName = isEn ? v.surah.englishName : v.surah.name;
                    out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ']</div><div class="verse-text">' + hl(v.text, word, isEn) + '</div></div>';
                });
            }
        }
        else if (lvl === 3) {
            var bible = await getBible(isEn);
            out += '<div class="tool-tag">' + (isEn ? 'Level Sciences: Previous Scriptures' : 'علوم المستوى: المقارنة مع الكتب السابقة') + '</div>';
            var bMatches = [];
            if (Array.isArray(bible)) {
                for (var bi = 0; bi < bible.length; bi++) {
                    var bName = isEn ? (BOOKS_EN[bi] || bible[bi].name) : (BOOKS_AR[bi] || bible[bi].name);
                    var chaps = bible[bi].chapters || [];
                    for (var ci = 0; ci < chaps.length; ci++) {
                        var verses = chaps[ci] || [];
                        for (var vi = 0; vi < verses.length; vi++) {
                            var vTxt = isEn ? verses[vi] : noTash(verses[vi]);
                            if (vTxt.toLowerCase().indexOf(cleanW) !== -1) {
                                bMatches.push({ book: bName, ch: ci + 1, vs: vi + 1, text: verses[vi] });
                                if (bMatches.length >= 15) break;
                            }
                        }
                        if (bMatches.length >= 15) break;
                    }
                    if (bMatches.length >= 15) break;
                }
            }
            if (bMatches.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No matching passages found in previous scriptures.' : 'لم يتم العثور على نصوص مطابقة في الأسفار السابقة.') + '</div>';
            } else {
                bMatches.forEach(function(bm) {
                    out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div class="verse-text">' + hl(bm.text, word, isEn) + '</div></div>';
                });
            }
        }
        else if (lvl === 4) {
            out += '<div class="tool-tag">' + (isEn ? 'Level Sciences: Narrations & Criterion' : 'علوم المستوى: المرويات الحديثية والعرض على القرآن') + '</div>';
            var sunni = await getSunniHadith(isEn);
            var sFound = sunni.filter(function(h) {
                var txt = isEn ? h.text.toLowerCase() : noTash(h.text);
                return txt.indexOf(cleanW) !== -1;
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
            out += '<div class="tool-tag">' + (isEn ? 'Level Sciences: Decisive Rulings (Muhkam)' : 'علوم المستوى: الآيات المحكمات واستنباط الأحكام') + '</div>';
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
            out += '<div class="tool-tag">' + (isEn ? 'Level Sciences: Summit Synthesis & Ta\'wil' : 'علوم المستوى: القمة والتأويل النهائي') + '</div>';
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
