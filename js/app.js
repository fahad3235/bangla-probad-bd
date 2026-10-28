// UI for bangla-probad-bd. Depends on PROVERBS (js/proverbs.js) and logic.js.
(function () {
  "use strict";
  var CATS = ["all", "wisdom", "diligence", "caution", "money", "character"];
  var I18N = {
    en: {
      tagline: "40 classic Bangla proverbs with meanings, explained in plain words.",
      searchPh: "Search proverb, meaning, or keyword…",
      all: "All", wisdom: "Wisdom", diligence: "Diligence", caution: "Caution", money: "Money", character: "Character",
      favOnly: "Favourites only", browse: "Browse", quiz: "Quiz", ofDay: "Proverb of the day",
      startQuiz: "Start quiz", next: "Next", finish: "Finish", restart: "Play again",
      quizQ: "What does this proverb mean?", score: "Score", correct: "Correct!", wrong: "Not quite.",
      fav: "Favourite", unfav: "Remove favourite", copy: "Copy", copied: "Copied!",
      close: "Close", useWhen: "Use it when:", meaning: "Meaning",
      empty: "No proverbs match. Try another word or category.",
      noFav: "No favourites yet. Tap the heart on any proverb card to save it here.",
      quizDone: "Quiz complete!", quizReview: "Review your answers below.",
      footer: "Folk sayings for learning and fun — meanings are the standard everyday senses, not scholarly citations."
    },
    bn: {
      tagline: "৪০টি চিরায়ত বাংলা প্রবাদ, সহজ অর্থসহ।",
      searchPh: "প্রবাদ, অর্থ বা শব্দ দিয়ে খুঁজুন…",
      all: "সব", wisdom: "জ্ঞান", diligence: "পরিশ্রম", caution: "সতর্কতা", money: "অর্থ", character: "চরিত্র",
      favOnly: "শুধু প্রিয়গুলো", browse: "ব্রাউজ", quiz: "কুইজ", ofDay: "আজকের প্রবাদ",
      startQuiz: "কুইজ শুরু করুন", next: "পরেরটি", finish: "শেষ করুন", restart: "আবার খেলুন",
      quizQ: "এই প্রবাদের অর্থ কী?", score: "স্কোর", correct: "ঠিক!", wrong: "হয়নি।",
      fav: "প্রিয় করুন", unfav: "প্রিয় থেকে সরান", copy: "কপি", copied: "কপি হয়েছে!",
      close: "বন্ধ করুন", useWhen: "কখন ব্যবহার করবেন:", meaning: "অর্থ",
      empty: "কিছু মিলল না। অন্য শব্দ বা বিভাগ চেষ্টা করুন।",
      noFav: "এখনো কোনো প্রিয় প্রবাদ নেই। কার্ডের হার্ট চাপলে এখানে জমা হবে।",
      quizDone: "কুইজ শেষ!", quizReview: "নিচে আপনার উত্তরগুলো দেখুন।",
      footer: "শেখা ও আনন্দের জন্য লোকপ্রবাদ — অর্থগুলো প্রচলিত সাধারণ অর্থ, গবেষণামূলক উদ্ধৃতি নয়।"
    }
  };

  var lang = localStorage.getItem("probad-lang") || "en";
  var favs = new Set(JSON.parse(localStorage.getItem("probad-favs") || "[]"));
  var state = { q: "", cat: "all", favOnly: false, view: "browse", quiz: null, qi: 0, answers: [] };

  function t(k) { return I18N[lang][k] || I18N.en[k] || k; }
  function num(n) { return lang === "bn" ? toBnDigits(n) : String(n); }
  function save() {
    localStorage.setItem("probad-lang", lang);
    localStorage.setItem("probad-favs", JSON.stringify(Array.from(favs)));
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderLang() {
    $("tagline").textContent = t("tagline");
    $("search").placeholder = t("searchPh");
    $("favOnlyLabel").textContent = t("favOnly");
    $("tabBrowse").textContent = t("browse");
    $("tabQuiz").textContent = t("quiz");
    $("ofDayTitle").textContent = t("ofDay");
    $("langBtn").textContent = lang === "en" ? "বাংলা" : "English";
    $("footerText").textContent = t("footer");
    $("modalClose").textContent = t("close");
    var sb = $("startBtn");
    if (sb) sb.textContent = t("startQuiz");
    renderChips();
    render();
  }

  function renderChips() {
    $("chips").innerHTML = CATS.map(function (c) {
      return '<button class="chip' + (state.cat === c ? " active" : "") + '" data-cat="' + c + '">' + esc(t(c)) + "</button>";
    }).join("");
    var btns = $("chips").querySelectorAll("button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () { state.cat = b.getAttribute("data-cat"); renderChips(); render(); });
    });
  }

  function cardHTML(p) {
    var isFav = favs.has(p.id);
    return '<article class="card" data-id="' + p.id + '">' +
      '<div class="card-top"><span class="cat">' + esc(t(p.cat)) + "</span>" +
      '<button class="heart' + (isFav ? " on" : "") + '" data-fav="' + p.id + '" aria-label="' + esc(isFav ? t("unfav") : t("fav")) + '">' + (isFav ? "♥" : "♡") + "</button></div>" +
      '<h3 class="bn">' + esc(p.bn) + "</h3>" +
      '<p class="tr">' + esc(p.tr) + "</p>" +
      '<p class="en">' + esc(p.en) + "</p>" +
      '<button class="detail-btn" data-detail="' + p.id + '">' + esc(t("meaning")) + " →</button>" +
      "</article>";
  }

  function render() {
    var list = filterProverbs(PROVERBS, state.q, state.cat, state.favOnly, favs);
    var grid = $("grid");
    if (state.view !== "browse") { grid.innerHTML = ""; $("empty").style.display = "none"; return; }
    if (!list.length) {
      grid.innerHTML = "";
      $("empty").style.display = "block";
      $("empty").textContent = state.favOnly && !state.q && state.cat === "all" ? t("noFav") : t("empty");
    } else {
      $("empty").style.display = "none";
      grid.innerHTML = list.map(cardHTML).join("");
    }
    bindCards();
    renderOfDay();
  }

  function bindCards() {
    document.querySelectorAll("[data-fav]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = +b.getAttribute("data-fav");
        if (favs.has(id)) favs.delete(id); else favs.add(id);
        save(); render();
      });
    });
    document.querySelectorAll("[data-detail]").forEach(function (b) {
      b.addEventListener("click", function () { openDetail(+b.getAttribute("data-detail")); });
    });
    document.querySelectorAll(".card h3, .card .tr").forEach(function (el) {
      el.addEventListener("click", function () {
        openDetail(+el.closest(".card").getAttribute("data-id"));
      });
    });
  }

  function renderOfDay() {
    var today = new Date();
    var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var p = pickOfDay(PROVERBS, iso);
    if (!p) return;
    $("ofDayBn").textContent = p.bn;
    $("ofDayTr").textContent = p.tr;
    $("ofDayEn").textContent = p.en;
    $("ofDayBnm").textContent = p.bnm;
    $("ofDayBtn").onclick = function () { openDetail(p.id); };
  }

  function openDetail(id) {
    var p = PROVERBS.find(function (x) { return x.id === id; });
    if (!p) return;
    $("dBn").textContent = p.bn;
    $("dTr").textContent = p.tr;
    $("dEn").textContent = p.en;
    $("dBnm").textContent = p.bnm;
    $("dUse").textContent = p.use;
    $("dUseLabel").textContent = t("useWhen");
    $("dMeaningLabel").textContent = t("meaning");
    $("dCat").textContent = t(p.cat);
    var favBtn = $("dFav");
    favBtn.textContent = (favs.has(p.id) ? "♥ " : "♡ ") + t("fav");
    favBtn.onclick = function () {
      if (favs.has(p.id)) favs.delete(p.id); else favs.add(p.id);
      save(); openDetail(p.id); render();
    };
    $("dCopy").textContent = t("copy");
    $("dCopy").onclick = function () {
      var text = p.bn + " (" + p.tr + ") — " + p.en;
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      $("dCopy").textContent = t("copied");
      setTimeout(function () { $("dCopy").textContent = t("copy"); }, 1500);
    };
    $("modal").style.display = "flex";
  }

  function closeDetail() { $("modal").style.display = "none"; }

  // ---- Quiz ----
  function startQuiz() {
    state.quiz = makeQuiz(PROVERBS, 10, Math.random);
    state.qi = 0; state.answers = [];
    showQuestion();
  }

  function showQuestion() {
    var q = state.quiz[state.qi];
    var area = $("quizArea");
    if (!q) { showResult(); return; }
    area.innerHTML =
      '<p class="quiz-progress">' + t("quizQ") + " " + num(state.qi + 1) + "/" + num(state.quiz.length) + "</p>" +
      '<h3 class="bn quiz-bn">' + esc(q.bn) + "</h3>" +
      '<p class="tr">' + esc(q.tr) + "</p>" +
      '<div class="opts">' + q.options.map(function (o, i) {
        return '<button class="opt" data-i="' + i + '">' + esc(o) + "</button>";
      }).join("") + "</div>" +
      '<p id="quizFeedback" class="feedback"></p>';
    area.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var chosen = q.options[+b.getAttribute("data-i")];
        state.answers[state.qi] = chosen;
        area.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; });
        var fb = $("quizFeedback");
        if (chosen === q.answer) { fb.textContent = t("correct"); fb.className = "feedback good"; }
        else { fb.textContent = t("wrong") + " " + q.answer; fb.className = "feedback bad"; }
        var nav = document.createElement("button");
        nav.className = "primary";
        nav.textContent = state.qi + 1 >= state.quiz.length ? t("finish") : t("next");
        nav.addEventListener("click", function () { state.qi++; showQuestion(); });
        area.appendChild(nav);
      });
    });
  }

  function showResult() {
    var score = scoreQuiz(state.quiz, state.answers);
    var area = $("quizArea");
    var rows = state.quiz.map(function (q, i) {
      var ok = state.answers[i] === q.answer;
      return '<li class="' + (ok ? "good" : "bad") + '">' + esc(q.bn) + " — " +
        esc(state.answers[i] || "—") + (ok ? "" : " (" + esc(q.answer) + ")") + "</li>";
    }).join("");
    area.innerHTML =
      "<h3>" + esc(t("quizDone")) + "</h3>" +
      '<p class="score">' + esc(t("score")) + ": " + num(score) + "/" + num(state.quiz.length) + "</p>" +
      "<p>" + esc(t("quizReview")) + "</p><ul class='review'>" + rows + "</ul>" +
      '<button class="primary" id="againBtn">' + esc(t("restart")) + "</button>";
    $("againBtn").addEventListener("click", startQuiz);
  }

  function setView(v) {
    state.view = v;
    $("tabBrowse").classList.toggle("active", v === "browse");
    $("tabQuiz").classList.toggle("active", v === "quiz");
    $("browseView").style.display = v === "browse" ? "block" : "none";
    $("quizView").style.display = v === "quiz" ? "block" : "none";
    if (v === "quiz" && !$("quizArea").innerHTML) {
      $("quizArea").innerHTML = '<button class="primary" id="startBtn">' + esc(t("startQuiz")) + "</button>";
      $("startBtn").addEventListener("click", startQuiz);
    }
    if (v === "browse") render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("langBtn").addEventListener("click", function () {
      lang = lang === "en" ? "bn" : "en"; save(); renderLang(); setView(state.view);
    });
    $("search").addEventListener("input", function (e) { state.q = e.target.value; render(); });
    $("favOnly").addEventListener("change", function (e) { state.favOnly = e.target.checked; render(); });
    $("tabBrowse").addEventListener("click", function () { setView("browse"); });
    $("tabQuiz").addEventListener("click", function () { setView("quiz"); });
    $("modalClose").addEventListener("click", closeDetail);
    $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeDetail(); });
    renderLang();
    setView("browse");
  });
})();
