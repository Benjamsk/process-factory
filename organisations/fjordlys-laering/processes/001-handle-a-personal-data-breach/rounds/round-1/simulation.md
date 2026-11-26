# simulation review of draft-1.md

Verdict: PASS

- [low] Step 3: the draft tells the head of IT to close the access, revoke the token and lock the account, but does not say who stops a breach that sits in a processor's own system, such as the fault at Lønn Norge AS in the payroll system, where the company has no access of its own; the draft should name whom to ask, and `spec.md` does not say this either (case 5).
- [low] Step 14: the draft requires the message to go to every affected school owner, but does not say which school owners are told when the Nordsky Cloud logs cannot say whose data was reached and the fact page therefore says not established; the draft should say what Silje Haugland sends then, and `spec.md` does not say this either (case 6).

## Case 1: Nordsky AS reports an open storage bucket

Would do: He takes the report at 09:10 on the Tuesday (step 1), exports and copies the Nordsky Cloud access logs out of the normal retention before anything is deleted or fixed in production and closes the open storage configuration, both well inside 4 hours (steps 2 and 3), writes down 09:10 and Nordsky AS as the reporter (step 4), telephones Kari Nordmann and Ingrid Solheim so that they have the case before 13:10 (step 5), decides that it is a real breach (step 6) and, because pupils of two school owners are affected, switches support closed to the subject (step 8), so that the AI support assistant goes into hand-over and the standing holding message goes into the support desk and Silje Haugland and Petter Dahl are telephoned at once (step 9) and the sentences Ingrid Solheim decides and Kari Nordmann checks are in the support desk by 13:10 (step 10); he then owns and signs off the fact page within 24 hours with Amina Farah doing the work in the systems and the page saying that the company is the processor for the recordings (step 12), the message goes to both school owners at the same time inside 24 hours of 09:10 and before Datatilsynet (step 14), he draws up the list of measures with one named person and one date each (step 18), and the record carries the timeline with real timestamps while Ingrid Solheim closes the case no earlier than 72 hours after 09:10 (step 19).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 2: Head of IT on holiday when a bug exposes another school's pupils

Would do: She reads under Who does what that she steps in for the head of IT while Marius Tangen is away, so she takes the report at 11:00 on the Wednesday (step 1), secures a copy of the Nordsky Cloud access logs before the bug is fixed in production (step 2), closes the exposure inside 4 hours and, finding no narrower way, takes that part of the reading app offline herself as the draft gives her that decision while he is away, telling Jonas Vikane and Silje Haugland the moment it happens (step 3), writes down the time and the teacher who reported it (step 4), telephones Kari Nordmann and Ingrid Solheim so that they have the case by 15:00 (step 5), decides as the stand-in head of IT that this is a real breach (step 6), owns the fact page within 24 hours and has Jonas Vikane sign it off as the draft says for the days Marius Tangen is away (step 12), and the pupil data makes this a processor case, so every affected school owner is told inside 24 hours of 11:00, at the same time and before Datatilsynet, with Ingrid Solheim deciding the wording, Kari Nordmann writing the part about the data and Silje Haugland sending it (step 14).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 3: A support case was reclassified as a normal bug five days ago

Would do: He reads under When this applies that the support person who sees such a case telephones Marius Tangen the same hour and does not only tag it, so at 14:00 on the Monday he telephones Marius Tangen rather than leaving the case in the development queue, and Marius Tangen has it before 15:00 (step 1); because the draft says the clock starts when the report reached the company and not when someone gets round to reading it, he gives Marius Tangen 08:30 on the Wednesday before and the name of the teacher as the time and the source of the report, which Marius Tangen writes down (step 4) and the record keeps with the timeline and real timestamps for the five days; Marius Tangen then secures the Nordsky Cloud access logs before the bug is fixed in production and stops the exposure (steps 2 and 3), Kari Nordmann and Ingrid Solheim have the case within 4 hours of the call (step 5), and Kari Nordmann keeps one list of duties for the case on which the earliest deadline binds (step 13); he goes on to collect the questions support cannot answer for Kari Nordmann once a day (step 11).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 4: Friday night report and the head of IT does not answer

Would do: He takes the report at 23:40 because the draft says the on-call developer takes it and wakes Marius Tangen when he cannot be reached, so he keeps telephoning until Marius Tangen is awake and the record names who called him and when (step 1); he revokes the access token and locks the account in Nordsky Cloud himself, which the draft gives the on-call developer outside working hours, well inside 4 hours of 23:40, while the Nordsky Cloud access logs are secured in the same window (steps 2 and 3); he starts the fact page with what is known in the first hours (step 12); because Friday is not one of Kari Nordmann's three working days the case goes to Henrik Aas of Aas & Wold on the firm's emergency number instead of waiting for Tuesday, and Ingrid Solheim is reached too, both inside 4 hours (step 5 and When to hand over); once support is closed to the subject he switches the AI support assistant into the standing hand-over configuration Petter Dahl prepared and puts the standing holding message approved in advance into the support desk, which the record notes with his name and the time (step 9 and What to record), and he telephones Silje Haugland and Petter Dahl at home, escalating to Ingrid Solheim when neither answers; he leaves the decision whether this is a real breach to Marius Tangen (step 6).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 5: Payroll breach that a newspaper is already asking about

Would do: He takes the report Tomas Berg forwards at 08:00 on the Tuesday and has the case inside 1 hour (step 1), secures what logs there are and writes down the time and the source of the report (steps 2 and 4), asks Lønn Norge AS to close the fault since the payslips are already out and the system is not his to change, telephones Kari Nordmann and Ingrid Solheim so that they have the case by 12:00 (step 5), confirms a real breach (step 6) and then meets the two rules of step 8 pulling against each other, the journalist making it likely to become publicly known and the data being employee data alone, and follows the draft's own answer that when he is unsure he switches it on, with his decision and its time in the record; he has Nora Lind write down what managers may say to staff as actual sentences (step 8), the fact page states that the company is the controller for the payroll data within 24 hours (step 12), he answers Ingrid Solheim on what happened in the systems for her decision on Datatilsynet at the latest 48 hours in (step 15), and no school owner is told because no pupil data of the reading app is involved; Kari Nordmann sends the notification inside 72 hours of 08:00 after he has checked the technical description and Ingrid Solheim has approved it (step 16), and Nora Lind tells the employees within 24 hours of Ingrid Solheim's decision (step 17).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 6: The access logs have already rolled over

Would do: He has secured the copy of what is left of the Nordsky Cloud access logs and closed the web address the same morning (steps 2 and 3), writes down the time and the source of the report (step 4) and tells Kari Nordmann and Ingrid Solheim inside 4 hours of 10:00 on the Wednesday (step 5); he owns the fact page and signs it off inside 24 hours with Amina Farah doing the work in the systems (step 12), and because step 12 tells him that where the logs cannot tell he writes that access cannot be ruled out and treats the case as accessed, the page states the four-month window, that access cannot be ruled out and that the case is treated as accessed, and writes the pupils and the school owners the logs cannot identify as not established rather than leaving any field blank; he does not treat the page as final until Kari Nordmann says she has what she needs, and the secured copy of the remaining logs is stored where she can find it again, with the record saying what the logs showed and what could not be established (step 12, step 19 and What to record).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 7: Documents about pupils in the office suite

Would do: She has the case from Marius Tangen, who had the notification from Microsoft within 1 hour of 13:00 on the Thursday and told her and Ingrid Solheim inside 4 hours, so by 17:00 (steps 1 and 5); she reads under When this applies that the process covers all personal data in all the company's systems, the office suite among them, and that a case touching both kinds of data is one case with one record and one timeline, so she opens one record (step 12 and What to record); she keeps one list of duties for the case with the pupil side and the controller side on the same list and the earliest deadline binding (step 13); for the fact page she requires the controller or processor role for each kind of data in the account and, for the exported spreadsheets about pupils that the draft does not place, has it written as not established rather than left blank (step 12); she advises Ingrid Solheim on the teacher data, where the company is the controller, so that the decision on Datatilsynet with its reason and her name is in the record at the latest 48 hours in, by 13:00 on the Saturday (step 15), and she stands ready to write the notification from the fact page inside the 72 hours (step 16).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 8: The AI support assistant answers a teacher who asks about the leak

Would do: He reads step 9, which tells him to change the configuration himself so that the AI support assistant hands over to a human every case that touches the breach on the ordinary signs a teacher would use, words such as leak, hacked, data, privacy or Datatilsynet, and a complaining parent, so he changes it at once and writes down when he did it, which the record carries with his name; because that configuration covers every case that touches the breach, he puts the four cases the assistant answered into the hands of a human support person; he leaves the assistant on for ordinary support cases from the approved help articles and keeps it from saying anything about the breach, not even that there is one; he sees that the sentences support may use are in the support desk by 13:00 on the Tuesday, with Ingrid Solheim deciding the wording and Kari Nordmann checking it, and that the real wording replaces the standing holding message in working hours (step 10); and he collects the questions support cannot answer and brings them to Kari Nordmann that day (step 11). The draft does not say what is done about the answers the assistant has already sent, which the case does not require either.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 9: Not a breach, on a Monday

Would do: He treats the phishing click as a start of the process, since When this applies names it, and a document is written for the reported case (What to record); he writes down the time of the report and who reported it (step 4), keeps the Nordsky Cloud and office suite sign-in logs he read (step 2) stored where Kari Nordmann can find them again, and reads at step 6 that he may judge the case not to be a breach but may not close it, even when it looks obvious to him; step 5 and When to hand over tell him that on a day that is not one of Kari Nordmann's three working days the case goes to Henrik Aas of Aas & Wold on the firm's emergency number and does not wait for Tuesday, and that Henrik Aas takes the decision that a case is not a breach, so he telephones him on the Monday, and Henrik Aas decides and writes the line that closes the case in the record himself with his name and his reason (step 7); the record also holds when the case was reported and by whom, what was done and what the sign-in logs showed, and nobody outside the company is told, because a case closed as not a breach is notified to nobody outside.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 10: A parent writes to the managing director

Would do: She reads under When this applies that when an outsider, a researcher or a parent writes to the general address or to her, whoever receives it forwards it to Marius Tangen and telephones him, so at 16:25 she both forwards the email and telephones him, and he has the case before 17:20, the clock running from 16:20 when the email arrived and not from when she read it (step 1); she leaves the systems to him, and because all the times run around the clock he secures the Nordsky Cloud access logs before anything is deleted or fixed in production and closes the page by 20:20 the same evening (steps 2 and 3), writes down 16:20 and the parent as the time and the source of the report (step 4) and tells her and Kari Nordmann, or Henrik Aas on a day Kari Nordmann does not work, by 20:20 (step 5); the data is pupil data of the reading app, so she decides what the message to every affected school owner says, Kari Nordmann writes the part about the data and Silje Haugland sends it to all of them at the same time by 16:20 on the Friday and before Datatilsynet (step 14), and she leaves the decision whether the parents are told to the school owner, as When this applies says the process does not cover it, so she does not answer the parent with that decision.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 11: The 24 hours to the school owners run out at 03:00 on a Sunday

Would do: She was telephoned at home when support was closed to the subject and has the wording Ingrid Solheim decided and the part about the data Kari Nordmann wrote; she reads under When this applies that all the times run around the clock, including evenings and weekends, and at step 14 that she sends the message to every affected school owner within 24 hours of the company becoming aware, which is 03:00 on the Saturday, and before Datatilsynet is notified, so she does not wait for Monday morning but sends it on the Saturday evening once the fact page is ready, to all 41 affected school owners at the same time and not to the big ones first; the message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do, and she knows from step 14 that each school owner's own 72 hours start when it is told; the record holds the message that went to the school owners and when it was sent (What to record), and had she not been reachable the draft sends it to Petter Dahl and then escalates to Ingrid Solheim.
Stops at: nowhere
Gets wrong: nothing
Result: PASS
