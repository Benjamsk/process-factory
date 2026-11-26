# Findings of round 5

Process: 001-handle-a-personal-data-breach
Round: 5
Draft: draft-5.md
Sent back at: 2026-11-23T00:50:44.163Z

## gdpr

Verdict: CHANGES

- [high] Step 23, and the third bullet of `Who must be told` outside the company: whether the affected people are told is left wholly to Ingrid Solheim's decision, with no criterion, so a breach that is likely to result in a high risk for the people can end with nobody being told; Article 34 requires that the people are told without undue delay when the risk for them is high, and the step must say that where the fact page shows a high risk for the people they are told, so that only the wording and the way they are reached, not whether they are told, is the decision. `spec.md` gives no such criterion either.
- [medium] Step 21, and the second bullet of `Who must be told` outside the company: the decision whether Datatilsynet is notified has no criterion, so a reader can read it as free, while Article 33(1) makes the notification a duty unless the breach is unlikely to result in a risk for the people; the step must say that Datatilsynet is notified unless the fact page shows that the breach is unlikely to be a risk for the people, and that a no is only for that case. `spec.md` gives no such criterion either.
- [medium] Step 16, the fact page: the only item about the consequences is `the likely consequence for the children`, so a breach of teacher, support desk, employee or applicant data, where the company is the controller itself, reaches steps 21 and 23 without any judgement of the risk for those people, which is what Article 33(3)(c) requires in the notification and what the two decisions rest on; the fact page must hold the likely consequence for every kind of person affected, not only for the children. `spec.md` step 12 names only the children.
- [medium] Last paragraph of `What to record`: the Nordsky Cloud access logs secured in step 2 hold the personal data of everyone who logged in to the app or the platform and are copied out of the 90-day retention, and the draft says only that they are `stored where Kari Nordmann can find them again`, with no time; Article 5(1)(e) requires that the draft says how long the secured logs are kept, as it does for the record itself with its five years. `spec.md` gives no time for them either.
- [medium] `What to record`: a decision not to tell the affected people is nowhere in the record, because the record holds the reason and the name only for the decision on Datatilsynet and otherwise only `Who was told and when` and the messages that went out; Articles 33(5) and 34 require that the decision of step 23 is recorded with its reason and the name of the person who took it whether the answer is yes or no, as the decision on Datatilsynet is. `spec.md` names only the decision on Datatilsynet in its `Records` section.
- [medium] Steps 5, 7 and 22, and the third bullet of `When to hand over`: Henrik Aas of Aas & Wold is outside the organisation and receives the case, the fact page and the data it holds about pupils, teachers, employees or job applicants, and writes and sends the notification, but Aas & Wold has no section in `organisation/processors.md` and is named neither there nor in the section `Duties to notify` of `spec.md`, so Article 28 cannot be checked for this recipient; the agreement is missing from the organisation context, not from the draft.
- [medium] `When this applies`, the paragraph listing the systems the process covers, together with step 16: the payroll system holds the absence and sick leave of the 48 employees, which is health data and so a special category of Article 9, and a breach there is in scope, yet neither the draft nor the section `Legal basis` of `spec.md` gives a ground of Article 9 for handling it in the fact page, the notification and the messages; the ground is missing from `spec.md`, so the draft cannot state it.
- [low] Step 20: the draft says the message goes to all affected school owners at the same time but not that each school owner gets its own message, which allows one message addressed to all of them and so gives every school contact the work email addresses of the others, who do not need them for the step; Article 5 asks for one message per affected school owner, sent to them all at the same time.

## legal

Verdict: CHANGES

- [high] Step 27: the step caps the date on each measure at 2 weeks after the case is closed, which is not the deadline the rule gives and contradicts the 30 days and the 90 days in step 29; the step must say that the dates on the measures are set within 2 weeks of the case being closed, and leave the time for a measure to be in place to step 29. Rule: "Dates on the measures: set within 2 weeks of the case being closed", in the section `Deadlines` of `spec.md`.
- [high] Step 29: the 30 days for a measure that could let the same breach happen again and the 90 days for any other measure do not say what they count from, and the draft's own rule that every time counts from the report covers only the times up to the closing of the case; the step must say what the 30 days and the 90 days count from, and `spec.md` does not say it either. Rule: "A measure that could let the same breach happen again: in place within 30 days. Any other measure: within 90 days", in the section `Deadlines` of `spec.md`.

## readability

Verdict: CHANGES

- [high] Steps 1, 3, 10, 12 and 16: the steps turn on whether it is "outside working hours" or "in working hours", and the draft never says what the working hours are, so at 16:30 on a Tuesday the reader cannot tell whether the on-call developer (Erik Moen) or support lead Petter Dahl does the step. Say in the draft which hours count as working hours. `spec.md` uses the same words without saying either; the organisation files give Monday to Friday 08:00 to 16:00 only as the hours in which Silje Haugland and Petter Dahl are reachable.
- [high] Step 27: "Set the date for each measure no later than 2 weeks after the case is closed" can be read as the measure's own date having to fall within 2 weeks of the closing, and as the dates having to be written down within 2 weeks after the closing, and with the 30 and 90 days of step 29 the reader cannot tell which is meant and would set different dates. Say which of the two the step asks for.
- [medium] Step 11, step 13 and the fourth bullet of "Who must be told": three duties name nobody who carries them out: "Silje Haugland and Petter Dahl are telephoned at home at once", "The sentences must exist as actual sentences in the support desk within 4 hours of the report" and "In working hours the real wording replaces the standing holding message". Name the person who telephones the two, the person who puts the sentences into the support desk and the person who replaces the holding message with the real wording. `spec.md` does not say who does any of the three either.
- [medium] Step 3: the step asks for three actions at once: stop the breach by closing the access, revoking the token and locking the account; decide whether the reading app or a part of it goes offline; and tell head of product Jonas Vikane and head of customer success Silje Haugland when it does. Split them into separate steps.
- [medium] Steps 18, 19 and 20: the steps on the message to the affected school owners do not say that they apply only to a breach of pupil data in the reading app, where the company is the processor, while steps 21 to 26 do say "where the company is the controller". The reader handling a breach of employee or applicant data alone reaches step 18 with no way to tell that it is not for their case; the condition stands only under the later heading "Who must be told". Put the condition in steps 18, 19 and 20.
- [medium] Step 7: the reader is told to "write the line in the record" the first time the record is mentioned, without being told what the record is or where it is written, and the same in step 21 and step 28. Say at step 7 that the record is the one document for the case, kept where "What to record" says it is kept.
- [medium] Step 30 and the last paragraph of "What to record": "the record of processing activities" is used without being explained where the reader first meets it. Say in one clause what it is. The organisation files explain it, but the reader does not have them.
- [low] "Who does what", the on-call developer: the sentence that the role is held each week by one of the eight developers of the two development teams on a rota Amina Farah sets a month ahead is background the reader cannot act on; the name Erik Moen, the stand-in and the on-call telephone number are what they need.

## simulation

Verdict: PASS

- [low] Step 9: the draft names no one who tells Nora Lind that the case is a breach of employee or applicant data alone, and she is not in the list of who must be told inside the company, so nothing starts her step; the draft should name who tells her, and spec.md does not say it either (case 5)
