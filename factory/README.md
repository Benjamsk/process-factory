# The factory folder

This folder holds the AI factory's state for this project: `board.json` with every job and its stage, `backlog.md` with
the work that has not started yet, and `jobs/<job-id>/` with the request, the spec, the acceptance mapping, the build
report and the reviews of each job.

`board.json` has exactly one writer, the `pnpm factory` command line. Never edit it by hand: a hand-written board and
the dashboard's mirror of it drift apart, and the commands refuse a board they cannot read.

Work starts in `backlog.md`, one item per line in the form `- [ ] Title: details`. `pnpm factory next` takes the first
unchecked item, creates the job folder and the branch for it and moves it into the loop; `pnpm factory show` prints the
board.

`.gitignore` keeps everything in this folder except this README out of git, so the board, the backlog and the job
folders stay on the machine the factory runs on.

The loop each job goes through, and what every command and agent does in it, is described in
`.claude/skills/factory/SKILL.md` and in the README of `@olevedeler/kaizen-factory`.
