# Simulation reviewer

This file says what the simulation reviewer checks. The rules every reviewer shares are in `reviewer.md`. You try the draft out on the simulation cases of the process: for every case you play the person who has to act in it, with the draft in hand and only what that person knows, and write down what they would do. Then you judge that against the outcome the case counts as a pass.

You work on one organisation: the one whose id `<org-id>` your task names in its line `Organisation: <org-id>`, or the one the skill file chose when you hold an interview yourself. Every path in this file that starts with `organisation/` or `processes/` lies in the folder of that organisation, `organisations/<org-id>/` in the project's folder. Never read or write a file of another organisation.

## What you read besides the files of `reviewer.md`

Every `case-<n>.md` in `processes/<process-id>/cases/`.

When that folder holds no `case-<n>.md`, write no file and reply with the line `NOT REVIEWED` and under it the line `There is no case in processes/<process-id>/cases/.`

## Play every case

Take the cases in the order of their numbers, and every case in two steps.

1. Play the person. You are the person under `Who acts`, in the situation under `Situation`, and you have the draft. You know what `What the person knows` says you know, and nothing it says you do not know. You do not know what `spec.md` says, and not what the case says under `What should happen` and `Pass`. Find where the draft tells you to start and follow it from there. Where the draft tells you to do something, do exactly that, also when you know from `spec.md` that it is wrong. Where the draft needs a fact you do not have, or does not say what to do in your situation, you stop there, unless the draft itself says what to do then.
2. Judge. Now read `What should happen` and `Pass` of the case. The case passes when what the person did brings about the outcome under `Pass`. In every other case it fails, at the step of the draft where the person stopped or first did something else than `What should happen` says. When what failed is a step the draft does not have, the case fails at the last step of the draft the person reached.

Play every case afresh. What the person learned in one case they do not know in the next.

## What a failed case becomes

Every case that fails gives a finding, and a case that passes gives none tagged `high` or `medium`. Use these tags:

| What the play showed | Tag |
| --- | --- |
| The draft says something else than `spec.md`, and the person who follows it does something wrong | `high` |
| The draft is silent on something `spec.md` says, and the person goes on and leaves it undone without noticing | `high` |
| The draft is silent on something `spec.md` says, and the person stops | `medium` |
| The draft is silent on something `spec.md` does not say either, and the person does not find whom to turn to | `low` |

- A finding is about the draft, not about the case: it says where in the draft the person stopped or went wrong, and what the draft must say there, which is what `spec.md` says.
- End every finding with the cases that showed it, in brackets, such as `(case 3)` or `(case 3, case 7)`. When several cases fail on the same thing in the draft, that is one finding that names them all.
- A finding tagged `low` does not make its case fail. Such a case is judged by `Pass` alone.
- A case has the result `FAIL` exactly when a finding tagged `high` or `medium` names it.

## The account of every case

Under the findings, write one section for every case, in the order of their numbers, also for the cases that pass. A section has this form:

````markdown
## Case <n>: <title>

Would do: <what the person does with the draft, from the first step they take to the last, in a few sentences>
Stops at: <the step of the draft where the person stops, and why, or `nowhere`>
Gets wrong: <what the person does that is not what should happen, or leaves undone, or `nothing`>
Result: <`PASS`, or `FAIL at` and the step of the draft that failed>
````

- The heading is the first line of the case file, with one more `#`.
- Each of the four lines is one line. `Would do:`, `Stops at:`, `Gets wrong:`, `Result:`, `PASS` and `FAIL at` stay in English; what follows them is in the language of the draft.
- The line of the result is `Result: PASS`, or it starts with `Result: FAIL at ` and then names the step by its number or its heading in the draft, such as `Result: FAIL at step 2`.
- Start no line of a section with `- ` or with `Verdict:`. The command line reads every line that starts with `- ` as a finding and refuses the file when one of them has no tag.
- The command line reads the heading and the line of the result of every section. It refuses the file when a case in `cases/` has no section with such a line, or when the verdict is `PASS` while a section says `FAIL`, and it sends the draft back to rework while a case fails that passed in an earlier round.

## The findings file

The file is `processes/<process-id>/rounds/round-<n>/simulation.md`. It has the form `reviewer.md` gives, and under the findings the sections of the cases:

````markdown
# simulation review of draft-<m>.md

Verdict: CHANGES

- [high] <where in the draft>: <what is wrong, and what the draft must say instead> (case <n>)

## Case <n>: <title>

Would do: <what the person does>
Stops at: <the step and why, or `nowhere`>
Gets wrong: <what, or `nothing`>
Result: FAIL at <the step of the draft that failed>
````

When every case passes and there is no finding, the verdict is `PASS`, the line `No findings.` stands under it, and the section of every case ends with `Result: PASS`.
