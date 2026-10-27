# The St. Louis Gazette

An in-world newspaper for the *Hunter: The Vigil* campaign **St. Louis By Night**. One page (`index.html`) renders any edition from a JSON file, so every issue looks and works the same.

Layout: `index.html` (markup), `css/style.css` (look), `js/app.js` (rendering), `editions/` (content).

**Player-facing only.** This repo is public. Never put GM secrets here.

## Publishing a new edition
1. Copy the newest file in `editions/` (e.g. `001.json` to `002.json`) and rewrite it.
2. Add it to the **top** of the `editions` list in `editions/index.json`. The top entry is what players see first; older ones stay in the edition picker.
3. Commit and push. GitHub Pages updates in a minute or two.

Links: `.../#001` opens a specific edition; `.../?a=article-id#001` opens an article directly.

## Edition format (`editions/NNN.json`)
| Field | What it does |
|---|---|
| `issue` | `volume`, `date`, `edition`, `price` for the dateline. |
| `nextSession` | Countdown box. `when` is an ISO time like `"2026-11-14T19:00:00-06:00"` (adds a countdown and an "Add to my calendar" button). Leave it `""` to show `tba` text instead. Optional `title`, `where`, `hours`, `nowText`. |
| `previously` | The recap box: `{ "title": "Previously...", "body": ["paragraph", "..."] }`. `null` hides it. |
| `ticker` | List of short lines for the scrolling ticker. |
| `weather` | `{ "headline", "text" }` |
| `articles` | List of stories. `id`, `headline`, `body` (list of paragraphs) are required. Optional: `kicker`, `subhead`, `byline`, `image` (+ `caption`), `size` (`"lead"` for the front-page story, `"brief"` for small ones), `column` (`"side"` puts it in the right column). Clicking a story opens the full text. |
| `blotter` | Police blotter: list of `{ "time", "where", "text" }`. |
| `ads` | Boxed ads: `{ "headline", "body", "footer" }`. |
| `classifieds` | List of `{ "heading", "text" }`. |
| `paper` | Optional per-edition override of the masthead settings in `index.json`. |

Any `marginalia` field (on articles, ads, classifieds, weather, the recap, the countdown) is a handwritten note that only shows under the **black light** button.

### Text markup
`**bold**`, `*italic*`, and `{{hidden ink}}`, which is invisible until the black light is on.

### Images
Put images in an `images/` folder and reference them as `"image": "images/whatever.jpg"`. They're printed in grayscale automatically.

## Previewing locally
The page loads JSON, so open it through a server rather than double-clicking: `python -m http.server` in this folder, then visit http://localhost:8000.
