# simulation review of draft-8.md

Verdict: CHANGES

- [high] Steps 8 and 9: the draft puts a time only on securing the logs and on closing the access, revoking the token and locking the account, so a breach that can only be stopped another way, by a fix in the code or by taking a part of the reading app offline, carries no deadline at all, and step 9 reads as licence to wait for a narrower fix however long it takes; the draft must say, as `spec.md` does under Deadlines, that the breach is stopped within 4 hours of the report, so that step 9 is read as taking the part offline where no narrower way stops the breach inside those 4 hours (case 2, case 12).

## Case 1: Nordsky AS reports an open storage bucket

Would do: He reads "When this applies", sees that a report from Nordsky AS comes to him as head of IT, takes the case by 10:10 (step 5), exports and copies the Nordsky Cloud access logs out of the 90-day retention before anything in production is changed (steps 6, 14), makes the case folder in the office suite and gives the right to open it to the five named people (step 7), closes the access on the storage (step 8), writes down 09:10 and Nordsky AS as the report (step 11), tells Kari Nordmann and Ingrid Solheim by 13:10 (step 12), says it is a real breach and that the company is the processor for the pupil data (step 15), answers yes under step 17, so support is closed on the subject and the sentences Ingrid Solheim decides and Kari Nordmann checks stand in the support desk by 13:10 (steps 18, 22, 23), owns and signs off the fact page within 24 hours with Amina Farah establishing the facts in the reading app and Nordsky Cloud (steps 26 to 31), while Kari Nordmann keeps the one list of duties (step 32), both school owners get their own message within 24 hours of 09:10 and before any notification to Datatilsynet (steps 33 to 36), he draws up the list of measures with one named person and one date each (step 49), and Ingrid Solheim closes the case no earlier than 72 hours after 09:10 (steps 51, 52).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 2: Head of IT on holiday when a bug exposes another school's pupils

Would do: The support person telephones under "When this applies" and step 4; the head of IT cannot be reached, and under "Who does what" and "When to hand over" Amina Farah steps in for him. She has the case by 12:00 (step 5), secures the Nordsky Cloud access logs before the bug is fixed in production (steps 6, 14), makes the case folder (step 7), tells Kari Nordmann and Ingrid Solheim by 15:00 (step 12), reads step 9 and weighs taking the part of the app that leaks offline against the narrow fix, owns the fact page which Jonas Vikane signs off within 24 hours (steps 26, 31), and every affected school owner gets its own message within 24 hours of 11:00 and before any notification to Datatilsynet (steps 33 to 36).
Stops at: nowhere.
Gets wrong: she leaves the exposure running past 15:00, because step 9 lets her take a part of the app offline only where there is no narrower way, the narrow fix is a narrower way, and no step of the draft tells her that the breach itself has to be stopped within 4 hours of the report.
Result: FAIL at step 9

## Case 3: A support case was reclassified as a normal bug five days ago

Would do: He reads under "When this applies" that the support person who sees such a case telephones the head of IT the same hour and does not reclassify it as a normal bug, so he telephones Marius Tangen at once (step 4), who has the case by 15:00 (step 5). He reads that the clock starts when the report reached the company, so 08:30 on the Wednesday before is the time of the report, and Marius Tangen writes that time and the teacher who reported it into the record (step 11) and the timeline with real timestamps ("What to record"). Marius Tangen secures the Nordsky Cloud access logs before the bug is fixed in production (steps 6, 14), tells Kari Nordmann and Ingrid Solheim (step 12), and Kari Nordmann keeps the one list of duties and sees which deadline binds the case (step 32).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 4: Friday night report and the head of IT does not answer

Would do: He takes the report because the head of IT cannot be reached and keeps ringing to wake him ("When this applies", step 4). Without waiting for a decision he revokes the access token and locks the account in Nordsky Cloud and then tells Marius Tangen what he did and when (step 8), secures the Nordsky Cloud access logs before anything in production is changed (step 6), starts the fact page with what is known in the first hours (step 26), switches on the standing configuration and puts in the standing holding message and writes down when (step 18), telephones Silje Haugland and Petter Dahl at home at once and Ingrid Solheim where neither answers (step 21), and may add a sign and tell the support lead (step 20). Marius Tangen, once woken, tells Ingrid Solheim and, because Friday is not one of Kari Nordmann's days, Henrik Aas on the firm's emergency number, by 03:40 (step 12, "Who must be told"), and the judgement whether it is a real breach stays his (step 15).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 5: Payroll breach that a newspaper is already asking about

Would do: He has the case within 1 hour of 08:00 after Tomas Berg forwards the report and telephones (steps 4, 5), secures the logs (step 6), writes down the time of the report and who reported it (step 11), tells Kari Nordmann and Ingrid Solheim by 12:00 and in the same step tells Nora Lind because the payroll system is touched (steps 12, 13). Under step 17 the journalist makes it likely that the breach becomes publicly known, and where he is unsure the answer is yes, so support is closed on the subject and the sentences stand in the support desk by 12:00 (steps 18, 22, 23), and the record says when the hand-over was switched on and by whom ("What to record"). Nora Lind prepares what managers may say (step 25). No school owner is told, because no pupil data of the reading app is affected (step 33). Ingrid Solheim decides on Datatilsynet at the latest 48 hours in, after advice from Kari Nordmann and after asking him what happened (step 37), Kari Nordmann writes and sends the notification within 72 hours (steps 39, 40), and the employees are told within 24 hours of the decision (steps 43 to 47).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 6: The access logs have already rolled over

Would do: He secures what is left of the Nordsky Cloud access logs and keeps it in the case folder where Kari Nordmann can find it (steps 6, 7), and owns and signs off the fact page within 24 hours with Amina Farah doing the work in the systems (steps 26, 27, 31). On the page he writes the four-month window, and because the logs cannot tell whether anyone fetched a recording he writes that it cannot be ruled out and treats it as accessed (step 28), and he writes the pupils and the school owners the logs cannot identify as not established and why, leaving no field blank (step 29). The page is not finished until Kari Nordmann says she has what she needs (step 31). Because the case is treated as accessed, the affected school owners are told within 24 hours and before any notification to Datatilsynet (steps 33 to 36).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 7: Documents about pupils in the office suite

Would do: She has the case from Marius Tangen by 17:00 (step 12), and reads under "When this applies" that a breach touching both pupil data and data the company controls is handled as one case with one record and one timeline. She keeps one list of the duties of the case with both sides on it and the earliest deadline binding (step 32), advises on the fact page, which says for each kind of data in the account whether the company is the controller or the processor and writes what cannot be established as not established (steps 28, 29), and because the teacher data is data the company controls, Ingrid Solheim decides on Datatilsynet at the latest 48 hours after 13:00, after advice from her and after asking Marius Tangen (step 37). For the exported spreadsheets about pupils the draft gives no rule saying which the company is, and that stands on the page as not established.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 8: The AI support assistant answers a teacher who asks about the leak

Would do: He switches the AI support assistant into the standing hand-over configuration and puts in the standing holding message (step 18), and the configuration hands over every case that carries one of the signs of step 19, which hold leak, hacked, data, privacy, GDPR and Datatilsynet in Norwegian and in English, every case from a parent and every case naming the system the breach is in, so the four answered cases carry signs, go to a human and are answered by nobody else, while the assistant keeps answering ordinary cases and says nothing about the breach. The record says when he changed the configuration and that he did it ("What to record"). He may add a word or a sign and write down what and when, and may take nothing off (step 20). He decides what happens about the four answers already sent and asks Kari Nordmann because they touch personal data (step 58). The sentences support may use stand in the support desk by 13:00, decided by Ingrid Solheim and checked by Kari Nordmann, and replace the standing holding message (steps 22, 23), and he brings the questions support cannot answer to Kari Nordmann that day (step 24).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 9: Not a breach, on a Monday

Would do: He treats the phishing click as a start of the process ("When this applies"), secures the sign-in logs and keeps the copy in the case folder where Kari Nordmann can find it (steps 6, 7), writes down the time of the report and who reported it (step 11), and gives his technical judgement that it is not a real personal data breach (step 15). Step 16 tells him he may not close the case even where it looks obvious to him, and that the data protection officer decides and writes the line in the record herself, with Henrik Aas deciding when she is away; because Monday is not one of Kari Nordmann's three days he reaches Henrik Aas on the firm's emergency number ("Who does what", "When to hand over", "If something does not fit") rather than waiting for the Tuesday. A record of its own is written on the Monday and holds the decision with its reason, the name and the time ("What to record"), and nobody outside the company is notified.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 10: A parent writes to the managing director

Would do: She reads under "When this applies" and step 4 that where an outsider or a parent writes to her, whoever receives it forwards it to the head of IT and telephones him, so she both forwards the email and telephones Marius Tangen. He has the case by 17:20 (step 5), secures the Nordsky Cloud access logs before anything in production is changed and closes the open access by 20:20, all the times running around the clock (steps 6, 8, "When this applies"), writes 16:20 and the parent into the record (step 11) and tells Kari Nordmann, or Henrik Aas where she is away, and Ingrid Solheim by 20:20 (step 12, "Who must be told"). The data is pupil data of the reading app, so every affected school owner is told by 16:20 on the Friday and before any notification to Datatilsynet (steps 33 to 36), and the decision whether the parents are told is left to the school owner (steps 42, 48, "When this applies").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 11: The 24 hours to the school owners run out at 03:00 on a Sunday

Would do: She was telephoned at home by the on-call developer when support was closed on the subject (step 21), and reads that every time in the process runs around the clock, including every evening and every weekend ("When this applies"). She is asked how the school owners are reached before Ingrid Solheim decides what the message says (step 33), and then sends one message per affected school owner, addressed to that school owner alone, to all 41 at the same time, within 24 hours of 03:00 on the Saturday, so by 03:00 on the Sunday and before any notification to Datatilsynet, with no school contact seeing the address of another and no telephone call to the big ones first (steps 34, 36). The message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do, with the part about the data written by Kari Nordmann (steps 33, 35). The record holds the message and the time it was sent ("What to record").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 12: The only way to stop it is to take the reading app offline

Would do: He exports and copies the Nordsky Cloud access logs out of the 90-day retention before anything is changed in production (steps 6, 14), writes 10:15 and the developer into the record (step 11), tells Kari Nordmann and Ingrid Solheim by 14:15 (step 12), answers yes under step 17 so support is closed on the subject, Petter Dahl switches the assistant into hand-over and puts in the holding message and writes down when, and the sentences stand in the support desk by 14:15 (steps 18, 22, 23). He reads step 9 and weighs taking the part of the app that serves the recordings offline against the narrow fix Amina Farah says needs another day. He owns and signs off the fact page within 24 hours (steps 26, 31) and the affected school owners are told within 24 hours of 10:15 (steps 33 to 36). When he does take the part offline he tells Jonas Vikane and Silje Haugland the moment it happens (step 10).
Stops at: nowhere.
Gets wrong: step 9 tells him to take a part of the app offline only where there is no narrower way to stop the breach, the narrow fix is a narrower way, and no step of the draft says the breach has to be stopped within 4 hours of the report, so he lets the exposure run until the fix is ready the next day rather than stopping it by 14:15.
Result: FAIL at step 9

## Case 13: Rekrutt AS reports to the head of people

Would do: She reads under "When this applies" that every report ends up with the head of IT, and under step 4 that whoever receives it forwards it to him and telephones him the same hour, so she does both rather than only forwarding. Marius Tangen has the case by 16:30 (step 5), writes 15:30 and Rekrutt AS into the record (step 11), and tells Kari Nordmann, Ingrid Solheim and, in the same step because the hiring system is touched, Nora Lind by 19:30 (steps 12, 13). Under step 17 no pupil, teacher or school owner is affected and the breach is not likely to become publicly known, so support is not closed on the subject and no holding message goes into the support desk. She prepares what managers may say to staff (step 25). Ingrid Solheim decides on Datatilsynet by 15:30 on the Wednesday (step 37), and where the applicants are told she tells them within 24 hours of that decision with the part about the data written by Kari Nordmann (steps 43 to 47).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 14: Absence and sick leave on the fact page

Would do: She has the case from Marius Tangen by 11:50, with Nora Lind told in the same step because the payroll system is touched (steps 12, 13). Advising on the fact page she applies step 30: absence and sick leave are named only as the categories absence and sick leave, with the number of employees affected and nothing about any individual's health, diagnosis or reason for absence, on the ground of Article 9(2)(b) with Article 6(1)(c), and where more than the category is needed she decides what is written, so the free-text reasons from the export are kept out. The page says for each kind of data that the company is the controller and writes what cannot be established as not established with no blank field (steps 28, 29). Support is not closed on the subject, because only employees are affected (step 17). Ingrid Solheim decides on Datatilsynet by 07:50 on the Friday (step 37), and she writes the notification from the fact page, Marius Tangen reads it for technical truth, Ingrid Solheim approves it and she sends it through Datatilsynet's own form within 72 hours (steps 39, 40), with the sent notification, the time and the receipt in the record ("What to record").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 15: The logs say something else after the notification was sent

Would do: She reads step 41 and sends a supplementary notification to Datatilsynet after 09:00 on the Thursday without asking Ingrid Solheim again, and the record holds it, the time it was sent and the receipt beside the first one ("What to record"). The fact page is corrected to the three-day window and 6,000 teachers, with what still cannot be established written as not established and counting as a high risk (steps 28, 29). Because the page now shows a high risk for the teachers, Ingrid Solheim decides, after her advice, only the wording and the way they are reached (step 43), Silje Haugland tells them (step 44) with the part about the data and what the person can do written and checked by her (step 45), within 24 hours of the decision and at the latest 72 hours after the page shows the high risk (step 47), and the decision stands in the record with its reason, the name and the time ("What to record"). The case is not closed until she says the record is complete and not inside 72 hours of the report (steps 51, 52).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 16: The managing director is away when the 48 hours run out

Would do: He reads under "Who does what" and "When to hand over" that he takes the managing director's decisions while she is away. He takes the decision whether Datatilsynet is notified by 09:00 on the Wednesday, after advice from Kari Nordmann and after asking Marius Tangen what happened in the systems (step 37), knowing that Datatilsynet is notified in every case and that where the fact page cannot establish the risk the breach is notified (step 38), and the decision goes into the record with its reason, his name and the time ("What to record"). Kari Nordmann writes the notification from the fact page, Marius Tangen reads it first for whether the technical description is true, and it is sent through Datatilsynet's own form by 09:00 on the Thursday (steps 39, 40). He also decides whether the teachers are told, and Silje Haugland sends the message within 24 hours of that decision (steps 43, 44, 47).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 17: Hjelpedesk AS reports 46 hours after it became aware

Would do: She reads step 4 and both forwards the email to Marius Tangen and telephones him the same hour; he has the case by 12:00 (step 5), writes 11:00 and Hjelpedesk AS into the record (step 11) and tells Kari Nordmann and Ingrid Solheim by 15:00 (step 12), with Nora Lind not told because no employee or applicant data is touched (step 13). Teachers and school contacts are affected, so step 17 is yes, Petter Dahl switches the assistant into hand-over and puts in the holding message and writes down when, the assistant keeps answering ordinary cases and says nothing about the breach, and the sentences stand in the support desk by 15:00 and replace the holding message (steps 18, 19, 22, 23). The fact page within 24 hours says the company is the controller for the support desk data (steps 28, 31). Ingrid Solheim decides on Datatilsynet by 11:00 on the Saturday and the notification goes by 11:00 on the Sunday (steps 37, 40). She establishes the facts about the support desk (step 27) and tells the affected teachers and school contacts where the page shows a high risk (steps 43 to 47). No school owner is told, because no pupil data of the reading app is affected (step 33).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 18: A measure is still open at the six-monthly review

Would do: She reads step 54 and, at her six-monthly review of the record of processing activities, goes through the list of measures and tells Ingrid Solheim what is overdue, naming the check, Amina Farah as the person it belongs to and 15 October 2026 as its date, and the measure goes on the agenda of the Monday leadership meeting until it is done. She reads step 49, that a measure which could let the same breach happen again is in place within 30 days of the case being closed, and step 53, that Marius Tangen writes down the dates and closes the measures, so she neither takes the measure over nor sets a new date for it; the measure stays Amina Farah's and Marius Tangen stays answerable for the list to Ingrid Solheim. The record of the case, which she keeps for 5 years, holds the list with one named person and one date for each and when each was done ("What to record").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 19: The secured logs fall due for deletion while Datatilsynet is still asking

Would do: He reads step 56: he deletes the secured copies 12 months after the day the case was closed, but keeps them longer while a case about the breach with Datatilsynet, with a school owner or before a court is still open, and then until that case ends, and writes in the record why they were kept longer. Because the matter with Datatilsynet and the open question from the school owner are both still running, he does not delete the copies on 10 December 2026, writes the reason into the record, and deletes them once both have ended. The record says where the copies are kept, that they hold personal data and why they were kept longer ("What to record"), and Kari Nordmann keeps the record of the case in the folder of the data protection officer in the office suite for 5 years.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 20: Nobody will say when the recordings work again

Would do: She reads step 57, that anything about the systems, including how long the reading app stays offline and when it goes back, is decided by Marius Tangen and by Amina Farah when he is away, so she puts the question to him and gives no time of her own. Support answers within the sentences Ingrid Solheim decided and Kari Nordmann checked, which say that the company knows about it, that it is looking into it, who is handling it and when the person will hear more, and nothing about how many pupils are affected, whether data was accessed or whose fault it is (step 22). The moment the part of the app goes back Marius Tangen tells Jonas Vikane and her at once (step 57, "Who must be told"), and the record holds whether a part went offline and when it went back, and the question she asked with the answer she was given ("What to record", "If something does not fit").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 21: The one person free to read the secured logs may not open the folder

Would do: He reads step 7: only he, Amina Farah, Kari Nordmann, Henrik Aas while he stands in and Ingrid Solheim may open the folder, the copy is never sent by email, never printed and never put on a private device, a private account or a memory stick, and nobody else is given access without the agreement of the data protection officer. So he does not simply hand Erik Moen the folder and does not email, print or copy the logs out to him, and because Saturday is not one of Kari Nordmann's days he takes the question of access to Henrik Aas on the firm's emergency number ("Who does what", "If something does not fit"). The record says that he set the access rights and holds the agreement where anyone else was given access ("What to record"). The fact page Erik Moen started is finished within 24 hours of 01:20, is not finished until the data protection officer says she has what she needs, and what the logs cannot establish is written as not established with no blank field (steps 26, 29, 31).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 22: An answer has already gone out and the support lead is on holiday

Would do: She steps in for Petter Dahl under "Who does what" and "When to hand over", switched the assistant into hand-over and put in the standing holding message at 09:20, and the record says when and that she did it (step 18, "What to record"). She reads step 58, that anything about an answer the assistant has already sent is decided by the support lead and by her when he is away, and because the answer of 08:40 names a pupil it touches personal data, so she asks Kari Nordmann, who works that Wednesday. The teacher's case goes to a human (step 19), from 09:20 the assistant answers nothing in a handed-over case and says nothing about the breach while it keeps answering ordinary cases (step 19), and the sentences stand in the support desk by 12:00, decided by Ingrid Solheim and checked by Kari Nordmann, replacing the holding message (steps 22, 23). Nothing is taken off the list of signs while the case runs, and every sign added stands in the record with who added it and when (step 20, "What to record").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 23: The sign that hands over nearly everything

Would do: He reads step 20: he may add a word or a sign while the case runs and must write down what he added and when, and he may take nothing off the list while the case runs. So data stays on the list for as long as the case runs, however many ordinary cases it catches, and he tells the two support people no. The assistant answers nothing in a handed-over case and says nothing about the breach, and keeps answering the cases that carry no sign (step 19). The 180 cases go to human support people, who answer within the sentences Ingrid Solheim decided and Kari Nordmann checked (step 22), and he collects every question support cannot answer and brings it to Kari Nordmann once a day (step 24), Tuesday being one of her three days.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 24: Aas & Wold reports a breach of its own

Would do: He reads under "When this applies" that a processor reporting a breach of the service it supplies starts the process and that Aas & Wold is one of them, so the clock starts at 09:00 on the Tuesday. He has the case by 10:00 (step 5), writes the time of the report and Aas & Wold into the record (step 11) and tells Kari Nordmann and Ingrid Solheim by 13:00 (step 12). He says for each kind of data whether the company is the controller or the processor (step 15), and the case is handled as one case with one record and one timeline, with Kari Nordmann keeping one list of duties holding the pupil side and the teacher side and the earliest deadline binding ("When this applies", step 32). The fact page is finished within 24 hours of 09:00 and writes what the firm's own system cannot show as not established (steps 28, 29, 31). Both affected school owners get their own message by 09:00 on the Wednesday, at the same time and before any notification to Datatilsynet (steps 33 to 36), and for the teacher data Ingrid Solheim decides on Datatilsynet by 09:00 on the Thursday (step 37). The duty of Aas & Wold to delete or return the case data when a stand-in ends stands in step 55 and in "What to record".
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 25: The facts about the hiring system while the head of people is off sick

Would do: She reads step 27, that the head of people establishes the facts about the hiring system within 12 hours of being asked and that where that person is away the one named under "Who does what" as stepping in for her does it, which is her, so Marius Tangen has the facts by 22:00 on the Monday. She also takes the rest of the head of people's part: she prepares what managers may say to staff as actual sentences (step 25) and tells the affected applicants where the fact page shows a high risk (step 44), each one separately, with the date it was sent and no personal data of any other applicant (step 46), within 24 hours of her decision and with the part about the data written by Kari Nordmann (steps 45, 47). As managing director she decides on Datatilsynet by 09:00 on the Wednesday after advice from Kari Nordmann and after asking Marius Tangen (step 37) and decides the wording and the way the applicants are reached (step 43). Marius Tangen owns and signs off the fact page by 09:00 on the Tuesday, says the company is the controller for the applicant data and writes what cannot be established as not established (steps 26, 28, 29, 31). Support is not closed on the subject, because only applicants are affected (step 17).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 26: The 48 hours and the 72 hours both fall on days the data protection officer does not work

Would do: Henrik Aas stands in on the firm's emergency number from the Friday, because every time in the process runs around the clock and neither deadline waits for the Tuesday ("When this applies", "Who does what", "When to hand over"). He advises Ingrid Solheim, who decides whether Datatilsynet is notified by 10:00 on the Sunday after asking Marius Tangen what happened in the systems, with Tomas Berg deciding where she is away (step 37), knowing that Datatilsynet is notified in every case and that where the fact page cannot establish the risk the breach is notified (step 38). Where the answer is yes he writes the notification from the fact page, Marius Tangen reads it first for technical truth, Ingrid Solheim still approves it and he sends it through Datatilsynet's own form by 10:00 on the Monday, with what is still unestablished said in it (steps 39, 40). The decision, the sent notification, the time and the receipt go into the record ("What to record"). Where the teachers are told, the message names him with his contact details in place of Kari Nordmann and carries the part about the data that he writes, and Silje Haugland sends it (steps 44, 45). When the stand-in on the case ends, Aas & Wold deletes or returns the case data (step 55).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 27: A school owner asks the company to notify Datatilsynet for it

Would do: She reads under "When this applies" that the process does not cover the notification to Datatilsynet about the pupils of a school owner, because the school owner is the controller and notifies Datatilsynet itself, nor the decision whether the parents are told, which the school owner decides, and step 42 says the same. The draft does not say whether the company may do either in the school owner's place, so this is a question the process does not answer: step 59 and "If something does not fit" bring it to her on the three days she works, Thursday being one of them, and on to Ingrid Solheim where she cannot answer it. The question and the answer go into the record (step 60, "What to record"). Meanwhile the duties run on: the school owners were told before any notification to Datatilsynet, the company's own notification covers only the data it is the controller for, and the deadlines on her one list of duties keep running (steps 32, 36, 37).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 28: The six months run out while the support lead is on leave

Would do: She reads step 3, that the standing configuration and the standing holding message are reviewed every six months, and under "Who does what" that she steps in for the support lead while he is away, so the review falls to her on 20 November 2026 rather than waiting for February 2027. She goes through the standing configuration and sees that it still hands every case carrying a sign of the breach over to a human, on the words of step 19 in Norwegian and in English together with a case from a parent and a case that names the system the breach is in, and through the standing holding message, which step 2 requires to be approved in advance by Ingrid Solheim and Kari Nordmann, so where the review changes it she has the changed message approved by them before it goes in. Both stay ready to switch on, so that nothing has to be written while a breach runs (steps 1, 2).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 29: A step the on-call developer cannot take in Nordsky Cloud

Would do: He takes the report on the on-call telephone at 22:10, the times running around the clock ("When this applies", step 4). Without waiting for a decision he does every one of closing the access, revoking the token and locking the account that the role can do in Nordsky Cloud, so he revokes the employee's token and locks his Nordsky Cloud account, and tells Marius Tangen what was done and when; the office suite account is not something the role can do in Nordsky Cloud, so Marius Tangen decides it, reached on his mobile, within 4 hours of the report (step 8, "When to hand over"). He secures the logs before anything in production is changed (step 6) and starts the fact page with what is known in the first hours for Marius Tangen or Amina Farah to take over (step 26). Marius Tangen tells Ingrid Solheim and, Saturday not being one of Kari Nordmann's days, Henrik Aas on the firm's emergency number by 02:10, and in the same step Nora Lind, because employee data in the office suite is touched (steps 12, 13, "Who must be told"). Whether it is a real breach stays Marius Tangen's judgement, and he may not close the case (steps 15, 16).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 30: The biggest school owner wants something in writing now

Would do: She reads step 14, that nobody emails the school owners before the data protection officer has looked at the case, and steps 33 and 34, that Ingrid Solheim decides what the message says after advice from Kari Nordmann, who writes the part about the data, that she herself is asked how the school owners are reached before that decision, and that the messages go one per affected school owner, addressed to that school owner alone, all at the same time, with no school owner told before another and no telephone call to the big ones first. So she writes that school owner no account of its own at 11:30 and gives it only what support may say under step 22. Kari Nordmann and Ingrid Solheim have the case by 14:00 (step 12), and all eleven messages go together by 10:00 on the Wednesday and before any notification to Datatilsynet (steps 34, 36), with the message and the time it was sent in the record ("What to record").
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 31: Nobody can say in writing that the breach is stopped

Would do: She reads step 51: she closes the case after Kari Nordmann says the record is complete, and six things must be in place first, the first of them that the breach is actually stopped and Marius Tangen has said so in writing. That statement does not exist, so she does not close the case on the Thursday, and step 52 would in any event stop her closing it inside 72 hours of 08:00 on the Monday. What cannot be established stands on the fact page as not established and why, and counts as a high risk until it is established (step 29). Where she is unsure what to do while only Lonn Norge AS can see the system, step 59 and "If something does not fit" take the question to Kari Nordmann and the answer goes into the record. Once the statement comes and the case is closed, Marius Tangen writes down the dates on the measures within 2 weeks and leaves none open, and closes the measures (step 53).
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS
