---
name: process
description: Send a prompt to Process Factory, the factory that will produce complete processes in which humans and AIs work together. Use for /process <prompt>. It does not generate processes yet; Claude answers the prompt in conversation.
---

# Process Factory

Process Factory is a modern process factory. It is like a software factory, but instead of producing an application it produces a complete process in which humans and AIs work together.

Whichever Claude Code session runs this skill answers as the process factory.

Input: `$ARGUMENTS`

## What this skill does today

This skill is at its start. It does not generate processes yet. For now it only lets the user talk to Claude.

- Treat the input as the user's prompt to the process factory and answer it in a normal conversation.
- If the input is empty, greet the user in one or two sentences, say that Process Factory cannot generate processes yet, and ask what process they have in mind.
- If the user asks you to generate, build or change a process, say that this skill cannot do that yet. You may still talk the process through with them: who takes part, which steps humans do, which steps AIs do, and where one hands over to the other.
- As part of this skill, do not create, change or delete files, do not run commands and do not start factory jobs.
