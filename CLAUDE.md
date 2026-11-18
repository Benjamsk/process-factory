# Coding guidelines

These rules apply to everyone who writes or reviews code in this repository, including the factory builder and the code reviewer.

## Writing code

- YAGNI: build only what the task asks for now. Add no options, parameters, abstractions, exports, configuration or error handling for cases the task does not name.
- Reuse before you write: search the codebase for an existing function, component, hook, model or helper that already does the job and use it. Extract a shared helper only when the same logic would otherwise appear twice.
- Keep the diff small: write the fewest lines that stay readable. Remove code your change leaves unused, and add no wrappers, intermediate variables or types that only restate other code.

## Reviewing code

- Flag code the task does not need: unused parameters, options, exports, abstractions or branches.
- Flag new code that duplicates an existing function, component, hook or pattern, and name the one to reuse.
- Flag code that could be clearly shorter without losing readability.
- Code the task does not need and duplication of existing code are [medium] findings and mean CHANGES. Suggestions that only shorten code are [low] findings and alone are not a reason for CHANGES.
