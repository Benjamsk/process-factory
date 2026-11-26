# Handle a personal data breach

## When this applies

Start this process on a confirmed personal data breach, and equally on a suspicion that personal data may have been exposed. An unexplained access in the Nordsky Cloud access logs, a bug report that one teacher could see another school's pupils, a lost laptop and a phishing click by an employee each start it. Nordsky Cloud is the cloud platform the reading app runs on, supplied by Nordsky AS; it holds the data of the reading app and the access logs of everyone who logs in to the app or to the platform itself. The process itself decides early whether the case is a real breach; a case that is not one is closed with a line in the record.

Every report, from inside or outside the company, ends up with head of IT Marius Tangen. The clock starts when the report reaches the company, not when someone gets round to reading it, and every time below counts from that moment unless the step names another one. All the times run around the clock, including evenings and weekends.

- Every employee must report a suspected security incident to Marius Tangen the same day.
- Nordsky AS must report a breach to Marius Tangen within 24 hours of becoming aware of it, by email and telephone. Hjelpedesk AS, which supplies the support desk, has 48 hours. Lønn Norge AS, which supplies the payroll system, must report to head of finance Tomas Berg within 24 hours. Anthropic, which supplies the AI support assistant, Rekrutt AS, which supplies the hiring system, and Microsoft, which supplies the office suite, must report without undue delay, with no fixed number of hours; Microsoft reports through the tenant administrator, who is Marius Tangen.
- When a teacher or a school owner writes to support, the support person who sees the case telephones Marius Tangen the same hour. Do not only tag the case.
- When an outsider, a researcher or a parent, writes to the general address or to managing director Ingrid Solheim, whoever receives it forwards it to Marius Tangen and telephones him.
- When Marius Tangen cannot be reached, the on-call developer takes the report and wakes him.

The process covers a personal data breach of all personal data in all the company's systems: the reading app and Nordsky Cloud, the support desk, the AI support assistant, the office suite, the payroll system and the hiring system. It is one process, not one per system.

See in the first minutes which of two situations the case is in, because the rest of the handling differs:

- Pupil data in the reading app: Fjordlys Læring AS is the data processor and each of the 310 school owners is the controller for its own pupils. The company tells the affected school owner; the school owner notifies Datatilsynet, the Norwegian data protection authority, and decides whether the parents are told. The data subjects are children between 6 and 13 years old.
- Teacher data, support desk data, employee data and applicant data: Fjordlys Læring AS is the controller itself and notifies Datatilsynet directly.

A breach that affects both kinds of data, as a breach in Nordsky Cloud would, is one case with one record and one timeline, with both duties running at the same time. Do not split it into two cases.

The process does not cover the notification of Datatilsynet and of the parents for a school owner's own pupils. That is left to the school owner.

## Who does what

- Head of IT: Marius Tangen. Lead developer Amina Farah steps in when he is away.
- Data protection officer: Kari Nordmann. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of Aas & Wold steps in on the other days and when she is away, on the firm's emergency number.
- Managing director: Ingrid Solheim. Head of finance Tomas Berg steps in when she is away.
- Lead developer: Amina Farah. Head of product Jonas Vikane steps in when she is away.
- On-call developer: Erik Moen in the week beginning 23 November 2026. Lise Berntsen is the stand-in for that week. The role is held each week by one of the eight developers of the two development teams, on the rota Amina Farah sets a month ahead and keeps in the staff handbook. Reach the on-call developer on the on-call telephone number in the staff handbook.
- Head of customer success: Silje Haugland, reachable Monday to Friday 08:00 to 16:00 only. Support lead Petter Dahl steps in when she is away.
- Support lead: Petter Dahl, reachable Monday to Friday 08:00 to 16:00 only. Silje Haugland steps in when he is away.
- Head of people: Nora Lind. Ingrid Solheim steps in when she is away.
- Head of product: Jonas Vikane. Amina Farah steps in when he is away.
- Head of finance: Tomas Berg. Ingrid Solheim steps in when he is away.

## Steps

1. Head of IT (Marius Tangen): take the report. You must have it within 1 hour of the moment the report reached the company. Outside working hours, when you cannot be reached, the on-call developer (Erik Moen) takes the report and wakes you.
2. Head of IT (Marius Tangen): secure the logs within 4 hours of the report. Export and copy the Nordsky Cloud access logs out of the normal retention. Delete nothing and do not fix the bug in production before the logs are secured.
3. Head of IT (Marius Tangen): stop the breach within 4 hours of the report. Close the access, revoke the token, lock the account. Outside working hours the on-call developer (Erik Moen) revokes access tokens and locks accounts in Nordsky Cloud. Take the reading app or a part of it offline only when there is no narrower way, because that stops teaching in 310 schools; you decide, lead developer Amina Farah decides when you are away, and head of product Jonas Vikane and head of customer success Silje Haugland are told the moment it happens.
4. Head of IT (Marius Tangen): write down the time of the report and who reported it. That is where the 72 hours start.
5. Head of IT (Marius Tangen): tell data protection officer Kari Nordmann and managing director Ingrid Solheim. They must have the case within 4 hours of the report. On a day that is not one of Kari Nordmann's three working days, or when she is away, telephone Henrik Aas of Aas & Wold on the firm's emergency number instead. The case does not wait for Tuesday.
6. Head of IT (Marius Tangen): decide whether this is a real breach. You may judge that it is not, but you may not close the case, even when it looks obvious to you.
7. Data protection officer (Kari Nordmann): when it is not a breach, decide that the case is closed. You must agree before it is closed. Write the line in the record yourself, with your name and your reason. Henrik Aas decides when you are away.
8. Head of IT (Marius Tangen): when you have confirmed a real breach, decide whether support is closed on the subject of the breach. Closing support on the subject of the breach is two things: the AI support assistant hands over to a human every support case that touches the breach, and the standing holding message goes into the support desk. Close support on the subject of the breach when pupils, teachers or school owners are affected, or when the breach is likely to become publicly known. When you are unsure, close it. A breach of employee or applicant data alone does not close it.
9. Head of people (Nora Lind): when the breach is of employee or applicant data alone, prepare what managers may say to staff who ask, as actual sentences and not as improvisation.
10. On-call developer (Erik Moen): outside working hours, when support is closed on the subject of the breach, switch the AI support assistant into hand-over for breach cases. You only switch on the standing configuration support lead Petter Dahl prepared in advance; do not build a new one.
11. On-call developer (Erik Moen): whenever support is closed on the subject of the breach, put the standing holding message, approved in advance by Ingrid Solheim and Kari Nordmann, into the support desk. Silje Haugland and Petter Dahl are telephoned at home at once in any case.
12. Support lead (Petter Dahl): in working hours, change the configuration of the AI support assistant yourself so that it hands over to a human every case that touches the breach. It hands over on the ordinary signs a teacher would use, words such as leak, hacked, data, privacy or Datatilsynet. It also hands over a complaining parent. Write down when you changed it. The AI support assistant is not switched off: it keeps answering ordinary support cases from the approved help articles, and it may say nothing about the breach itself, not even that there is one.
13. Managing director (Ingrid Solheim): decide the wording of the sentences support may use. The sentences must exist as actual sentences in the support desk within 4 hours of the report, not as a rule telling support to improvise. Support may say that the company knows about it, that it is being looked into, who is handling it and when the person will hear more, and nothing else: not how many pupils, not whether data was accessed, not whose fault it is and not that it is probably nothing. In working hours the real wording replaces the standing holding message.
14. Data protection officer (Kari Nordmann): check the wording Ingrid Solheim decided for the sentences support may use.
15. Support lead (Petter Dahl): collect every question support cannot answer and bring it to Kari Nordmann once a day.
16. Head of IT (Marius Tangen): establish the facts on one page, the fact page, within 24 hours of the report. You own the fact page and you sign it off, and Amina Farah does the work in the systems. When you are away, Amina Farah owns the fact page and Jonas Vikane signs it off. Outside working hours the on-call developer (Erik Moen) starts it with what is known in the first hours. The fact page holds:
    - what data and which categories, and how sensitive;
    - which pupils and how many, and which school owners they belong to;
    - the window from when to when the data was exposed;
    - whether anyone actually accessed it, which means what the Nordsky Cloud logs show; when the logs cannot tell, write that access cannot be ruled out, and treat the case as accessed;
    - the likely consequence for the children;
    - what has already been done to stop it;
    - for each kind of data, whether the company is the controller or the processor.

    Write what cannot be established as not established, and leave nothing blank. The fact page is not finished until Kari Nordmann says she has what she needs, and she may ask for anything more her advice requires.
17. Data protection officer (Kari Nordmann): keep one list of duties for the case, with the pupil data in the reading app, where the company is the processor, and the teacher data, support desk data, employee data and applicant data, where the company is the controller, on the same list. The deadline that binds the case is the earliest one on the list.
18. Managing director (Ingrid Solheim): decide what the message to the affected school owners says, after advice from Kari Nordmann, in time for Silje Haugland to send it within 24 hours of the report. The message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do.
19. Data protection officer (Kari Nordmann): write the part of the message to the affected school owners that describes the data, in time for Silje Haugland to send the message within 24 hours of the report.
20. Head of customer success (Silje Haugland): send the message to every affected school owner within 24 hours of the report, and before Datatilsynet is notified. It goes to all affected school owners at the same time, not to the big ones first. Each school owner then notifies Datatilsynet on its own 72 hours, which start when it is told, and decides whether the parents are told.
21. Managing director (Ingrid Solheim): where the company is the controller, decide whether Datatilsynet is notified, at the latest 48 hours after the report. The GDPR requires the controller to notify Datatilsynet within 72 hours of becoming aware of a personal data breach. Decide after advice from Kari Nordmann and after asking Marius Tangen what happened in the systems. Tomas Berg decides when you are away. The decision, its reason and the name of the person who took it go into the record whether the answer is yes or no.
22. Data protection officer (Kari Nordmann): when the answer is yes, write the notification from the fact page and send it through Datatilsynet's own reporting form within 72 hours of the report. Marius Tangen reads it first for whether the technical description is true. Ingrid Solheim approves it before it is sent, and nobody else needs to. When you are away, Henrik Aas writes and sends it, and Ingrid Solheim still approves. If the picture later changes, send a supplementary notification without asking again.
23. Managing director (Ingrid Solheim): where the company is the controller, decide whether the affected people are told, after advice from Kari Nordmann. The GDPR requires the controller to consider telling the people affected. You take this decision together with your decision on Datatilsynet, at the latest 48 hours after the report. Tomas Berg decides when you are away.
24. Data protection officer (Kari Nordmann): write the part of the message to the affected people that describes the data and what the person can do.
25. Head of customer success (Silje Haugland): tell the affected teachers and school contacts within 24 hours of Ingrid Solheim's decision.
26. Head of people (Nora Lind): tell the affected employees and job applicants within 24 hours of Ingrid Solheim's decision.
27. Head of IT (Marius Tangen): draw up the list of measures that stop the breach happening again. The list must exist before the case can be closed. You are answerable for it to Ingrid Solheim. Each measure gets one named person, usually Amina Farah for the reading app and Nordsky Cloud, Petter Dahl for support and the AI support assistant and Nora Lind for anything about employees, and a date, which you set within 2 weeks of the case being closed.
28. Managing director (Ingrid Solheim): close the case, after Kari Nordmann says the record is complete. Do not close it inside 72 hours of the report, even when everything is done. Six things must be in place:
    - the breach is stopped and Marius Tangen has said so in writing;
    - the fact page is final, including the parts that could not be established;
    - the decision on Datatilsynet is in the record with its reason and your name, and the notification is sent if the answer was yes;
    - every affected school owner has been told, and every affected teacher, employee or applicant the company decided to tell;
    - the list of measures exists with one named person per measure;
    - the secured logs are stored where Kari Nordmann can find them again.
29. Head of IT (Marius Tangen): close the measures. A measure that could let the same breach happen again is in place within 30 days, any other measure within 90 days.
30. Data protection officer (Kari Nordmann): check the list of measures at your six-monthly review of the record of processing activities and tell Ingrid Solheim what is overdue.
31. Support lead (Petter Dahl): review the standing configuration of the AI support assistant and the standing holding message every six months.

## Who must be told

Outside the company:

- Pupil data from the reading app, where the company is the processor: every affected school owner, within 24 hours of the report, with one message to all of them at the same time. Ingrid Solheim decides what it says after advice from Kari Nordmann, Kari Nordmann writes the part about the data, and head of customer success Silje Haugland sends it. The school owner then notifies Datatilsynet and decides about the parents.
- Teacher data, support desk data, employee data and applicant data, where the company is the controller: Datatilsynet, within 72 hours of the report, on Ingrid Solheim's decision taken at the latest 48 hours after the report, after advice from Kari Nordmann. Data protection officer Kari Nordmann writes the notification and sends it through Datatilsynet's reporting form after Marius Tangen has checked the technical description and Ingrid Solheim has approved it, and she sends a supplementary notification if the picture changes.
- The people affected, where the company is the controller: on Ingrid Solheim's decision after advice from Kari Nordmann, within 24 hours of that decision. Silje Haugland tells teachers and school contacts, head of people Nora Lind tells employees and job applicants, and Kari Nordmann writes the part describing the data and what the person can do.
- A case closed as not a breach is notified to nobody outside the company. It is closed with Kari Nordmann's line in the record.

Inside the company:

- Head of IT Marius Tangen, within 1 hour of the report, from whoever received it.
- Data protection officer Kari Nordmann and managing director Ingrid Solheim, within 4 hours.
- Head of product Jonas Vikane and head of customer success Silje Haugland, the moment the reading app or a part of it goes offline.
- Silje Haugland and support lead Petter Dahl, telephoned at home at once when support is closed on the subject of the breach.

## When to hand over

- Marius Tangen cannot be reached: the on-call developer (Erik Moen) takes the report and wakes him.
- Marius Tangen is away: lead developer Amina Farah owns the fact page and head of product Jonas Vikane signs it off, and Amina Farah decides on taking the reading app offline.
- Kari Nordmann is away, or the day is not one of her three working days: Henrik Aas of Aas & Wold on the firm's emergency number, for the advice, for the decision that a case is not a breach, and for writing and sending the notification. The case does not wait for Tuesday.
- Ingrid Solheim is away: head of finance Tomas Berg decides on Datatilsynet, on telling the school owners and the people affected, and on what the message says.
- Petter Dahl is away: Silje Haugland. Silje Haugland is away: Petter Dahl.
- Neither Silje Haugland nor Petter Dahl answers at home: escalate to managing director Ingrid Solheim.
- Marius Tangen is unsure whether to close support on the subject of the breach: close it.
- Marius Tangen judges that a case is not a breach: it goes to Kari Nordmann, who decides and must agree before it is closed. He may not close his own case.
- The record is not complete: do not close the case, and Kari Nordmann tells Ingrid Solheim when it is complete.
- A measure is overdue: Kari Nordmann tells Ingrid Solheim, and the measure goes on the agenda of the Monday leadership meeting until it is done.

## What to record

One breach is one document, written while it happens and not reconstructed a month later. Write a document for every reported case, including a case decided not to be a breach and a case that is not notified.

The record of a breach holds:

- When it was reported and by whom.
- The timeline with real timestamps.
- What data and whose, which categories and how many people.
- What was done to stop it.
- What the logs showed, and what could not be established, written as not established.
- For each kind of data, whether the company is the controller or the processor.
- Who was told and when.
- The decision on Datatilsynet with its reason and the name of the person who took it, whether the answer was yes or no, and when the answer was yes the notification sent, the time it was sent and the receipt from Datatilsynet.
- The message that went to the school owners, and the messages that went to teachers, employees or job applicants.
- The list of measures with one named person and one date for each, and what was changed afterwards so that it does not happen again.
- When the AI support assistant was switched into hand-over and the holding message put into the support desk, and by whom.

For a case closed as not a breach, the record holds Kari Nordmann's line with her name and her reason.

Data protection officer Kari Nordmann keeps the record with the record of processing activities, in the folder of the data protection officer in the office suite. It is kept for five years. The logs secured at the start of the case are stored where Kari Nordmann can find them again.

## If something does not fit

No one is named to turn to for a situation this document does not cover.
