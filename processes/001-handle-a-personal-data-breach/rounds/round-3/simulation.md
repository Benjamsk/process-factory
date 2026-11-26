# simulation review of draft-3.md

Verdict: CHANGES

- [high] Step 11: the standing holding message goes into the support desk only "outside working hours", and no step puts it there in working hours, although step 8 says that closing support on the subject of the breach is those two things and step 13 says that in working hours the real wording replaces the standing holding message. In working hours support therefore has nothing approved to say between the moment support is closed on the subject and the moment the real wording arrives up to 4 hours later. The draft must say what `spec.md` says: whenever support is closed on the subject of the breach the on-call developer puts the standing holding message, approved in advance by Ingrid Solheim and Kari Nordmann, into the support desk, and in working hours the real wording then replaces it within 4 hours of the report. (case 8)
- [low] Step 9: Nora Lind is to prepare what managers may say to staff who ask, but neither step 8 nor "Who must be told" says that she is told that the case exists, so the step waits on whoever happens to think of her. `spec.md` does not say who tells her either. (case 5)
- [low] "If something does not fit": the draft names no one to turn to for a situation it does not cover, so a person who meets one, such as the deadlines having run out before anyone noticed the report or an answer the AI support assistant has already sent, has nobody to ask. `spec.md` names no one either. (case 3, case 8)

## Case 1: Nordsky AS reports an open storage bucket

Would do: Takes the report at 09:10 within the hour, exports and copies the Nordsky Cloud access logs out of the normal retention before anything is deleted or fixed in production and confirms the storage is closed, writes down 09:10 and Nordsky AS as the reporter, tells Kari Nordmann and Ingrid Solheim within 4 hours, decides that this is a real breach, and closes support on the subject because pupils and school owners are affected, so Petter Dahl changes the configuration of the AI support assistant himself in working hours and Silje Haugland and Petter Dahl are told at once; Ingrid Solheim decides the wording of the sentences support may use and Kari Nordmann checks it, so that they are in the support desk by 13:10; he owns and signs off the fact page within 24 hours with Amina Farah doing the work in the systems and treats it as final only when Kari Nordmann says she has what she needs; Kari Nordmann keeps the one list of duties; Silje Haugland sends the same message to both school owners within 24 hours of 09:10 and before Datatilsynet; he draws up the list of measures, and Ingrid Solheim closes the case no earlier than 72 hours after 09:10.
Stops at: nowhere.
Gets wrong: Nothing the Pass asks for; the standing holding message does not go into the support desk, because step 11 puts it there only outside working hours.
Result: PASS

## Case 2: Head of IT on holiday when a bug exposes another school's pupils

Would do: Reads in "Who does what" that she steps in as head of IT while Marius Tangen is away, so she takes the report the support person telephones through at 11:00 and has it within the hour, secures a copy of the Nordsky Cloud access logs before the bug is fixed in production, closes the exposure within 4 hours and, if there is no narrower way, decides herself that a part of the reading app goes offline and tells Jonas Vikane and Silje Haugland the moment it happens; she writes down the time of the report and who reported it, tells Kari Nordmann, who works on a Wednesday, and Ingrid Solheim within 4 hours, decides that this is a real breach, and owns the fact page within 24 hours with Jonas Vikane signing it off, as step 16 and "When to hand over" both say; the data is pupil data of the reading app, where the company is the processor, so Ingrid Solheim decides what the message says, Kari Nordmann writes the part about the data and Silje Haugland sends it to every affected school owner within 24 hours of 11:00 and before Datatilsynet.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 3: A support case was reclassified as a normal bug five days ago

Would do: Reads in "When this applies" that the support person who sees such a case telephones Marius Tangen the same hour and does not only tag it, so he telephones him at once instead of leaving the case in the development queue, and reads there that the clock starts when the report reached the company at 08:30 on the Wednesday and not when he read it, so he gives Marius Tangen that time and the name of the teacher who wrote in; Marius Tangen has the case within the hour, secures the Nordsky Cloud access logs before the bug is fixed in production, stops the exposure, writes down 08:30 on the Wednesday as the time of the report and who reported it, and tells Kari Nordmann and Ingrid Solheim at once; Kari Nordmann keeps the one list of duties and the earliest deadline on it binds the case; he himself goes on to collect every question support cannot answer and brings it to her once a day.
Stops at: nowhere.
Gets wrong: Nothing the Pass asks for; the draft says nothing about what is done when the 4, 24 and 72 hours ran out before anyone noticed the report, and `spec.md` does not say either.
Result: PASS

## Case 4: Friday night report and the head of IT does not answer

Would do: Reads in "When this applies" and in step 1 that the on-call developer takes the report and wakes Marius Tangen when he cannot be reached, so he takes the report at 23:40, keeps telephoning until Marius Tangen is awake, and the record says who called him and when; he revokes the access token and locks the account in Nordsky Cloud as step 3 gives him, well inside the 4 hours, which run around the clock, and starts the fact page with what is known in the first hours as step 16 gives him; Marius Tangen, now awake, secures the Nordsky Cloud access logs, reaches Ingrid Solheim on her mobile and, because Friday is not one of Kari Nordmann's three working days, Henrik Aas on the firm's emergency number rather than waiting for Tuesday, and confirms the real breach and closes support on the subject because pupil data is affected; Erik Moen then switches the AI support assistant into the standing hand-over configuration Petter Dahl prepared, puts the standing holding message into the support desk, and telephones Silje Haugland and Petter Dahl at home, escalating to Ingrid Solheim if neither answers, and the record says that he did both and when.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 5: Payroll breach that a newspaper is already asking about

Would do: Takes the report Tomas Berg forwards at 08:00 within the hour, writes down the time of the report and who reported it, tells Kari Nordmann and Ingrid Solheim by 12:00, and decides that this is a real breach; on step 8 he reads both that support is closed when the breach is likely to become publicly known, which the journalist makes certain, and that a breach of employee data alone does not close it, and because he is unsure he closes it as step 8 and "When to hand over" tell him, so Petter Dahl changes the configuration of the AI support assistant in working hours and writes down when; he passes step 9 to Nora Lind, who writes the sentences managers may use before any manager answers a member of staff; the company is the controller here, so Ingrid Solheim decides on Datatilsynet by 08:00 on the Thursday after Kari Nordmann's advice and after asking him what happened in the systems, with the decision, its reason and her name in the record, and Kari Nordmann writes the notification and sends it through Datatilsynet's form within 72 hours of 08:00 on the Tuesday after he has checked the technical description and Ingrid Solheim has approved it; Nora Lind tells the employees within 24 hours of that decision with Kari Nordmann's part about the data, and no school owner is told.
Stops at: nowhere.
Gets wrong: Nothing the Pass asks for; the standing holding message does not go into the support desk, because step 11 puts it there only outside working hours, and no step of the draft tells Nora Lind that the case exists.
Result: PASS

## Case 6: The access logs have already rolled over

Would do: Secures the copy of the Nordsky Cloud access logs that is left before he closes the hole, writes down the time of the report and who reported it, tells Kari Nordmann and Ingrid Solheim within 4 hours, and owns and signs off the fact page within 24 hours of 10:00 on the Wednesday with Amina Farah doing the work in the systems; following step 16 he writes the four-month window, writes that access cannot be ruled out because the logs cannot tell and treats the case as accessed, and writes the pupils and the school owners the logs cannot identify as not established rather than leaving any field blank; he treats the page as final only after Kari Nordmann says she has what she needs, the secured logs are stored where she can find them again, and the record says what the logs showed and what could not be established.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 7: Documents about pupils in the office suite

Would do: Takes the case from Marius Tangen, the tenant administrator, who has it within an hour of 13:00 and tells her and Ingrid Solheim by 17:00; she reads in "When this applies" that the office suite is in scope and that such a case is one case with one record and one timeline, so she opens one record and keeps one list of duties with the pupil side and the controller side on the same list and the earliest deadline as the one that binds; she has the fact page state for each kind of data in the account whether the company is the controller or the processor and, for the exported spreadsheets about pupils that fit neither of the two situations the draft names, has it say that this is not established rather than leaving it blank; the teacher data is data the company is the controller for, so she advises Ingrid Solheim, whose decision on Datatilsynet is in the record with its reason and her name by 13:00 on the Saturday.
Stops at: nowhere.
Gets wrong: Nothing the Pass asks for; the draft does not say whether the company is the controller or the processor for exported spreadsheets about pupils in the office suite, and `spec.md` does not say either.
Result: PASS

## Case 8: The AI support assistant answers a teacher who asks about the leak

Would do: Reads step 12 and changes the configuration of the AI support assistant himself so that it hands over every case that touches the breach, on the words leak, hacked, data, privacy or Datatilsynet and on a complaining parent, writes down when he changed it, leaves the assistant answering ordinary cases from the approved help articles with nothing said about the breach, and puts the four cases it already answered into the hands of a human support person because every case that touches the breach goes to a human; he then waits for the sentences support may use, which Ingrid Solheim decides and Kari Nordmann checks and which are in the support desk by 13:00, and collects the questions support cannot answer and brings them to Kari Nordmann that day; between 09:30 and 13:00 he finds no standing holding message in the support desk to work from or to replace, because step 11 puts it there only outside working hours and no step of the draft puts it there in working hours.
Stops at: nowhere.
Gets wrong: Support has no approved wording in the support desk from 09:30 until the real sentences arrive at 13:00, so the sentences do not replace the standing holding message as step 13 says they do, and the human support people who take over the four cases and the ones that follow have nothing they may say.
Result: FAIL at step 11

## Case 9: Not a breach, on a Monday

Would do: Treats the phishing click as a reported case and opens a record for it on the Monday, resets the password, secures the Nordsky Cloud and office suite sign-in logs and writes down what they show, writes down the time of the report and who reported it, and judges that this is not a breach but reads in step 6 that he may not close the case even when it looks obvious to him and in "When to hand over" that he may not close his own case; because Monday is not one of Kari Nordmann's three working days he reaches Henrik Aas of Aas & Wold on the firm's emergency number, as step 5, step 7 and "When to hand over" tell him, rather than waiting for Tuesday; Henrik Aas decides that the case is not a breach and writes the line in the record himself with his name and his reason; nobody outside the company is notified, and the secured logs are stored where Kari Nordmann can find them again.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 10: A parent writes to the managing director

Would do: Reads in "When this applies" that whoever receives a report from an outsider forwards it to Marius Tangen and telephones him, so she both forwards the email and telephones him rather than only forwarding it, and that the clock starts at 16:20 when the email arrived and not at 16:25 when she read it; Marius Tangen has the case by 17:20, secures the Nordsky Cloud access logs before anything is deleted or fixed in production and closes the page by 20:20 the same evening, because all the times run around the clock, writes down 16:20 and the parent as the one who reported it, and tells Kari Nordmann, who works on a Thursday, and her within 4 hours; the data is pupil data of the reading app, so Silje Haugland sends the message Ingrid Solheim decides, with Kari Nordmann's part about the data, to every affected school owner by 16:20 on the Friday and before Datatilsynet, and she leaves it to the school owner to notify Datatilsynet and to decide whether the parents are told, as "When this applies" and step 18 say.
Stops at: nowhere.
Gets wrong: nothing.
Result: PASS

## Case 11: The 24 hours to the school owners run out at 03:00 on a Sunday

Would do: Reads in "When this applies" that all the times run around the clock, including evenings and weekends, and in step 18 that the message goes to every affected school owner within 24 hours of the report and before Datatilsynet and to all of them at the same time, not to the big ones first, so on the Saturday evening, having been telephoned at home when support was closed on the subject, she sends the one message Ingrid Solheim decided, with the part about the data Kari Nordmann wrote, to all 41 affected school owners at once, well before 03:00 on the Sunday; the message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do, and the message and the time it was sent go into the record.
Stops at: nowhere.
Gets wrong: Nothing the Pass asks for; the draft does not say who sends the message when the 24 hours run out outside the hours in which Silje Haugland and Petter Dahl are reachable, and `spec.md` does not say either.
Result: PASS
