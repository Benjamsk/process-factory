# Handle a personal data breach

## When this applies

Use this document when personal data may have been exposed in any of the company's systems: the reading app, Nordsky Cloud, the support desk, the AI support assistant, the payroll system, the hiring system or the office suite. One process for all of them. A breach of the payroll system includes the absence and sick leave of the 48 employees.

Start on a confirmed breach, and on a suspicion that personal data may have been exposed. A suspicion is enough: an unexplained access in the Nordsky Cloud access logs, a bug report that one teacher could see another school's pupils, a lost laptop, a phishing click by an employee. Run the process ten times too often rather than once too late. The process decides early whether it is a real breach, and a report that is not one is closed with a line in the record and goes no further.

Every report, from inside or outside the company, goes to head of IT Marius Tangen. The clock starts when the report reached the company, not when someone got round to reading it. That is also the moment the company became aware, so the 24 hours to the school owners and the 72 hours to Datatilsynet run from it too. All the times in this document run around the clock, including evenings, weekends and public holidays. Working hours here are Monday to Friday 08:00 to 16:00; every other hour is outside working hours.

How a report reaches the head of IT:

- An employee who suspects a security incident reports it to the head of IT the same day, as the information security policy requires.
- Nordsky AS, which supplies Nordsky Cloud, reports to the head of IT within 24 hours of becoming aware, by email and telephone. Hjelpedesk AS, which supplies the support desk, reports within 48 hours; Lønn Norge AS, which supplies the payroll system, reports to head of finance Tomas Berg within 24 hours; and Aas & Wold, the law firm that stands in for the data protection officer, reports within 24 hours. Anthropic, which supplies the AI support assistant, Rekrutt AS, which supplies the hiring system, and Microsoft, which supplies the office suite, report without undue delay with no fixed number of hours, Microsoft through the tenant administrator, who is Marius Tangen. If you receive such a report, forward it to Marius Tangen and telephone him.
- When a teacher or a school owner writes to support, the support person who sees the case telephones Marius Tangen the same hour. Do not only tag the case.
- When an outsider, a researcher or a parent, writes to the company's general address or to managing director Ingrid Solheim, whoever receives it forwards it to Marius Tangen and telephones him.
- When Marius Tangen cannot be reached, the on-call developer takes the report and wakes him. Outside working hours every alert and every report reaches the on-call developer first.

See in the first minutes which of the two situations applies, because the rest of the process differs:

- Pupil data in the reading app. The company is the data processor and each of the 310 school owners is the controller for its own pupils. The company tells the affected school owner, and the school owner notifies Datatilsynet. The pupils are children between 6 and 13 years old.
- Teacher data, support desk data, employee data and applicant data. The company is the controller itself, notifies Datatilsynet itself and decides itself whether the people affected are told.

A breach that touches both, as a breach in Nordsky Cloud would, is one case, one record and one timeline, with both duties running at the same time. Never split it into two cases. Data protection officer Kari Nordmann keeps one list of the duties of the case, and the deadline that binds the case is the earliest one on that list.

This document does not cover the school owner's own decisions: for its own pupils, the school owner, not Fjordlys Læring AS, decides whether Datatilsynet and the parents are told.

## Who does what

- Head of IT: Marius Tangen. Lead developer Amina Farah steps in when he is away. He is reachable on his mobile around the clock.
- Lead developer: Amina Farah. Head of product Jonas Vikane steps in when she is away.
- Data protection officer: Kari Nordmann. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of Aas & Wold steps in when she is away, and is reached on the emergency number of the firm on the other days and at weekends.
- Managing director: Ingrid Solheim. Head of finance Tomas Berg steps in when she is away. She is reachable on her mobile around the clock.
- Head of customer success: Silje Haugland. Support lead Petter Dahl steps in when she is away. She is reachable in working hours only.
- Support lead: Petter Dahl. Head of customer success Silje Haugland steps in when he is away. He is reachable in working hours only.
- Head of people: Nora Lind. Managing director Ingrid Solheim steps in when she is away.
- Head of product: Jonas Vikane. Lead developer Amina Farah steps in when he is away.
- Head of finance: Tomas Berg. Managing director Ingrid Solheim steps in when he is away.
- On-call developer: Erik Moen holds the week beginning 23 November 2026, and Lise Berntsen is the stand-in for that week. The role is reachable around the clock on the on-call telephone number in the staff handbook.

## Steps

1. Support lead (Petter Dahl): before any breach, keep ready the standing configuration that makes the AI support assistant hand over breach cases, and the standing holding message for the support desk. Ingrid Solheim and Kari Nordmann approve both in advance. Review both every six months. They exist so that nobody has to write them at midnight.
2. Head of IT (Marius Tangen): take the case within 1 hour of the report. Whoever receives the report forwards it to you and telephones you; outside working hours it reaches the on-call developer (Erik Moen), who takes it and wakes you.
3. Head of IT (Marius Tangen): secure the logs within 4 hours of the report. Export and copy the Nordsky Cloud access logs out of the normal 90-day retention, because they roll over after 90 days and evidence has been lost that way before. Delete nothing and fix no bug in production before the logs are secured.
4. Head of IT (Marius Tangen): stop the breach within 4 hours of the report. Close the access, revoke the token, lock the account.
5. Head of IT (Marius Tangen): take the reading app or a part of it offline only when there is no narrower way to stop the breach, because that stops teaching in 310 schools. Amina Farah decides when you are away.
6. Head of IT (Marius Tangen): the moment the app or a part of it goes offline, tell head of product Jonas Vikane and head of customer success Silje Haugland.
7. Head of IT (Marius Tangen): write in the record of the case the time of the report and who reported it. That is where the 72 hours start, and nobody remembers it afterwards.
8. Head of IT (Marius Tangen): tell data protection officer Kari Nordmann and managing director Ingrid Solheim within 4 hours of the report. On the days Kari Nordmann does not work and at weekends, reach Henrik Aas of Aas & Wold on the emergency number of the firm. At the same time, tell head of people Nora Lind whenever the breach touches the payroll system, the hiring system or employee or applicant data in the office suite, so that she starts her part without waiting. No message goes to a school owner before Kari Nordmann has looked at the case.
9. Head of IT (Marius Tangen): give your technical judgement on whether this is a real personal data breach. You may not close a case, even when it looks obvious to you. Data protection officer (Kari Nordmann) decides that a reported case is not a personal data breach and is the only one who may close it: she writes the line in the record herself, with her name, the reason and the time, so that there is a name on it if Datatilsynet ever asks. Henrik Aas of Aas & Wold decides when she is away.
10. Head of IT (Marius Tangen): when you confirm a real breach, decide whether support is closed on the subject of the breach. Closing support on the subject means that the AI support assistant hands every case that touches the breach to a human and the standing holding message goes into the support desk; support does not stop answering, and the assistant keeps answering ordinary cases. Close it when pupils, teachers or school owners are affected, or when the breach is likely to become publicly known. When you are unsure, close it: an unnecessary holding message costs far less than a support person improvising. Do not close it for a breach that affects only employees or job applicants, such as a breach of the payroll system or the hiring system, because a holding message would tell 6,000 teachers about something that has nothing to do with them.
11. Support lead (Petter Dahl): when support is closed on the subject, switch the AI support assistant into hand-over for breach cases and put the standing holding message into the support desk. Silje Haugland does it when you are away. Outside working hours the on-call developer (Erik Moen) does both, using the standing configuration and the standing holding message. Whoever switches it on writes down when they did it.
12. AI: the AI support assistant keeps answering ordinary support cases on its own, and support lead Petter Dahl answers for the result. It hands over to a human every case that touches the breach, among them every case that uses words such as leak, hacked, data, privacy or Datatilsynet and every case from a complaining parent. It says nothing about the breach itself, not even that one is happening. It sends only answers that come from an approved help article, and a human decides any case that concerns a complaint, a contract or personal data, as the AI use policy requires.
13. On-call developer (Erik Moen): when the breach is confirmed outside working hours, telephone Silje Haugland and Petter Dahl at home at once. If neither answers, telephone Ingrid Solheim and tell her that support has nobody.
14. Head of IT (Marius Tangen): own the fact page and sign it off, and see that Kari Nordmann has it within 24 hours of the report. Lead developer Amina Farah does the work in the systems that fills it: the Nordsky Cloud access logs, which pupils and which school owners are affected, and the time window. When you are away, Amina Farah owns it and Jonas Vikane signs it off. Outside working hours the on-call developer (Erik Moen) starts it with what is known in the first hours, and you or Amina Farah take it over. It is one page and not a thread, and it is not finished until Kari Nordmann says she has what she needs for her advice.
15. Head of IT (Marius Tangen): put all of this on the fact page:
    - for each kind of data affected, whether the company is the processor or the controller;
    - what data and which categories, and how sensitive, since a read-aloud recording of a child's voice is worse than a reading level;
    - which people and how many, and which school owners they belong to;
    - the window from when to when the data was exposed;
    - whether anyone actually accessed it, which means what the Nordsky Cloud access logs show; where the logs cannot tell, write that it cannot be ruled out, and treat it as accessed;
    - the likely consequence for every kind of person affected: pupils, teachers, school contacts, employees and job applicants;
    - what has already been done to stop it.

    Write what cannot be established as not established, with why, and never leave it blank. A consequence that is not established counts as a high risk until it is established. Name the absence and sick leave of employees only as the categories "absence" and "sick leave", with the number of employees affected and nothing about any individual's health, diagnosis or reason for absence. Where more than the category is needed, Kari Nordmann decides what is written.
16. Managing director (Ingrid Solheim): decide the sentences support may use, and Kari Nordmann checks them. Decide them in time for them to stand in the support desk as actual sentences within 4 hours of the report, not as a rule telling support to improvise. They may say that the company knows about it, that it is looking into it, who is handling it and when the person will hear more, and nothing else. They may not say how many are affected, whether data was accessed, whose fault it is, or that it is probably nothing.
17. Support lead (Petter Dahl): put the approved wording into the support desk and replace the standing holding message with it the moment Ingrid Solheim has decided it and Kari Nordmann has checked it. Silje Haugland does it when you are away. When the holding message was put in outside working hours, replace it when you are next reachable.
18. Support lead (Petter Dahl): collect every question support cannot answer and bring it to Kari Nordmann once a day, so that the answers are added rather than five support people each inventing one.
19. Head of people (Nora Lind): for a breach of employee or applicant data, prepare what managers may say to staff who ask, as actual sentences and not as improvisation.
20. Managing director (Ingrid Solheim): for a breach of pupil data in the reading app, where the company is the processor, decide what the message to the affected school owners says, after advice from Kari Nordmann. Kari Nordmann writes the part about the data, and Silje Haugland sends it to every affected school owner without undue delay and at the latest 24 hours after the company became aware, as the data processing annex to the subscription contract requires. The message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. Each affected school owner gets its own message addressed to it alone, and they all go out at the same time: no school contact sees the address of another, and no school owner is told before another, not even the largest. The school owner then notifies Datatilsynet about its own pupils, and its own 72 hours start when the company tells it.
21. Managing director (Ingrid Solheim): for data the company controls, decide at the latest 48 hours after the report whether Datatilsynet is notified, after advice from Kari Nordmann and after asking Marius Tangen what happened in the systems. Tomas Berg decides when you are away. Datatilsynet is notified in every case, and the only ground for not notifying is that the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected. Where the fact page cannot establish the risk, notify. Decide that one question and nothing else. The decision goes into the record with its reason, your name and the time, whether the answer is yes or no.
22. Data protection officer (Kari Nordmann): when the answer is yes, write the notification from the fact page. Marius Tangen reads it first for whether the technical description is actually true, Ingrid Solheim approves it and nobody else needs to, and you send it through Datatilsynet's own reporting form at the latest 72 hours after the company became aware. Henrik Aas of Aas & Wold writes and sends it when you are away, and Ingrid Solheim still approves it. The sent notification, the time it was sent and the receipt from Datatilsynet go into the record. When the company later learns something that changes the picture, send a supplementary notification without asking Ingrid Solheim again.
23. Managing director (Ingrid Solheim): for data the company controls, where the fact page shows that the breach is likely to be a high risk for any kind of person affected, have those people told. Decide only the wording and the way they are reached, after advice from Kari Nordmann; Tomas Berg decides when you are away. Silje Haugland tells teachers and school contacts, Nora Lind tells employees and job applicants, and Kari Nordmann writes the part of every message that describes the data and what the person can do. They send the message within 24 hours of your decision, without undue delay and at the latest 72 hours after the fact page shows the high risk. The decision goes into the record with its reason, your name and the time, whether the answer is yes or no.
24. Managing director (Ingrid Solheim): for the pupils of the reading app, where the company is the processor, telling the people affected means telling their school owner, which has already been done, and the school owner decides whether the parents are told.
25. Managing director (Ingrid Solheim): close a case about a real breach after Kari Nordmann says the record is complete. Marius Tangen cannot close his own case and Kari Nordmann cannot close it alone. Six things must be in place first:
    - the breach is actually stopped and Marius Tangen has said so in writing;
    - the fact page is final, with what could not be established written as not established rather than left blank;
    - the decision on Datatilsynet is in the record with its reason and your name, whether the answer was yes or no, and the notification sent if it was yes;
    - every affected school owner has been told, and every affected teacher, employee or job applicant the company decided to tell;
    - the list of measures exists with one named person per measure;
    - the secured logs are stored where Kari Nordmann can find them again.

    Do not close the case inside 72 hours of the report, even when everything is done: that is roughly how long it takes for the thing that was missed to show up.
26. Head of IT (Marius Tangen): own the list of measures that stop the breach happening again, and answer for it to Ingrid Solheim. Give each single measure one named person, usually Amina Farah for anything in the reading app or Nordsky Cloud, Petter Dahl for anything in support or the AI support assistant and Nora Lind for anything about employees, and one date. Write the dates down within 2 weeks of the day the case is closed and leave none open. A measure that could let the same breach happen again is in place within 30 days of the day the case is closed, and any other measure within 90 days. Ingrid Solheim closes the case; you close the measures.
27. Data protection officer (Kari Nordmann): check the list of measures at your six-monthly review of the record of processing activities, the list of the company's processing activities that you keep, and tell Ingrid Solheim what is overdue. An overdue measure goes on the agenda of the Monday leadership meeting until it is done.
28. Head of IT (Marius Tangen): delete the secured copies of the Nordsky Cloud access logs 12 months after the day the case is closed. Keep them longer only while a case about the breach with Datatilsynet, with a school owner or before a court is still open, and then until that case ends; the record says why they were kept longer.

## Who must be told

Inside the company:

- Head of IT Marius Tangen, within 1 hour of the report, by whoever received it, and by the on-call developer (Erik Moen) outside working hours.
- Data protection officer Kari Nordmann and managing director Ingrid Solheim, within 4 hours of the report, by head of IT Marius Tangen. Henrik Aas of Aas & Wold in place of Kari Nordmann on the days she does not work and at weekends.
- Head of people Nora Lind, at the same time as Kari Nordmann and Ingrid Solheim, by head of IT Marius Tangen, whenever the breach touches the payroll system, the hiring system or employee or applicant data in the office suite.
- Head of product Jonas Vikane and head of customer success Silje Haugland, the moment the reading app or a part of it goes offline, by head of IT Marius Tangen, because teaching stops.
- Head of customer success Silje Haugland and support lead Petter Dahl, at once by telephone at home when the breach is confirmed outside working hours, by the on-call developer (Erik Moen); and managing director Ingrid Solheim, by the on-call developer, when neither of them answers.
- Managing director Ingrid Solheim, by data protection officer Kari Nordmann, when a measure is overdue.

Outside the company:

- Each affected school owner, for a breach of pupil data in the reading app: what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. Without undue delay and at the latest 24 hours after the company became aware. One message per school owner, addressed to it alone, all sent at the same time. Managing director Ingrid Solheim decides what it says, data protection officer Kari Nordmann writes the part about the data, and head of customer success Silje Haugland sends it. The school owner then notifies Datatilsynet about its own pupils.
- Datatilsynet, for a breach of data the company controls: at the latest 72 hours after the company became aware, in every case unless the fact page shows that the breach is unlikely to result in a risk to the rights and freedoms of the people affected, and in every case where the fact page cannot establish the risk. Managing director Ingrid Solheim decides after advice from data protection officer Kari Nordmann. Kari Nordmann writes and sends it from the fact page through Datatilsynet's own reporting form, head of IT Marius Tangen reads it first for technical truth, and Ingrid Solheim approves it. Kari Nordmann sends a supplementary notification when the picture changes.
- The people affected, for a breach of data the company controls: told whenever the fact page shows a high risk for them, within 24 hours of Ingrid Solheim's decision, and without undue delay and at the latest 72 hours after the fact page shows the high risk. Head of customer success Silje Haugland tells teachers and school contacts, head of people Nora Lind tells employees and job applicants, and data protection officer Kari Nordmann writes the part about the data and what the person can do. For the pupils of the reading app this duty is met by telling their school owner, and the school owner decides about the parents.
- Henrik Aas of Aas & Wold, when he steps in for data protection officer Kari Nordmann: he receives the case, the record and the fact page with the personal data they hold, under the data processor agreement with Aas & Wold. Under that agreement he deletes or returns the case data when his stand-in on the case ends.

## When to hand over

- When head of IT Marius Tangen cannot be reached, the on-call developer (Erik Moen) takes the report and wakes him.
- When head of IT Marius Tangen is away, lead developer Amina Farah decides in his place and owns the fact page, and head of product Jonas Vikane signs it off.
- When data protection officer Kari Nordmann is away, on the days she does not work and at weekends, the case goes to Henrik Aas of Aas & Wold on the emergency number of the firm instead of waiting for Tuesday: he advises, decides whether a reported case is not a breach, and writes and sends the notification to Datatilsynet.
- When managing director Ingrid Solheim is away, head of finance Tomas Berg takes her decisions.
- When support lead Petter Dahl is away, head of customer success Silje Haugland does his steps; when Silje Haugland is away, Petter Dahl does hers.
- Outside working hours the on-call developer (Erik Moen) does the steps of Petter Dahl and Silje Haugland that cannot wait: switching the AI support assistant into hand-over, putting the standing holding message into the support desk, and starting the fact page.
- When neither head of customer success Silje Haugland nor support lead Petter Dahl answers the telephone at home, the on-call developer (Erik Moen) telephones managing director Ingrid Solheim and tells her that support has nobody.
- A support case that touches the breach is handed over by the AI support assistant to a human, and a question support cannot answer goes from support lead Petter Dahl to data protection officer Kari Nordmann once a day.
- Head of IT Marius Tangen may not close a case: the decision that a report is not a breach goes to data protection officer Kari Nordmann, and the closing of a real case goes to managing director Ingrid Solheim.
- An overdue measure goes from data protection officer Kari Nordmann to managing director Ingrid Solheim and onto the agenda of the Monday leadership meeting until it is done.

## What to record

One breach, one document, written while it happens and not reconstructed a month later. Data protection officer Kari Nordmann keeps it with the record of processing activities, the list of the company's processing activities that she keeps, in the folder of the data protection officer in the office suite, for 5 years. Every reported case gets one, including a case closed as not a breach and a breach that is not notified.

The record of the case holds:

- When the breach was reported and by whom.
- The timeline, with real timestamps.
- The fact page: what data and whose, how many, for each kind of data whether the company is the processor or the controller, the time window, what the logs showed, the likely consequence for every kind of person affected, and what could not be established, written as not established.
- What was done to stop the breach, and Marius Tangen's statement in writing that it is stopped.
- Who was told and when, and the messages that went to the school owners and to the people affected.
- The decision on Datatilsynet, with its reason, the name of the person who took it and the time, whether the answer was yes or no; and when it was yes, the sent notification, the time it was sent and the receipt from Datatilsynet.
- The decision whether the people affected are told, with its reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision that a reported case is not a personal data breach, written by Kari Nordmann herself, with her name, the reason and the time.
- The list of measures that stop the breach happening again, with one named person and one date per measure, and what was changed afterwards.
- Where the secured copies of the Nordsky Cloud access logs are kept and that they hold personal data; and, when they are kept longer than 12 months after the case is closed, why.

## If something does not fit

No one is named to turn to when this document does not cover the situation.
