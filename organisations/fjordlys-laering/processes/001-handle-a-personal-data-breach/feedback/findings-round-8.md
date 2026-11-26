# Findings of round 8

Process: 001-handle-a-personal-data-breach
Round: 8
Draft: draft-10.md
Sent back at: 2026-11-23T03:26:57.609Z

## gdpr

Verdict: CHANGES

- [medium] Step 3, with "What to record": Marius Tangen writes who reported the case and what they said into the record, which is kept five years and may be given to Henrik Aas of Aas & Wold, but the draft nowhere says that a reporter from outside the company, such as a parent or a researcher under "When this applies", is told that their name and their report are written in the record, why and for how long, which Article 13 requires; the answer to the person who reported it in step 3 is where that belongs. spec.md does not say this either.
- [medium] "What to record", the line "Who was told and when, and the message that went to the school owners": the record holds the message to the school owners but not what the people affected were told, although step 35 and step 36 send teachers, school contacts, employees and job applicants a message of their own; Article 33(5), which must let Datatilsynet check that Article 34 was followed, requires that the message sent to the people affected and the time it was sent go into the record as well. spec.md does not say this either.

## legal

Verdict: CHANGES

- [medium] Steps 1 and 15: the draft lets the AI support assistant go on answering support cases on its own and says of the hand-over signs that "that is the whole list of signs", without the limits the AI use policy puts on every one of these steps; the two steps must also say that a human decides any case that concerns a complaint, a contract or personal data, and that every answer the assistant sends on its own comes from an approved help article. Rule: the AI use policy, as `Legal basis` of `spec.md` names it.

## readability

Verdict: CHANGES

- [high] `Steps`, the order of the steps against their deadlines: step 21 has to be done within 2 hours of the report but stands after step 17 (3 hours), step 18 (4 hours) and step 20 (24 hours), and step 17 stands after steps 4, 6 and 9 (4 hours), so the reader who does the steps in the order they are written misses the earlier deadlines; put the steps in the order in which they have to be done, or say at the head of `Steps` which of them run at the same time.
- [high] Steps 13 and 14 start from "where the answer is yes" and "where the answer is no", but that answer is Marius Tangen's judgement in step 12, and Petter Dahl and Nora Lind cannot reach it with what they know in the moment: in working hours the draft names nobody who tells them, and step 16 covers only outside working hours. The steps must say that Marius Tangen tells Petter Dahl and Nora Lind his answer at once. `spec.md` does not say who tells them either.
- [medium] Steps 1, 3 and 5 each ask for several actions: step 1 for preparing the standing configuration, preparing the standing holding message, getting the approval of Ingrid Solheim and Kari Nordmann and reviewing both every six months; step 3 for answering the person who reported, opening the record, deciding whether the breach may still be running and writing which systems may be touched ("which is four things"); step 5 for making the folder, putting the secured copy in it, setting the rights on it and writing in the record that you did. Make each action a step of its own.
- [medium] Step 22: "do the work in your own system" names no action the reader can do, and the six people named are not told what to look for or what to hand over; step 23 says it only for Tomas Berg, and the list in step 24 is addressed to Marius Tangen for the fact page. Say what each of them establishes in their system and gives.
- [medium] Steps 14 and 23 are headed with one role but hold a rule that binds others: step 14 is headed "Head of people (Nora Lind)" and opens with a rule that is not her action (the support desk and the AI support assistant are not closed, and the case goes on without steps 13 and 15 to 19), and step 23 is headed "Head of finance (Tomas Berg)" and holds the rule that binds everyone else who gives facts about a system and whoever writes the fact page. The reader who is one of those others never finds the rule under their own step: put the rule where it binds, in step 22, and leave in step 14 only Nora Lind's own action.
- [medium] Step 4: the deadline comes after the action it belongs to and as a result rather than as an instruction, in the last sentence "The logs are secured within 4 hours of the report". Say it in the instruction itself: secure the logs within 4 hours of the report, before anything is fixed in production and before anything is deleted.
- [medium] Step 13 gives one act two names: Petter Dahl "switch[es] the AI support assistant into hand-over for breach cases" and the on-call developer "switches on the standing configuration", which step 1 says are the same thing, so the reader cannot tell whether the on-call developer does something else. Use one name in both halves of the step.
- [medium] Steps 17 and 18 give one thing two names: "the sentences support may use" and, in the last sentence of step 18, "the approved wording". Use "the sentences support may use" in both places.
- [medium] "When this applies", second paragraph: "the on-call developer takes the report and wakes him" writes the role without the name of the person who holds it, while steps 2, 3, 6, 13, 16, 20 and 21 all write "the on-call developer (Erik Moen)". Name him here too.
- [medium] "school contact" is used in steps 24, 29 and 35 and under "Who must be told" without being explained where the reader first meets it, so the reader cannot tell whether a school contact is the school owner, a teacher or someone else. Neither `spec.md` nor the organisation files explain the term.
- [medium] "the record of processing activities", in step 39 and in the last paragraph of "What to record", is used without being explained and reads as "the record" of the case, which is the other thing the draft calls the record. `spec.md` explains it as the list of the company's processing activities that Kari Nordmann keeps and reviews every six months.
- [low] Steps 24, 32, 36 and 37 say what a document holds instead of telling the reader to write it: "the fact page holds", "the notification says", "The message to the people affected says" and "The list exists with one named person per measure". Write them as instructions to the person the step names.
- [low] The second bullet of the list of ways a report arrives, under "When this applies", and step 22 are each one sentence holding seven and six separate cases, so the reader has to read them again to find the one that is theirs. Give each processor and each person responsible for a system its own line.

## simulation

Verdict: PASS

No findings.
