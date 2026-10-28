// Pure logic for bangla-probad-bd (no DOM). Shared by the app and the node tests.
function norm(s) {
  return (s || "").toLowerCase().trim();
}

// Search across Bangla text, transliteration, English + Bangla meanings.
function filterProverbs(list, query, cat, favOnly, favSet) {
  const q = norm(query);
  return list.filter((p) => {
    if (cat && cat !== "all" && p.cat !== cat) return false;
    if (favOnly && !(favSet && favSet.has(p.id))) return false;
    if (!q) return true;
    const hay = [p.bn, p.tr, p.en, p.bnm, p.use].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
}

// Deterministic proverb of the day: day-of-year style hash of the ISO date.
function pickOfDay(list, isoDate) {
  if (!list.length) return null;
  let h = 0;
  for (let i = 0; i < isoDate.length; i++) h = (h * 31 + isoDate.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

// Build a 10-question quiz: each asks for the meaning of a proverb.
// options: the correct meaning + 3 distractors, shuffled with rng().
function makeQuiz(list, count, rng) {
  const rand = rng || Math.random;
  const pool = list.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  const picked = pool.slice(0, Math.min(count, list.length));
  return picked.map((p) => {
    const others = list.filter((x) => x.id !== p.id);
    const distract = [];
    const used = new Set([p.en]);
    while (distract.length < 3 && others.length) {
      const c = others[Math.floor(rand() * others.length)];
      if (!used.has(c.en)) { used.add(c.en); distract.push(c.en); }
    }
    const options = [p.en].concat(distract);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = options[i]; options[i] = options[j]; options[j] = t;
    }
    return { id: p.id, bn: p.bn, tr: p.tr, answer: p.en, options: options };
  });
}

function scoreQuiz(questions, answers) {
  let correct = 0;
  questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
  return correct;
}

// Bengali digits for display when Bangla mode is on.
function toBnDigits(s) {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(s).replace(/[0-9]/g, (d) => map[+d]);
}

if (typeof module !== "undefined") {
  module.exports = { norm, filterProverbs, pickOfDay, makeQuiz, scoreQuiz, toBnDigits };
}
