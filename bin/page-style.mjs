/** The readable defaults of every page of the reading view, of the dashboard and of an HTML export. */
export const pageStyle = `:root {
--page: #ffffff;
--surface: #f5f6f7;
--border: #c4c7cc;
--text: #1b1b1b;
--muted: #55595f;
--link: #11467b;
--done-text: #14532d;
--done-surface: #e6f4ea;
--now-text: #11467b;
--now-surface: #e3edf7;
--stop-text: #7a1f1f;
--stop-surface: #fbe9e7;
--size-small: 0.875rem;
--size-body: 1rem;
--size-h3: 1.125rem;
--size-h2: 1.375rem;
--size-h1: 1.75rem;
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 1rem;
--space-4: 1.5rem;
--space-5: 2rem;
--radius: 0.375rem;
--line: 1px;
--measure: 40rem;
}
body { margin: 0 auto; max-width: var(--measure); padding: var(--space-5) var(--space-3); background: var(--page); color: var(--text); font-family: system-ui, sans-serif; font-size: var(--size-body); line-height: 1.5; overflow-wrap: anywhere; }
h1 { font-size: var(--size-h1); }
h2 { font-size: var(--size-h2); }
h3 { font-size: var(--size-h3); }
h4, h5, h6 { font-size: var(--size-body); }
a { color: var(--link); }
dt { font-weight: 700; }
dd { margin: 0 0 var(--space-2) 0; }
legend { font-weight: 700; }
form label { display: block; }
textarea, #name, #by { box-sizing: border-box; width: 100%; font: inherit; }
table { border-collapse: collapse; }
th, td { padding: var(--space-1) var(--space-2); border: var(--line) solid var(--border); text-align: left; }
th { background: var(--surface); }
.badge { padding: 0 var(--space-1); border-radius: var(--radius); background: var(--surface); color: var(--text); font-size: var(--size-small); }
.badge.done { background: var(--done-surface); color: var(--done-text); }
.badge.now { background: var(--now-surface); color: var(--now-text); }
.badge.stop { background: var(--stop-surface); color: var(--stop-text); }
:focus { outline: 2px solid var(--link); outline-offset: 2px; }`
