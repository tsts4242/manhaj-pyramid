var cachedBible = null;
var cachedHadith = null;
var BOOKS_AR = ["التكوين","الخروج","اللاويين","العدد","التثنية","يشوع","القضاة","راعوث","صموئيل الأول","صموئيل الثاني","ملوك الأول","ملوك الثاني","أخبار الأيام الأول","أخبار الأيام الثاني","عزرا","نحميا","أستير","أيوب","المزامير (الزبور)","الأمثال","الجامعة","نشيد الأنشاد","إشعياء","إرميا","مراثي إرميا","حزقيال","دانيال","هوشع","يوئيل","عاموس","عوبديا","يونان","ميخا","ناحوم","حبقوق","صفنيا","حجي","زكريا","ملاخي","إنجيل متى","إنجيل مرقس","إنجيل لوقا","إنجيل يوحنا","أعمال الرسل","رومية","كورنثوس الأولى","كورنثوس الثانية","غلاطية","أفسس","فيلبي","كولوسي","تسالونيكي الأولى","تسالونيكي الثانية","تيموثاوس الأولى","تيموثاوس الثانية","تيطس","فليمون","العبرانيين","يعقوب","بطرس الأولى","بطرس الثانية","يوحنا الأولى","يوحنا الثانية","يوحنا الثالثة","يهوذا","رؤيا يوحنا"];

function hl(t, w) {
    if (!w || !t) return t;
    return t.split(w).join('<mark class="highlight-word">' + w + '</mark>');
}

function noTash(t) {
    return t ? t.replace(/[\u064B-\u065F\u0670]/g, '') : '';
}

function noHtml(t) {
    return t ? t.replace(/<[^>]*>/g, '') : '';
}

function togglePyramid() {
    var b = document.getElementById('pyramid-box');
    var i = document.getElementById('pyramid-icon');
    if (b.style.display === 'block') {
        b.style.display = 'none';
        i.textContent = '▲';
    } else {
        b.style.display = 'block';
        i.textContent = '▼';
    }
}

function returnToMain() {
    document.getElementById('pyramid-box').style.display = 'none';
    document.getElementById('pyramid-icon').textContent = '▲';
    window.scrollTo(0, 0);
}

function clearInput() {
    document.getElementById('quran-word').value = '';
    document.getElementById('results-wrapper').style.display = 'none';
}

async function getBible() {
    if (cachedBible) return cachedBible;
    var r = await fetch('https://githubusercontent.com');
    cachedBible = await r.json();
    return cachedBible;
}

async function getHadith() {
    if (cachedHadith) return cachedHadith;
    var r1 = await fetch('https://jsdelivr.net').then(function(r){ return r.json(); }).catch(function(){ return null; });
    var r2 = await fetch('https://jsdelivr.net').then(function(r){ return r.json(); }).catch(function(){ return null; });
    var list = [];
    if (r1 && r1.hadiths) r1.hadiths.forEach(function(h){ list.push({ source: "صحيح البخاري", num: h.hadithnumber, text: h.text }); });
    if (r2 && r2.hadiths) r2.hadiths.forEach(function(h){ list.push({ source: "صحيح مسلم", num: h.hadithnumber, text: h.text }); });
    cachedHadith = list;
    return list;
}

async function startContemplation() {
    var word = document.getElementById('quran-word').value.trim();
    if (!word) {
        alert('يرجى كتابة اللفظ المراد تدبره');
        return;
    }
    var loader = document.getElementById('loader');
    var wrapper = document.getElementById('results-wrapper');
    var btn = document.getElementById('submit-btn');
    wrapper.style.display = 'none';
    loader.style.display = 'block';
    btn.disabled = true;

    var enc = encodeURIComponent(word);
    var cleanW = noTash(word);

    try {
        var qRes = await fetch('https://alquran.cloud' + enc + '/all/quran-simple-clean').then(function(r){ return r.json(); }).catch(function(){ return null; });
        var bData = await getBible().catch(function(){ return null; });
        var hData = await getHadith().catch(function(){ return []; });
        var wikiRes = await fetch('https://wikipedia.org' + enc).then(function(r){ return r.json(); }).catch(function(){ return null; });
        var sciRes = await fetch('https://wikipedia.org' + encodeURIComponent(word + ' علم فيزياء كون نفس') + '&format=json&origin=*').then(function(r){ return r.json(); }).catch(function(){ return null; });
        var talRes = await fetch('https://wikipedia.org' + encodeURIComponent(word + ' التلمود المشناه') + '&format=json&origin=*').then(function(r){ return r.json(); }).catch(function(){ return null; });

        var matches = (qRes && qRes.data && qRes.data.matches) ? qRes.data.matches : [];
        var root = cleanW.replace(/^ال/, '').replace(/^[وميتنأإ]/, '').replace(/[ةونيا]$/, '');
        if (root.length > 3) root = root.replace(/[اوي]/g, '');
        var rootStr = root.length >= 2 ? root.split('').join(' - ') : cleanW.split('').join(' - ');

        var derivs = [];
        matches.forEach(function(m) {
            noTash(m.text).split(/\s+/).forEach(function(w) {
                if (w.indexOf(cleanW.replace(/^ال/, '')) !== -1 && derivs.indexOf(w) === -1) derivs.push(w);
            });
        });

        // المستوى 1
        var h1 = '<div class="tool-tag">علوم المستوى: الصرف • الاشتقاق • الترادف</div>';
        h1 += '<div class="section-block"><span class="section-label">1. الصرف والاشتقاق:</span><div>الجذر الاشتقاقي للفظ (' + word + '): <strong>(' + rootStr + ')</strong></div></div>';
        if (derivs.length > 0) {
            h1 += '<div class="section-block"><span class="section-label">2. التصريفات والمشتقات القرآنية (' + derivs.length + '):</span><div>';
            derivs.forEach(function(d){ h1 += '<span class="stat-pill">' + d + '</span>'; });
            h1 += '</div></div>';
        }
        var dictTxt = (wikiRes && wikiRes.extract) ? wikiRes.extract : ('مقابلة لفظ (' + word + ') بالألفاظ القريبة منه في اللسان العربي.');
        h1 += '<div class="section-block"><span class="section-label">3. الترادف والدلالة المعجمية:</span><div>' + dictTxt + '</div></div>';
        document.getElementById('content-1').innerHTML = h1;

        // المستوى 2
        var h2 = '<div class="tool-tag">علوم المستوى: النحو • الإعراب • البناء (بداية تكوّن الفهم)</div>';
        if (matches.length > 0) {
            h2 += '<div><span class="ayah-count-banner">إجمالي الآيات: ' + matches.length + ' آية</span></div><div class="all-ayahs-list">';
            matches.forEach(function(m, i) {
                h2 += '<div class="ayah-box"><div><span class="ayah-num-badge">' + (i + 1) + '</span> ﴿ ' + hl(noTash(m.text), word) + ' ﴾</div><span class="surah-tag">' + m.surah.name + ' — آية ' + m.numberInSurah + '</span></div>';
            });
            h2 += '</div>';
        } else {
            h2 += '<div>' + hl('لم يرد لفظ ' + word + ' بصيغته الحرفية في القرآن.', word) + '</div>';
        }
        document.getElementById('content-2').innerHTML = h2;

        // المستوى 3
        var h3 = '<div class="tool-tag">علوم المستوى: الحكمة • البيان • الإنشاء • التداولية (التوراة والزبور والإنجيل وكشف التضارب)</div>';
        var bMatches = [];
        if (Array.isArray(bData)) {
            bData.forEach(function(bk, bi) {
                var bName = BOOKS_AR[bi] || ('سفر ' + (bi + 1));
                var cat = (bi <= 4) ? "التوراة" : (bi === 18) ? "الزبور" : (bi >= 39) ? "الإنجيل" : "أسفار الأنبياء";
                bk.chapters.forEach(function(ch, ci) {
                    ch.forEach(function(v, vi) {
                        var cv = noTash(v);
                        if (cv.indexOf(cleanW) !== -1) bMatches.push({ bName: bName, cat: cat, ch: ci + 1, v: vi + 1, text: cv });
                    });
                });
            });
        }
        if (bMatches.length > 0) {
            h3 += '<div><span class="ayah-count-banner">المواضع في الكتب السابقة: ' + bMatches.length + '</span></div><div class="all-ayahs-list">';
            bMatches.forEach(function(it, i) {
                h3 += '<div class="scripture-box"><div><span class="ayah-num-badge">' + (i + 1) + '</span><span class="book-category-badge">' + it.cat + '</span><strong>' + it.bName + ' — إصحاح (' + it.ch + ') : فقرة (' + it.v + ')</strong></div><div style="margin-top:5px;">« ' + hl(it.text, word) + ' »</div></div>';
            });
            h3 += '</div>';
            var conflicts3 = bMatches.filter(function(it){ return /(ابن الله|صلب|الآب والابن|ندم الرب|تعب|سكر نوح|اقتلوا كل|ذبح إسحاق)/.test(it.text); });
            if (conflicts3.length > 0) {
                h3 += '<div class="conflict-alert-box"><span class="conflict-alert-title">🚨 تنبيه: تم رصد (' + conflicts3.length + ') موضع تضارب مع محكم القرآن:</span>';
                conflicts3.slice(0, 6).forEach(function(c) {
                    h3 += '<div class="conflict-item"><strong>[' + c.cat + '] ' + c.bName + ' (' + c.ch + ':' + c.v + '):</strong> « ' + hl(c.text, word) + ' »</div>';
                });
                h3 += '</div>';
            } else {
                h3 += '<div class="no-conflict-box">✅ لم يُرصد تضارب عقدي مباشر في هذه المواضع مع القرآن الكريم.</div>';
            }
        } else {
            h3 += '<div>' + hl('لم يُعثر على لفظ ' + word + ' في التوراة والزبور والإنجيل.', word) + '</div>';
        }
        document.getElementById('content-3').innerHTML = h3;

        // المستوى 4
        var h4 = '<div class="tool-tag">علوم المستوى: المقارنة • المقاربة • الترتيب • الترابط (السنة والمشناه والتلمود في ميزان القرآن)</div>';
        var hMatches = Array.isArray(hData) ? hData.filter(function(h){ return noTash(h.text).indexOf(cleanW) !== -1; }) : [];
        var tMatches = (talRes && talRes.query && talRes.query.search) ? talRes.query.search.slice(0, 5) : [];
        h4 += '<div><span class="ayah-count-banner">السنة: ' + hMatches.length + ' حديث | المشناه والتلمود: ' + tMatches.length + ' موضع</span></div>';
        if (matches.length > 0) {
            var firstAyah = matches[0];
            h4 += '<div class="ayah-box" style="border-right-color:#eab308;"><strong>⚖️ الميزان القرآني الحاكم:</strong> ﴿ ' + hl(noTash(firstAyah.text), word) + ' ﴾ <span class="surah-tag">' + firstAyah.surah.name + ': ' + firstAyah.numberInSurah + '</span></div>';
        }
        if (hMatches.length > 0 || tMatches.length > 0) {
            h4 += '<div class="all-ayahs-list">';
            hMatches.slice(0, 30).forEach(function(h, i) {
                h4 += '<div class="hadith-box"><span class="ayah-num-badge">' + (i + 1) + '</span><strong>' + h.source + ' — حديث (' + h.num + '):</strong> « ' + hl(noTash(h.text), word) + ' »</div>';
            });
            tMatches.forEach(function(t, i) {
                h4 += '<div class="talmud-box"><span class="ayah-num-badge">' + (hMatches.length + i + 1) + '</span><strong>المشناه والتلمود (' + t.title + '):</strong> « ' + hl(noTash(noHtml(t.snippet)), word) + ' »</div>';
            });
            h4 += '</div>';
        }
        document.getElementById('content-4').innerHTML = h4;

        // المستوى 5
        var h5 = '<div class="tool-tag">علوم المستوى: الأحكام القطعية (التحريم الصريح و"لا" الناهية الجازمة) وتمييز المحكم من المتشابه في الكتب السماوية حصراً</div>';
        var nafiya = /(^|\s)(لا|ولا)\s+(تزر|تملك|تغني|تجزي|تدركه|تعلمون|تؤمنون|تعقلون|تشعرون|تبصرون)\b/;
        var rulingRx = /(حرمت عليكم|حرم عليكم|حرام|محرما|انما حرم|ولا تقتلوا|والسارق والسارقة|ولا تقربوا الزنا|كتب عليكم|فرض الله)|(^|\s)(لا|ولا)\s+ت[أ-ي]{2,}(وا|ا)\b|(^|\s)(لا|ولا)\s+(تقتل|تزن|تسرق|تشرك|تقرب|تفسد|تعتد|تبخس|تأكل)\b/;
        var muhkam = [];
        var mutashabih = [];
        matches.forEach(function(m) {
            var ct = noTash(m.text);
            if (rulingRx.test(ct) && !nafiya.test(ct)) muhkam.push({ s: m.surah.name, n: m.numberInSurah, text: ct });
            else mutashabih.push({ s: m.surah.name, n: m.numberInSurah, text: ct });
        });
        h5 += '<div><span class="ayah-count-banner">آيات محكمة قطعية: ' + muhkam.length + ' | آيات متشابهة/سردية: ' + mutashabih.length + '</span></div>';
        if (muhkam.length > 0) {
            muhkam.forEach(function(it) {
                h5 += '<div class="muhkam-box"><span class="muhkam-badge">حكم قطعي / نهي جازم</span> ﴿ ' + hl(it.text, word) + ' ﴾ <span class="surah-tag">' + it.s + ': ' + it.n + '</span></div>';
            });
        } else {
            h5 += '<div class="ayah-box">' + hl('لم يرد للفظ ' + word + ' نص تحريم صريح أو نهي مباشر بـ (لا الناهية) في القرآن.', word) + '</div>';
        }
        document.getElementById('content-5').innerHTML = h5;

        // المستوى 6
        var h6 = '<div class="tool-tag">علوم القمة: استنباط المتشابه • تأويل المعنى الخفي بين السطور • العلوم الحديثة</div>';
        if (mutashabih.length > 0) {
            h6 += '<div class="all-ayahs-list">';
            mutashabih.forEach(function(it, i) {
                h6 += '<div class="tawil-box"><span class="mutashabih-badge">استنباط وتأويل (' + (i + 1) + ')</span> ﴿ ' + hl(it.text, word) + ' ﴾ <span class="surah-tag">' + it.s + ': ' + it.n + '</span><div class="hidden-meaning-note">💡 يُستنبط المعنى الخفي من سياق الآية ومقصد السورة الكلي.</div></div>';
            });
            h6 += '</div>';
        }
        var sciItems = (sciRes && sciRes.query && sciRes.query.search) ? sciRes.query.search.slice(0, 2) : [];
        sciItems.forEach(function(s) {
            h6 += '<div class="tawil-box" style="border-right-color:#0284c7;"><strong>🔬 معطى علمي (' + s.title + '):</strong> ' + hl(noHtml(s.snippet), word) + '</div>';
        });
        h6 += '<div class="omega-boundary-box"><strong>Ω ضابط القمة:</strong> ' + hl('هذا الاستنباط حول لفظ ' + word + ' اجتهاد ظني قابل للطعن، ويقف العقل عند حدود علم الغيب (Ω).', word) + '</div>';
        document.getElementById('content-6').innerHTML = h6;

    } catch (e) {
        console.error(e);
    } finally {
        loader.style.display = 'none';
        btn.disabled = false;
        wrapper.style.display = 'flex';
    }
}

