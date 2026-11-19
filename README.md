# Process Factory

## Product

Process Factory is a modern process factory.

It is like a software factory, but instead of producing an application it produces a complete process in which humans and AIs work together.

## How it relates to the software factory

A software factory takes a request and produces working software. This repository is itself built by one: the Kaizen factory, which turns each request into a specification, tests, code and reviews.

Process Factory applies the same idea to a different result. What it produces is not an application but a process: a complete way of working in which humans and AIs each do their part.

## Status

The product is at its start. It cannot generate processes yet. What works today is one skill for Claude Code and the command line it drives: `/process <prompt>` creates a process under a short title that Claude writes from the prompt, stores the prompt with it and reports its id and its stage, `/process show` prints the board, `/process show <process-id>` prints one process, and `/process next <process-id>` runs the stage the process is in. Three stages have a step. In `intake` a questioner agent reads the request and the organisation context and writes the questions a complete process needs to `questions-<n>.md` in the folder of the process, which then moves to `clarify`, or straight to `spec` when there is nothing to ask. In `clarify` Claude asks the user those questions one at a time and stores the answers, and the process moves to `spec`. In `spec` a spec writer agent writes `spec.md` in the folder of the process, with ten sections that are each marked decided or open. When open sections need an answer from the user it writes the next `questions-<n>.md` and the process goes back to `clarify`, and when every section is decided Claude shows the specification and moves the process to `cases` after the user accepts it. For every other stage `next` reports the stage and moves nothing.

To use it in a project, add the package with `pnpm add -D github:Benjamsk/process-factory` and run `pnpm exec process-factory init` in the project's folder. That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md` and `spec-writer.md` next to it, and `/process` is available in the next Claude Code session there. Run `init` again after an upgrade.

The command line also keeps the process store. `process-factory new "<title>" "<prompt>"` creates a process: it makes `processes/<process-id>/` with `request.md`, which holds the title and under it the prompt, and the folders `cases`, `drafts`, `rounds`, `versions` and `feedback`, lists the process in `processes/board.json` in the stage `intake`, and prints its id. Only the `process-factory` command line writes the store, with two exceptions: the questioner writes `questions-<n>.md`, and the spec writer writes `spec.md` and `questions-<n>.md`.

Every process is in one of the stages `intake`, `clarify`, `spec`, `cases`, `draft`, `review`, `rework`, `approval`, `published` and `regenerate`. `process-factory move <process-id> <stage>` moves a process to another stage and records the date and time of the change on the board; it refuses a move the state machine does not allow and names the stages that are allowed. `process-factory show` prints the board, and `process-factory show <process-id>` prints one process with its history. `process-factory answer <process-id> <file>` stores a file as `answers-<n>.md` next to the newest `questions-<n>.md` of a process in `clarify` and moves the process to `spec`.

The factory reads what it knows about the organisation from the folder `organisation/`. `process-factory org init`, or `/process org init` in Claude Code, creates it with the files `roles.md`, `systems.md`, `processors.md`, `policies.md` and `authority.md`, each with one example section to replace. It writes only the files that are missing and never overwrites one. `/process org` in Claude Code interviews the user one area at a time, writes what it learns into these files, and lists in `organisation/unknown.md` what is still missing and which processes on the board it blocks.
