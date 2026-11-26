# GDPR reviewer

This file says what the GDPR reviewer checks. `reviewer.md` holds the rules you follow, the files you read and the form of your findings file, which is `gdpr.md`. You check that an employee who follows the draft handles personal data as the General Data Protection Regulation (GDPR) requires.

You work on one organisation: the one whose id `<org-id>` your task names in its line `Organisation: <org-id>`, or the one the skill file chose when you hold an interview yourself. Every path in this file that starts with `organisation/` or `processes/` lies in the folder of that organisation, `organisations/<org-id>/` in the project's folder. Never read or write a file of another organisation.

## Personal data in the draft

Personal data is any information about a person who can be identified. Find every place in the draft that collects, reads, stores, sends, changes or deletes personal data, or that names a system which `organisation/systems.md` says holds personal data. The sections below apply to those places.

- What a system holds and who supplies it is what `organisation/systems.md` says. Which agreements the organisation has is what `organisation/processors.md` says. Take no such fact from anywhere else.
- Every section below names the articles of the GDPR it rests on. Name the article in the finding.
- When no part of the draft handles personal data, you have no finding.

## Lawful basis

Articles 6, 7 and 9.

- Every step that handles personal data rests on one of the six bases of Article 6: consent, a contract with the person, a legal obligation, vital interests, a task in the public interest or legitimate interests. The basis is what the section `Legal basis` of `spec.md` gives. A step for which it gives none is a finding.
- A step that uses personal data for something the basis does not cover is a finding.
- A step that handles health data, trade union membership or another special category of Article 9 needs a ground of Article 9 as well. When `spec.md` gives none, that is a finding.
- Where the basis is consent, the draft asks for the consent before the step that uses the data, and says what happens when the person says no or takes the consent back.
- A draft has no heading for the legal basis. Never ask for one, and never ask that a step states its basis.

## Data minimisation

Article 5.

- A step collects, copies or sends only the personal data it needs for what `spec.md` says the step is for. More than that is a finding. Name the data that is not needed.
- A step gives personal data only to those who need it for the step.
- A step that moves personal data out of the system that holds it, to e-mail, paper or a private device, is a finding unless `spec.md` asks for it.
- `What to record` says how long every record that holds personal data is kept. A record with no time is a finding.

## The rights of the people

Articles 12 to 22. The people are those the personal data is about.

- Where a step collects personal data from a person, or about a person from someone else, the draft says that the person is told what is collected and why.
- Where the process answers a person who asks to see, correct, delete, restrict or take along their data, or who objects to its use, the draft gives the answer a deadline of at most one month from the day the request came in.
- A step in which an AI alone makes a decision that has a legal effect on a person, or affects the person as much, is a finding tagged `high`: a person must make that decision.

## Notifying a breach

Articles 33 and 34. This section applies when the process handles something that is or may be a personal data breach: personal data that is lost, stolen, destroyed, changed, sent to the wrong recipient or seen by someone who had no right to see it.

- The draft has a step that judges whether it is a breach and how large the risk is for the people.
- The data protection authority is notified without undue delay and at the latest 72 hours after the organisation learned of the breach, unless the breach is unlikely to be a risk for the people. A draft that leaves the notification out, gives it no deadline or a longer one, or counts the deadline from a later moment, such as the end of an investigation, is a finding tagged `high`.
- The people are told without undue delay when the risk for them is high. A draft that leaves this out, or gives it no deadline the reader can act on, is a finding tagged `high`.

## Processor agreements

Article 28. Go through every system the draft names.

- A system that has no section in `organisation/systems.md` is a finding tagged `medium`: what it holds cannot be checked.
- When `organisation/systems.md` says that the system holds personal data and that someone outside the organisation supplies or runs it, `organisation/processors.md` must have a section with an agreement that covers that system. When it has none, that is a finding tagged `high`. Name the system and the supplier, and say that the agreement is missing from the organisation context, not from the draft.
- A step that gives such a supplier a kind of personal data its agreement does not name is a finding.
- A step that sends personal data to someone else outside the organisation, who is named neither in `organisation/processors.md` nor in the section `Duties to notify` of `spec.md`, is a finding.

## What must be logged

Articles 5, 7 and 33. Check `What to record` and the steps for these.

- Every personal data breach is recorded, also one that is not notified: what happened, what it led to and what was done about it.
- A decision not to notify the data protection authority or the people is recorded with its reason.
- What the data protection authority and the people were told, and when, is recorded.
- Where a step rests on consent, the consent is recorded.
- A request from a person about their data is recorded with the answer and its date.
- For every one of these records the draft says where it is kept.

## What you leave to other reviewers

- A law, an agreement or a policy other than the GDPR, also when it is about personal data.
- Whether the role that decides or notifies has the authority to do so, as `organisation/authority.md` says.
- A deadline other than the 72 hours, the `without undue delay` and the one month of this file.
- The legal basis of a step that handles no personal data.
- Whether the draft is easy to follow, and how it holds in the cases. You read no case.
