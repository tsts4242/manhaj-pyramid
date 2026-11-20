document.addEventListener('DOMContentLoaded', function() {
    var cachedQuran = {};
    var cachedSunniHadith = { ar: null, en: null };
    var levelCache = {};
    var currentActiveLevel = 1;

    var BOOKS_AR = {
        1:"التكوين",2:"الخروج",3:"اللاويين",4:"العدد",5:"التثنية",6:"يشوع",7:"القضاة",8:"راعوث",
        9:"صموئيل الأول",10:"صموئيل الثاني",11:"ملوك الأول",12:"ملوك الثاني",13:"أخبار الأيام الأول",
        14:"أخبار الأيام الثاني",15:"عزرا",16:"نحميا",17:"أستير",18:"أيوب",19:"المزامير (الزبور)",
        20:"الأمثال",21:"الجامعة",22:"نشيد الأنشاد",23:"إشعياء",24:"إرميا",25:"مراثي إرميا",
        26:"حزقيال",27:"دانيال",28:"هوشع",29:"يوئيل",30:"عاموس",31:"عوبديا",32:"يونان",
        33:"ميخا",34:"ناحوم",35:"حبقوق",36:"صفنيا",37:"حجي",38:"زكريا",39:"ملاخي",
        40:"إنجيل متى",41:"إنجيل مرقس",42:"إنجيل لوقا",43:"إنجيل يوحنا",44:"أعمال الرسل",
        45:"رومية",46:"كورنثوس الأولى",47:"كورنثوس الثانية",48:"غلاطية",49:"أفسس",50:"فيلبي",
        51:"كولوسي",52:"تسالونيكي الأولى",53:"تسالونيكي الثانية",54:"تيموثاوس الأولى",
        55:"تيموثاوس الثانية",56:"تيطس",57:"فليمون",58:"العبرانيين",59:"يعقوب",
        60:"بطرس الأولى",61:"بطرس الثانية",62:"يوحنا الأولى",63:"يوحنا الثانية",
        64:"يوحنا الثالثة",65:"يهوذا",66:"رؤيا يوحنا"
    };

    var BOOKS_EN = {
        1:"Genesis",2:"Exodus",3:"Leviticus",4:"Numbers",5:"Deuteronomy",6:"Joshua",7:"Judges",8:"Ruth",
        9:"1 Samuel",10:"2 Samuel",11:"1 Kings",12:"2 Kings",13:"1 Chronicles",14:"2 Chronicles",
        15:"Ezra",16:"Nehemiah",17:"Esther",18:"Job",19:"Psalms",20:"Proverbs",21:"Ecclesiastes",
        22:"Song of Solomon",23:"Isaiah",24:"Jeremiah",25:"Lamentations",26:"Ezekiel",27:"Daniel",
        28:"Hosea",29:"Joel",30:"Amos",31:"Obadiah",32:"Jonah",33:"Micah",34:"Nahum",35:"Habakkuk",
        36:"Zephaniah",37:"Haggai",38:"Zechariah",39:"Malachi",40:"Matthew",41:"Mark",42:"Luke",
        43:"John",44:"Acts",45:"Romans",46:"1 Corinthians",47:"2 Corinthians",48:"Galatians",
        49:"Ephesians",50:"Philippians",51:"Colossians",52:"1 Thessalonians",53:"2 Thessalonians",
        54:"1 Timothy",55:"2 Timothy",56:"Titus",57:"Philemon",58:"Hebrews",59:"James",
        60:"1 Peter",61:"2 Peter",62:"1 John",63:"2 John",64:"3 John",65:"Jude",66:"Revelation"
    };

    function isEnglishText(t) { return /[a-zA-Z]/.test(t); }
    function noHtml(t) { return t ? t.replace(/<[^>]*>/g, '') : ''; }

    function normAr(t) {
        if (!t) return '';
        return t
            .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ي');
    }

    function hl(text, word, isEn) {
        if (!word || !text) return text;
        if (isEn) {
            var esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return text.replace(new RegExp('(' + esc + ')', 'gi'), '<mark class="highlight-word">$1</mark>');
        }
        var target = normAr(word.trim());
        if (!target) return text;
        var chars = target.split('').map(function(ch) {
            if (ch === 'ا') return '[اأإآٱ]';
            if (ch === 'ه') return '[هة]';
            if (ch === 'ي') return '[يىئ]';
            if (ch === 'و') return '[وؤ]';
            return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        var diac = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*';
        var pattern = chars.join(diac) + diac;
        try {
            var rx = new RegExp('(' + pattern + ')', 'g');
            return text.replace(rx, '<mark class="highlight-word">$1</mark>');
        } catch (e) {
            return text;
        }
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

    document.getElementById('listen-btn').addEventListener('click', function() {
        if (!('speechSynthesis' in window)) {
            alert('المتصفح لا يدعم خاصية القراءة الصوتية.');
            return;
        }
        if (window.speechSynthesis.speaking) {
            stopSpeech();
            return;
        }
        var activeContent = document.getElementById('content-' + currentActiveLevel);
        var textToRead = activeContent ? activeContent.innerText.trim() : '';
        if (!textToRead) {
            alert('يرجى بدء التدبر أولاً لعرض النص المراد الاستماع إليه.');
            return;
        }
        var word = document.getElementById('quran-word').value.trim();
        var isEn = isEnglishText(word);
        var utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = isEn ? 'en-US' : 'ar-SA';
        utterance.rate = 0.95;

        var lBtn = document.getElementById('listen-btn');
        utterance.onstart = function() {
            lBtn.textContent = 'إيقاف';
            lBtn.classList.add('speaking');
        };
        utterance.onend = function() { stopSpeech(); };
        utterance.onerror = function() { stopSpeech(); };

        window.speechSynthesis.speak(utterance);
    });

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

    document.getElementById('clear-btn').addEventListener('click', function() {
        stopSpeech();
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
        var qWord = isEn ? word : normAr(word);
        var url = 'https://api.alquran.cloud/v1/search/' + encodeURIComponent(qWord) + '/all/' + ed;
        try {
            var r = await fetch(url);
            var res = await r.json();
            var m = (res && res.data && res.data.matches) ? res.data.matches : [];
            if (!isEn && m.length === 0 && qWord.indexOf('ال') === 0) {
                var stripped = qWord.slice(2);
                var r2 = await fetch('https://api.alquran.cloud/v1/search/' + encodeURIComponent(stripped) + '/all/' + ed);
                var res2 = await r2.json();
                m = (res2 && res2.data && res2.data.matches) ? res2.data.matches : [];
            }
            cachedQuran[key] = m;
            return m;
        } catch (e) {
            return [];
        }
    }

    async function searchBollsBible(word, isEn) {
        var trans = isEn ? 'WEB' : 'SVD';
        var q = isEn ? word : word.replace(/[ً-ٰٟ]/g, '');
        var url = 'https://bolls.life/v2/find/' + trans + '?search=' + encodeURIComponent(q);
        try {
            var r = await fetch(url);
            var res = await r.json();
            var list = (res && Array.isArray(res.results)) ? res.results : (Array.isArray(res) ? res : []);
            if (!isEn && list.length === 0 && q.indexOf('ال') === 0) {
                var r2 = await fetch('https://bolls.life/v2/find/' + trans + '?search=' + encodeURIComponent(q.slice(2)));
                var res2 = await r2.json();
                list = (res2 && Array.isArray(res2.results)) ? res2.results : (Array.isArray(res2) ? res2 : []);
            }
            return list;
        } catch (e) {
            return [];
        }
    }

    async function getSunniHadith(isEn) {
        var lang = isEn ? 'en' : 'ar';
        if (cachedSunniHadith[lang]) return cachedSunniHadith[lang];
        var u1 = isEn
            ? 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari.min.json'
            : 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json';
        try {
            var r1 = await fetch(u1).then(function(r) { return r.json(); });
            var list = [];
            if (r1 && r1.hadiths) {
                r1.hadiths.forEach(function(h) {
                    list.push({ source: isEn ? "Sahih al-Bukhari" : "صحيح البخاري", num: h.hadithnumber, text: h.text });
                });
            }
            cachedSunniHadith[lang] = list;
            return list;
        } catch (e) {
            return [];
        }
    }

    async function translateToEnForTalmud(word) {
        try {
            var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=ar|en';
            var res = await fetch(url).then(function(r) { return r.json(); });
            if (res && res.responseData && res.responseData.translatedText) {
                return res.responseData.translatedText.replace(/[^a-zA-Z\s]/g, '').trim();
            }
        } catch (e) {}
        return word;
    }

    async function getTalmudMishnah(word, isEn) {
        var queryTerm = isEn ? word : await translateToEnForTalmud(word);
        var url = 'https://www.sefaria.org/api/search-wrapper?q=' + encodeURIComponent(queryTerm) + '&size=8&filters[]=Mishnah&filters[]=Talmud';
        try {
            var res = await fetch(url).then(function(r) { return r.json(); });
            var hits = (res && res.hits && res.hits.hits) ? res.hits.hits : [];
            return {
                term: queryTerm,
                items: hits.map(function(h) {
                    var src = h._source || {};
                    var snip = (h.highlight && h.highlight.exact && h.highlight.exact[0]) ? h.highlight.exact[0] : (src.exact || '');
                    return {
                        ref: src.ref || 'Mishnah / Talmud',
                        text: noHtml(snip)
                    };
                }).filter(function(x) { return x.text.length > 0; })
            };
        } catch (e) {
            return { term: queryTerm, items: [] };
        }
    }

    async function runLevel(lvl) {
        stopSpeech();
        currentActiveLevel = lvl;

        var word = document.getElementById('quran-word').value.trim();
        if (!word) {
            alert('يرجى كتابة اللفظ المراد تدبره أولاً');
            return;
        }

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

        if (lvl === 1) {
            var m1 = await getQuranMatches(word, isEn);
            var wDom = isEn ? 'en.wikipedia.org' : 'ar.wikipedia.org';
            var wRes = await fetch('https://' + wDom + '/api/rest_v1/page/summary/' + enc).then(function(r) { return r.json(); }).catch(function() { return null; });

            if (isEn) {
                var stem = cleanW.replace(/(ing|ed|es|s|ly|ness|ful|less)$/, '');
                out += '<div class="section-block"><span class="section-label">1. Core Stem:</span><strong>(' + stem.toUpperCase() + ')</strong></div>';
                out += '<div class="section-block"><span class="section-label">2. Definition:</span>' + ((wRes && wRes.extract) ? wRes.extract : 'Lexical overview of ' + word) + '</div>';
                out += '<div class="section-block"><span class="section-label">3. Quranic Frequency:</span>Appears in <strong>' + m1.length + '</strong> verse(s).</div>';
            } else {
                var root = cleanW.replace(/^ال/, '').replace(/^[وميتنا]/, '').replace(/[هونيا]$/, '');
                if (root.length > 3) root = root.replace(/[اوي]/g, '');
                var rStr = root.length >= 2 ? root.split('').join(' - ') : cleanW.split('').join(' - ');
                out += '<div class="section-block"><span class="section-label">1. الجذر اللغوي التقريبي:</span><strong>( ' + rStr + ' )</strong></div>';
                out += '<div class="section-block"><span class="section-label">2. البيان المعجمي:</span>' + ((wRes && wRes.extract) ? wRes.extract : 'مفهوم لفظ (' + word + ') في لسان العرب والسياق المعرفي.') + '</div>';
                out += '<div class="section-block"><span class="section-label">3. الإحصاء القرآني:</span>ورد هذا اللفظ في <strong>' + m1.length + '</strong> موضعاً في القرآن الكريم.</div>';
            }
        }
        else if (lvl === 2) {
            var m2 = await getQuranMatches(word, isEn);
            if (m2.length === 0) {
                out += '<div class="section-block">' + (isEn ? 'No exact verses found.' : 'لم يتم العثور على آيات مطابقة، جرب كتابة اللفظ بدون زوائد.') + '</div>';
            } else {
                m2.slice(0, 25).forEach(function(v) {
                    var sName = isEn ? v.surah.englishName : v.surah.name;
                    out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ']</div><div>' + hl(v.text, word, isEn) + '</div></div>';
                });
            }
        }
        else if (lvl === 3) {
            var bibleList = await searchBollsBible(word, isEn);
            var otMatches = [];
            var ntMatches = [];

            bibleList.forEach(function(item) {
                var bNum = parseInt(item.book, 10);
                var bName = isEn ? (BOOKS_EN[bNum] || 'Book ' + bNum) : (BOOKS_AR[bNum] || 'سفر ' + bNum);
                var cleanTxt = noHtml(item.text || '');
                var entry = { book: bName, ch: item.chapter, vs: item.verse, text: cleanTxt };
                if (bNum <= 39) {
                    if (otMatches.length < 12) otMatches.push(entry);
                } else {
                    if (ntMatches.length < 12) ntMatches.push(entry);
                }
            });

            out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Old Testament (Torah & Prophets):' : '1. العهد القديم (التوراة والأنبياء):') + '</span>';
            if (otMatches.length === 0) {
                out += '<div>' + (isEn ? 'No matching passages in Old Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد القديم.') + '</div>';
            } else {
                otMatches.forEach(function(bm) {
                    out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div>' + hl(bm.text, word, isEn) + '</div></div>';
                });
            }
            out += '</div>';

            out += '<div class="section-block"><span class="section-label">' + (isEn ? '2. New Testament (Gospels & Epistles):' : '2. العهد الجديد (الأناجيل والرسائل):') + '</span>';
            if (ntMatches.length === 0) {
                out += '<div>' + (isEn ? 'No matching passages in New Testament.' : 'لم يتم العثور على نصوص مطابقة في أسفار العهد الجديد.') + '</div>';
            } else {
                ntMatches.forEach(function(bm) {
                    out += '<div class="verse-item"><div class="verse-meta">[' + bm.book + ' ' + bm.ch + ':' + bm.vs + ']</div><div>' + hl(bm.text, word, isEn) + '</div></div>';
                });
            }
            out += '</div>';
        }
        else if (lvl === 4) {
            var sunni = await getSunniHadith(isEn);
            var sFound = sunni.filter(function(h) {
                var txt = isEn ? h.text.toLowerCase() : normAr(h.text);
                return txt.indexOf(cleanW) !== -1;
            }).slice(0, 10);

            out += '<div class="section-block"><span class="section-label">' + (isEn ? '1. Hadith Narrations:' : '1. المرويات الحديثية:') + '</span>';
            if (sFound.length === 0) {
                out += '<div>' + (isEn ? 'No narrations retrieved for this term.' : 'لم يتم العثور على مرويات مطابقة لهذا اللفظ.') + '</div>';
            } else {
                sFound.forEach(function(item) {
                    out += '<div class="verse-item"><div class="verse-meta">' + item.source + ' (' + item.num + ')</div><div>' + hl(item.text, word, isEn) + '</div></div>';
                });
            }
            out += '</div>';

            var talmudRes = await getTalmudMishnah(word, isEn);
            out += '<div class="section-block"><span class="section-label">' + (isEn ? '2. Talmud (Mishnah):' : '2. التلمود (المشنا) — البحث بالمقابل (' + talmudRes.term + '):') + '</span>';
            if (talmudRes.items.length === 0) {
                out += '<div>' + (isEn ? 'No matching passages found in Talmud (Mishnah).' : 'لم يتم العثور على نصوص مطابقة في التلمود (المشنا) لهذا اللفظ.') + '</div>';
            } else {
                talmudRes.items.forEach(function(tm) {
                    out += '<div class="verse-item" dir="ltr" style="text-align:left;"><div class="verse-meta">[' + tm.ref + ']</div><div>' + hl(tm.text, talmudRes.term, true) + '</div></div>';
                });
            }
            out += '</div>';
        }
        else if (lvl === 5) {
            var m5 = await getQuranMatches(word, isEn);
            out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Criterion Rule:' : 'قاعدة الإحكام:') + '</span>' + (isEn ? 'Returning ambiguous meanings to clear decisive verses.' : 'رد المتشابه إلى الآيات المحكمات البينات لاستنباط الحكم الصحيح للفظ (' + word + ').') + '</div>';
            m5.slice(0, 6).forEach(function(v) {
                var sName = isEn ? v.surah.englishName : v.surah.name;
                out += '<div class="verse-item"><div class="verse-meta">[' + sName + ' : ' + v.numberInSurah + ']</div><div>' + hl(v.text, word, isEn) + '</div></div>';
            });
        }
        else if (lvl === 6) {
            out += '<div class="section-block"><span class="section-label">' + (isEn ? 'Summit Conclusion for (' + word + '):' : 'خلاصة التدبر الهرمي للفظ (' + word + '):') + '</span>' + (isEn ? 'Final purified synthesis for (' + word + ').' : 'خلاصة التدبر الهرمي المتدرج للفظ (' + word + ') من القاعدة اللغوية إلى قمة الفهم والتأويل.') + '</div>';
        }

        levelCache[cacheKey] = out;
        document.getElementById('content-' + lvl).innerHTML = out;
        loader.style.display = 'none';
        wrapper.style.display = 'flex';
    }
});
