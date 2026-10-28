# TEST_RESULTS — bangla-probad-bd (factory run #160, 2026-10-28)

## Node logic tests — 27/27 passed, 0 repairs

Run: `node tests/logic.test.js`

- Bank integrity: 40 proverbs, ids unique, 8 per category (wisdom/diligence/caution/
  money/character), all fields non-empty, English meanings unique, Bangla texts unique.
- Filter: empty query → 40; caution → 8; Bangla query "লোভ" finds the greed proverbs;
  English "greed" ≥ 2; transliteration "tiger" finds id 38; multi-word "money begets" → 1;
  no-match → 0; favourites-only with {1,5} → 2.
- Proverb of the day: deterministic for a fixed date, always a bank member, null on empty bank.
- Quiz: 10 distinct questions, 4 unique options each including the answer, deterministic
  under a seeded RNG, scores 10/0/3 as expected.
- Bengali digits: "2026" → "২০২৬", "10/40" → "১০/৪০".

## Headless-Chrome smoke tests — 14/14 passed, 0 repairs

Run: `node tests/smoke.js` (raw CDP, /opt/meta-chromium/chrome, file://)

1. Title contains "Bangla Probad"
2. 40 cards render
3. Proverb of the day renders
4. Language toggle switches tagline to Bengali ("৪০টি…")
5. Language toggle back to English ("40 classic…")
6. Search "লোভ" narrows the grid (0 < n < 40)
7. Clearing search restores 40 cards
8. "Caution" chip shows exactly 8 cards
9. Detail modal opens with a non-empty meaning
10. Favourite set from the modal persists across a page reload (localStorage)
11. "Favourites only" filter shows the saved card
12. Quiz flow: start → question → answer → feedback text appears
13. 390px mobile: no horizontal overflow (scrollWidth ≤ innerWidth)
14. Zero console/page errors throughout

## Publish verification

- Repo: https://github.com/fahad3235/bangla-probad-bd (public)
- Pages: https://fahad3235.github.io/bangla-probad-bd/ — HTTP 200, live `index.html`
  byte-identical to the local build (see run log).
