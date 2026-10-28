# Bangla Probad BD — বাংলা প্রবাদ

40 classic Bangla proverbs (*probad*) with plain-language meanings, built for students,
teachers, and anyone learning Bangla. Browse, search, save favourites, meet a new
proverb every day, and test yourself with a meaning-match quiz. Fully offline —
no accounts, no tracking, no network calls.

Live demo: https://fahad3235.github.io/bangla-probad-bd/

## Features

1. **Browse all 40 proverbs** — Bangla text, romanized transliteration, English meaning,
   short Bangla meaning, and a "use it when" situation note for each.
2. **Search** — matches Bangla text, transliteration, and both meanings (multi-word queries narrow results).
3. **Category filters** — Wisdom, Diligence, Caution, Money, Character (8 proverbs each).
4. **Favourites** — heart any proverb; favourites persist in `localStorage` and can be
   filtered with "Favourites only".
5. **Proverb of the day** — a deterministic date-seeded pick, so everyone sees the same
   proverb on the same day.
6. **Meaning-match quiz** — 10 random questions, 4 options each, instant feedback,
   final score, and a full answer review.
7. **EN / বাংলা toggle** — UI language persists, with Bengali digits in Bangla mode.
8. **Responsive** — verified at 390px mobile width with no horizontal overflow.

## The proverb bank

40 entries, 8 per category, in [`js/proverbs.js`](js/proverbs.js):

| Category | Count | Examples |
|---|---|---|
| Wisdom | 8 | অতি লোভে তাঁতি নষ্ট, গাছে কাঁঠাল গোঁফে তেল |
| Diligence | 8 | পরিশ্রম সৌভাগ্যের প্রসূতি, কষ্ট না করলে কেষ্ট মেলে না |
| Caution | 8 | দুধ কলা দিয়ে কালসাপ পোষা, জলে কুমির ডাঙায় বাঘ |
| Money | 8 | যত গুড় তত মিষ্টি, ধার করে ঘি খাওয়া |
| Character | 8 | বন্ধু চেনা যায় বিপদে, মুখে মধু অন্তরে বিষ |

Meanings are the standard, widely-understood everyday senses of these folk sayings.
They are presented for learning, not as scholarly citations — folk proverbs vary
slightly by region and retelling, and no source is claimed for any single wording.

## Tech stack

Pure static site — no build step, no dependencies:

- `index.html` — structure
- `css/style.css` — responsive styling
- `js/proverbs.js` — the 40-proverb data bank
- `js/logic.js` — pure functions (filter, proverb-of-the-day, quiz builder, scorer, digit conversion)
- `js/app.js` — UI wiring

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Tests

```bash
node tests/logic.test.js   # 27 checks: bank integrity, filter, proverb-of-day, quiz, digits
node tests/smoke.js        # 14 headless-Chrome checks (raw CDP): render, search, filters,
                           # detail modal, favourite persistence, quiz flow, 390px mobile, zero console errors
```

See [`TEST_RESULTS.md`](TEST_RESULTS.md) for the verified results of this release.

## Limitations

- The proverb bank is fixed at 40 entries; there is no add-your-own-proverb feature yet.
- Favourites live only in the browser's `localStorage` — clearing site data removes them.
- Meanings are plain-language summaries, not academic definitions; regional variants exist.
- The quiz draws only from the same 40 proverbs, so questions repeat across plays.

## Status

Built by MUSE Project Factory Ω (run #160, 2026-10-28 10:00 Asia/Dhaka slot).
Status: PUBLISHED_AND_VERIFIED — 27/27 logic tests + 14/14 smoke checks green,
0 console/page errors, GitHub Pages live verified.
