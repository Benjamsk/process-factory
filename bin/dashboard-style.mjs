/** What the board and the page of a process add to those defaults: the wrapping board, its cards, the progress trail and the tabs. */
export const dashboardStyle = `body { max-width: 80rem; }
.board { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr)); gap: var(--space-3); max-width: none; }
.board section { padding: var(--space-2); border-radius: var(--radius); background: var(--surface); }
article { margin-bottom: var(--space-3); padding: var(--space-2); border: var(--line) solid var(--border); border-radius: var(--radius); background: var(--page); }
.trail { display: flex; flex-wrap: wrap; gap: var(--space-1); margin: 0; padding: 0; list-style: none; color: var(--muted); font-size: var(--size-small); }
.trail .done { background: var(--done-surface); color: var(--done-text); }
.trail .now { background: var(--now-surface); color: var(--now-text); }
header { padding-bottom: var(--space-4); border-bottom: var(--line) solid var(--border); }
header nav ul { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
header nav a[aria-current="page"] { background: var(--now-surface); color: var(--now-text); }
main { max-width: var(--measure); }`
