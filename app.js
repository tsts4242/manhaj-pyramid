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
    var url = 'https://alquran.cloud' + encodeURIComponent(word) + '/all/' + ed;
    var res = await fetch(url).then(function(r) { return r.json(); }).catch(function() { return null; });
    var m = (res && res.data && res.data.matches) ? res.data.matches : [];
    cachedQuran[key] = m;
    return m;
}

async function getBible(isEn) {
    var lang = isEn ? 'en' : 'ar';
    if (cachedBible[lang]) return cachedBible[lang];
    var url = isEn 
        ? 'https://githubusercontent.com' 
        : 'https://githubusercontent.com';
    var r = await fetch(url).then(function(res) { return res.json(); }).catch(function() { return null; });
    cachedBible[lang] = r;
    return r;
}

async function getSunniHadith(isEn) {
    var lang = isEn ? 'en' : 'ar';
    if (cachedSunniHadith[lang]) return cachedSunniHadith[lang];
    var u1 = isEn 
        ? 'https://jsdelivr.net' 
        : 'https://jsdelivr.net';
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
    var url = 'https://thaqalayn-api.net' + encodeURIComponent(word);
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
