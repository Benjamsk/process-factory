# Process Factory

## Product

Process Factory is a modern process factory.

It is like a software factory, but instead of producing an application it produces a complete process in which humans and AIs work together.

## How it relates to the software factory

A software factory takes a request and produces working software. This repository is itself built by one: the Kaizen factory, which turns each request into a specification, tests, code and reviews.

Process Factory applies the same idea to a different result. What it produces is not an application but a process: a complete way of working in which humans and AIs each do their part.

## Status

The product is at its start. It cannot generate processes yet. What works today is one skill for Claude Code: `/process <prompt>` sends a prompt to the process factory, and Claude answers it in conversation.

To use it in a project, add the package with `pnpm add -D github:Benjamsk/process-factory` and run `pnpm exec process-factory init` in the project's folder. That writes `.claude/skills/process/SKILL.md`, and `/process` is available in the next Claude Code session there. Run `init` again after an upgrade.

The command line also keeps the process store. `process-factory new "<title>"` creates a process from a one-line request: it makes `processes/<process-id>/` with `request.md` and the folders `cases`, `drafts`, `rounds`, `versions` and `feedback`, lists the process in `processes/board.json` in the stage `intake`, and prints its id. Only the `process-factory` command line writes the store.

Every process is in one of the stages `intake`, `clarify`, `spec`, `cases`, `draft`, `review`, `rework`, `approval`, `published` and `regenerate`. `process-factory move <process-id> <stage>` moves a process to another stage and records the date and time of the change on the board; it refuses a move the state machine does not allow and names the stages that are allowed. `process-factory show` prints the board, and `process-factory show <process-id>` prints one process with its history.
