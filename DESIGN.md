# Design guidelines

Every page of this repository is one HTML document with one `<style>` element and no JavaScript: the reading view, the dashboard and an HTML export. These are the colours, the sizes, the spacing, the parts and the rules every one of them keeps. Read this file before you write or review a page.

## Design tokens

`bin/page-style.mjs` declares every token below on `:root`, and a page uses it as `var(--<name>)` and no colour, size, spacing, radius or border width of its own.

| Token | Value | For |
| --- | --- | --- |
| `--page` | `#ffffff` | the background of a page |
| `--surface` | `#f5f6f7` | the background of a card, a column and a table head |
| `--border` | `#c4c7cc` | every border |
| `--text` | `#1b1b1b` | text |
| `--muted` | `#55595f` | muted text: an id, a hint, a stage not reached |
| `--link` | `#11467b` | a link and the focus outline |
| `--done-text` | `#14532d` | the text of the mark `done`: a stage the process has passed, the verdict `PASS`, the case result `PASS` |
| `--done-surface` | `#e6f4ea` | the background of the mark `done` |
| `--now-text` | `#11467b` | the text of the mark `now`: the stage the process is in, the chosen tab, the chosen draft |
| `--now-surface` | `#e3edf7` | the background of the mark `now` |
| `--stop-text` | `#7a1f1f` | the text of the mark `stop`: the verdict `CHANGES`, the case result `FAIL` |
| `--stop-surface` | `#fbe9e7` | the background of the mark `stop` |
| `--size-small` | `0.875rem` | the type scale: a badge and an item of a trail |
| `--size-body` | `1rem` | the type scale: body text and a heading of the fourth level or lower |
| `--size-h3` | `1.125rem` | the type scale: a heading of the third level |
| `--size-h2` | `1.375rem` | the type scale: a heading of the second level |
| `--size-h1` | `1.75rem` | the type scale: the one heading of the first level |
| `--space-1` | `0.25rem` | the spacing scale: the gap inside a badge and between the items of a trail |
| `--space-2` | `0.5rem` | the spacing scale: the padding of a card and the gap between the tabs |
| `--space-3` | `1rem` | the spacing scale: the gap between the columns of a board |
| `--space-4` | `1.5rem` | the spacing scale: the space under a page header |
| `--space-5` | `2rem` | the spacing scale: the padding at the top of a page |
| `--radius` | `0.375rem` | the corner of a card, a badge and a field |
| `--line` | `1px` | the width of a border |
| `--measure` | `40rem` | the reading measure of a document and a form |

## Parts

A page is built from these eight parts and from nothing else. A page that needs another part gets it here first.

- page header: a `<header>` with the way back, the one `<h1>` of the page and the facts that hold at every address of the thing it shows.
- card: an `<article>` that holds one thing of a list, such as one process on a board or one recorded round.
- badge: a `<span class="badge">` with `done`, `now` or `stop`, and always the state as its text, such as `PASS` or `CHANGES`.
- definition list of facts: a `<dl>` with one `<dt>` per fact and its value in the `<dd>` after it.
- document at the reading measure: a `<main>` of at most `--measure` that holds the text of one document.
- form: a `<form>` with the label above its field and one submit button.
- table: a `<table>` whose first row is a head row of `<th>`.
- notice: a `<p class="notice">` that says something about the page it stands on.

## Rules

- one primary action per area;
- headings that scan: one `<h1>` per page, no level skipped;
- text has a contrast of at least 4.5:1 against what it stands on;
- a visible focus outline on everything that takes focus;
- a state is named in words, never in colour alone;
- the layout holds from a 360px phone to a wide window with no horizontal scrolling;
- no JavaScript: the pages are served with `default-src 'none'; style-src 'unsafe-inline'`, so what folds folds with `<details>` and what switches switches by address;
- the look is plain CSS in the one `<style>` element of a page: no `style` attribute, no stylesheet file, no image and no font from elsewhere;
- a page that holds a form does not reload itself.
