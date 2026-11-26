# Findings of round 4

Process: 002-report-a-lost-laptop
Round: 4
Draft: draft-5.md
Sent back at: 2026-11-23T22:14:20.844Z

## gdpr

Verdict: CHANGES

- [medium] `What to record`: the record does not hold that the person who had the device was told what is read about them and when, nor that the telling in step 20 was sent to a person who has left; it holds only the case where no address reaches them, so the tellings of steps 19 and 20 cannot be shown to have happened at all, against Articles 5(2) and 13. The record must hold that each telling was sent, to which address and at what time, and the `Records` section of `spec.md` does not name it either.
- [medium] Step 2 and the first bullet of `What to record`: the record keeps who reported the loss and what they said for 3 years, or 5 where the loss was a personal data breach, and that reporter can be someone outside the company such as a hotel, a train company or a finder, but the `Legal basis` of `spec.md` gives a basis only for the personal data of the person who had the device, Article 6(1)(f), and none for the reporter's. The basis for keeping the reporter's name and what they said is missing from `spec.md`, not only from the draft.
- [low] Step 19, and step 20 which sends the same thing: the telling does not say that where the person has left the company or cannot be reached, head of people Nora Lind gives what the company knows about them, which step 18 says is who had the device, when they left, what they handed back and what they said about it then, and it does not say that the entry in the equipment register naming them is kept as long as the record. The telling must name those two as well, Articles 13 and 14, and step 13 of `spec.md` does not name them either.
- [low] Step 2: nothing tells whoever reported the loss that their name and what they said are written into the record and why, Article 13, and this is not in `spec.md` either. Where the reporter is someone outside the company, such as a hotel, a train company or a finder, they meet nothing that says so.

## legal

Verdict: PASS

- [low] Step 9, and the third bullet of `Who must be told`: the duty to tell Nora Lind that the person's accounts and access are blocked is the right duty, told by the right person about the right thing, but the time `within 2 hours of the report` is set by no rule; the step should say only that she is told as soon as the accounts and access are blocked, and `spec.md` gives no deadline for this telling either. Rule: the section `Block an employee's accounts and access` of `organisation/authority.md`, which says that Nora Lind must be told and sets no time.

## readability

Verdict: CHANGES

- [high] Step 13: the step cannot be done where it stands, because it ends `Send this question only together with what step 19 tells them`, so the reader has to do step 19 before they can finish step 13; put the asking and the telling in one step, or put the telling before the asking.
- [medium] Steps 4, 21 and 26: the exception for a device the company does not own is missing where the action is. Step 3 says `Do not do it where the device is the person's own` and step 8 says `Not where the device is the person's own`, but step 4 (lock the device), step 21 (decide the wipe) and step 26 (wipe the device) say nothing, so a reader who follows them locks and wipes a private device; the rule stands only in the fourth paragraph of `When this applies`, under another heading. Steps 4, 21 and 26 must each say that this is not done where the device is the person's own.
- [medium] Steps 3 to 7: that outside working hours the on-call developer, Erik Moen, locates and locks the device at once and revokes an access token and locks the account in Nordsky Cloud stands only under `Who does what` and `When to hand over`, so the on-call developer who is reading `Steps` at night finds no step that is his. Say at steps 3 to 7 what the on-call developer does at once outside working hours and what waits for Marius Tangen.
- [medium] `When this applies`, second and fifth paragraphs: three terms are used before they are explained. `the office suite` is first used in the second paragraph (`the staff handbook in the office suite`) and explained only in step 5; `device management` is first used in the fifth paragraph and explained only in step 3; `the equipment register` is first used in the second paragraph and explained one paragraph later. Explain each where the reader first meets it.
- [medium] `Who does what`, the on-call developer, and steps 5, 14 and 19: `Nordsky Cloud` is used throughout without ever being explained, while `device management`, `the office suite`, `the support desk` and `the reading app` all are. The organisation files call it the cloud platform the reading app runs on, supplied by Nordsky AS; say that where the reader first meets it.
- [medium] `When this applies`, seventh paragraph: `the fact page` is named as something this process does not cover, and the reader is never told what it is. Neither `spec.md` nor the organisation files explain the term, so the draft writer cannot define it here and should name only `Handle a personal data breach` as the place it belongs.
- [medium] Steps 21, 26, 27, 29 and 39: each asks for several actions at once, although steps 23, 24 and 25 split one telling into three. Step 21 asks the reader to ask Kari Nordmann, decide the wipe, write who decided to wait and why into the record, write into the record that neither she nor Henrik Aas could be reached and what was tried, and tell one of them later. Step 26 asks for the wipe and for writing the lost work into the record. Step 27 asks for the decision, for starting `Handle a personal data breach` by telling Marius Tangen and Ingrid Solheim, and for writing the line into the record. Step 29 asks for the decision, for starting the breach process, for writing three things into the record and for telling Kari Nordmann or Henrik Aas later. Step 39 asks for writing into the record, for not wiping, for checking the device and saying it is safe to use again, and for telling the person not to use it. Give each action its own step.
- [medium] Step 22: `Do not hold the wipe back longer than 1 hour because they cannot be reached` does not say when the hour starts, so the reader cannot tell when they may wipe. `spec.md` does not say what the hour counts from either, so the draft writer cannot state it here.
- [low] Step 21: `it was signed in to the reading app, which is the product the company sells, Nordsky Cloud or the support desk` has to be read twice, because the explanation of the reading app sits between the first item of the list and the rest of it. Put the explanation at the end of the list or in brackets.
- [low] Step 10: `where any password, key or token was stored on a device device management cannot reach, change or revoke it in every system it could reach` stops the reader twice: `a device device management` reads as a slip, and `it` stands first for the password, key or token and then for what reaches the systems. Name the thing in the second half instead of `it`.
- [low] Step 28: `because that moment is the moment the company became aware` is a reason the reader does not need in order to act, and the same sentence stands again under `Who must be told`.

## simulation

Verdict: PASS

- [low] "If something does not fit": the draft says that no one is named to turn to when it does not cover the situation, so a person who meets a situation the draft is silent on has nobody to ask and nothing to do but carry on; `spec.md` names nobody to turn to either, so the draft writer cannot fill this (case 5, case 7, case 10, case 11, case 12, case 13, case 17, case 21)
- [low] steps 21 and 26: the data protection officer is asked only at the wipe decision, so where the decision was to wait and the device is wiped days later at the 72-hour limit, a device that held personal data is wiped without the data protection officer being asked at that point; `spec.md` says the same, that the 72-hour wipe is done "without asking again", and does not say whether the data protection officer is asked before it (case 4)
- [low] step 4: the order to lock the device carries no exception for a device that is the person's own, while step 3 (locate) and step 8 (block) both say not to do it for a private device; `spec.md` keeps locating and locking in one step with the exception, so step 4 should carry it too (case 11, case 19)
