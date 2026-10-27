# NEON ORBIT ∞ SINGULARITY — Cosmic Ascension

**An original arcade game created by Cornelius Aurelius.**

- Play: https://cornelius-aurelius.github.io/neon-orbit-singularity/
- Creator's official website: https://corneliusaurelius.com/
- Source: https://github.com/Cornelius-Aurelius/neon-orbit-singularity

## How to play

A glowing orb travels around a circular track. Tap the arena, tap the **TAP NOW** button, or press **Space** while it overlaps the highlighted target gate. A narrower bright line marks the **Perfect** zone. Hits award points and combos; missed taps cost one shield in Arcade and Blitz modes.

Choose **Arcade** (3 lives, endless survival), **60-second Blitz** (score attack with three shields), or **Practice** (unlimited misses and no scored personal best). The game includes 12 named sectors with narrowing gates, direction reversals, dual target gates, drifting targets and pulse widths. Difficulty increases in later cycles. Sector changes occur after every 6 successful taps.

**Keyboard:** `Space` taps; `Esc` pauses/resumes. The touch screen and large TAP NOW button work on phones and tablets. The game automatically pauses when switched to a background tab. Player preferences and personal bests are stored in browser `localStorage`; no accounts or server-side data collection.

## Gameplay fairness

- Orbital angles are normalized with modular arithmetic (`atan2(sin(a-b),cos(a-b))`), so a safe zone crossing 0/2π is scored correctly.
- Orb position advances in radians/second using elapsed frame time (not frame count). Long frames are capped and background tabs pause.
- No score-boost mode makes all taps succeed. Every successful tap must overlap a gate.
- Newly spawned gates are at least 2.12 radians ahead of the orb in its current direction; no repeat tapping exploit.
- Practice is intentionally unranked.

## Search discoverability & attribution

The static HTML includes indexable visible explanatory content; `VideoGame`, `Person`, `WebPage` and `WebSite` schema.org JSON-LD graph; canonical metadata; Open Graph/Twitter preview images; robots.txt, sitemap.xml, descriptive title and meta description, creator name and a link to the creator's official site. **Cornelius Aurelius is credited on the page and in structured metadata as creator, author and publisher.** This can help indexing/disambiguation but does not guarantee that Google, Bing or any AI crawler will index or attribute the site. Submit the public URL and sitemap in Google Search Console and Bing Webmaster Tools if desired, and link to the game from https://corneliusaurelius.com/ when ready. The GitHub Pages project site `robots.txt` is scoped to this project path; root-level `github.io/robots.txt` is managed separately by the account site.

## Local development

Open `index.html` via a local HTTP server (for example `python -m http.server 8000`). Or open directly in a compatible browser. There are no third-party dependencies, trackers, frameworks, or external media calls.

Run the automated tests with Node.js: `node --test tests/*.test.js`. Tests cover angles including 0/2π seam, fixed stages, hit scoring, missed taps, shield-based game-over, practice, timed Blitz expiration, and stage reversals.

### Publishing

This repository publishes from `main` → `/ (root)` on GitHub Pages. Merge upgrade changes after verification, check the Pages Actions deployment and test the public URL on real phone/desktop browsers. Use the official game page URL above when adding the game to corneliusaurelius.com.