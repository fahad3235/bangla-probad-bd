// Node unit tests for bangla-probad-bd logic + proverb bank integrity.
// Run: node tests/logic.test.js
const assert = require("assert");
const { PROVERBS } = require("../js/proverbs.js");
const { filterProverbs, pickOfDay, makeQuiz, scoreQuiz, toBnDigits } = require("../js/logic.js");

let n = 0;
function ok(name, cond) { n++; assert.ok(cond, "FAIL: " + name); console.log("ok - " + name); }

// --- Bank integrity ---
ok("bank has 40 proverbs", PROVERBS.length === 40);
ok("ids unique 1..40", new Set(PROVERBS.map((p) => p.id)).size === 40);
ok("8 per category", ["wisdom", "diligence", "caution", "money", "character"].every(
  (c) => PROVERBS.filter((p) => p.cat === c).length === 8));
ok("all fields non-empty", PROVERBS.every((p) =>
  p.bn && p.tr && p.en && p.bnm && p.use && p.cat));
ok("English meanings unique", new Set(PROVERBS.map((p) => p.en)).size === 40);
ok("Bangla texts unique", new Set(PROVERBS.map((p) => p.bn)).size === 40);
ok("no empty transliteration", PROVERBS.every((p) => p.tr.trim().length > 2));

// --- Filter ---
ok("empty query returns all", filterProverbs(PROVERBS, "", "all", false, new Set()).length === 40);
ok("category caution returns 8", filterProverbs(PROVERBS, "", "caution", false, new Set()).length === 8);
ok("Bangla search 'লোভ' finds greed proverbs", (() => {
  const r = filterProverbs(PROVERBS, "লোভ", "all", false, new Set());
  return r.length >= 2 && r.every((p) => (p.bn + p.bnm).includes("লোভ"));
})());
ok("English search 'greed' finds proverbs", filterProverbs(PROVERBS, "greed", "all", false, new Set()).length >= 2);
ok("transliteration search 'tiger' finds tiger proverb", (() => {
  const r = filterProverbs(PROVERBS, "tiger", "all", false, new Set());
  return r.length >= 1 && r.some((p) => p.id === 38);
})());
ok("multi-word query narrows", filterProverbs(PROVERBS, "money begets", "all", false, new Set()).length === 1);
ok("no-match returns empty", filterProverbs(PROVERBS, "zzzqqq", "all", false, new Set()).length === 0);
ok("favOnly restricts to favourites", filterProverbs(PROVERBS, "", "all", true, new Set([1, 5])).length === 2);

// --- Proverb of the day ---
ok("potd deterministic for same date", pickOfDay(PROVERBS, "2026-10-28").id === pickOfDay(PROVERBS, "2026-10-28").id);
ok("potd is a bank member", PROVERBS.includes(pickOfDay(PROVERBS, "2026-10-28")));
ok("potd empty bank returns null", pickOfDay([], "2026-10-28") === null);

// --- Quiz ---
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}
const quiz = makeQuiz(PROVERBS, 10, seeded(42));
ok("quiz has 10 questions", quiz.length === 10);
ok("quiz ids distinct", new Set(quiz.map((q) => q.id)).size === 10);
ok("each question has 4 unique options incl. answer", quiz.every((q) =>
  q.options.length === 4 && new Set(q.options).size === 4 && q.options.includes(q.answer)));
ok("quiz deterministic with same seed", JSON.stringify(makeQuiz(PROVERBS, 10, seeded(42))) === JSON.stringify(quiz));
ok("score all correct = 10", scoreQuiz(quiz, quiz.map((q) => q.answer)) === 10);
ok("score none correct = 0", scoreQuiz(quiz, quiz.map(() => "___none___")) === 0);
ok("score partial", scoreQuiz(quiz, quiz.map((q, i) => (i < 3 ? q.answer : "x"))) === 3);

// --- Digits ---
ok("Bengali digits 2026", toBnDigits("2026") === "২০২৬");
ok("Bengali digits mixed", toBnDigits("10/40") === "১০/৪০");

console.log("\nAll " + n + " logic tests passed.");
