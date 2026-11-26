# Handle a personal data breach

## When this applies

Start this process on a confirmed personal data breach and on a suspicion that personal data may have been exposed. A suspicion is enough. An unexplained access in the Nordsky Cloud access logs, a bug report that one teacher could see another school's pupils, a lost laptop and a phishing click by an employee each start it. The process itself decides early whether it is a real breach. Where it is not, the case is closed with a line in the record and that is the end of it. The record is the one document for the breach, which the data protection officer (Kari Nordmann) keeps in the folder of the data protection officer in the office suite; `What to record` says what goes into it.

Every report, from inside or outside the company, ends up with the head of IT (Marius Tangen). The clock starts when the report reaches the company, not when someone gets round to reading it.

A report reaches the head of IT in these ways:

- An employee who suspects a security incident reports it to the head of IT (Marius Tangen) the same day, as the information security policy requires.
- A processor reports a breach of the system it supplies: Nordsky AS for Nordsky Cloud, within 24 hours and by email and telephone to the head of IT (Marius Tangen); Hjelpedesk AS for the support desk, within 48 hours; Lønn Norge AS for the payroll system, within 24 hours and to the head of finance (Tomas Berg); Aas & Wold for the data protection officer stand-in service, within 24 hours; Microsoft for the office suite, through the tenant administrator, who is the head of IT (Marius Tangen); Anthropic for the AI support assistant and Rekrutt AS for the hiring system, without undue delay and with no fixed number of hours. Each time counts from when that processor became aware.
- A teacher or a school owner writes to support. The support person who sees the case telephones the head of IT (Marius Tangen) the same hour and does not reclassify the case as a normal bug.
- An outsider, a researcher or a parent, writes to the general address or to the managing director (Ingrid Solheim). Whoever receives it forwards it to the head of IT (Marius Tangen) and telephones him.

Where the head of IT (Marius Tangen) cannot be reached, the on-call developer (Erik Moen in the week beginning 23 November 2026) takes the report and wakes him.

The process covers a breach of any personal data in any of the company's systems: the reading app, Nordsky Cloud, the support desk, the AI support assistant, the payroll system, the hiring system, the office suite and the contract archive. It is one process, not one per system.

Decide in the first minutes which of these two situations the case is in, because the rest of it differs:

- Pupil data of the reading app: the pupils are children, the company is the processor and the 310 school owners are the controllers. The company tells the affected school owner, and the school owner notifies Datatilsynet, the Norwegian data protection authority.
- Teacher data, support desk data, employee data and applicant data: the company is the controller itself and notifies Datatilsynet directly.

Where one breach affects both pupil data and data the company controls, as a breach in Nordsky Cloud would, handle it as one case, with one record and one timeline, and run both duties at the same time.

Every time in this process runs around the clock, including every evening, every weekend and every public holiday. Working hours are Monday to Friday, 08:00 to 16:00, the hours in which the head of customer success (Silje Haugland) and the support lead (Petter Dahl) are reachable. Every other hour is outside working hours. Every time counts from the moment the report reached the company, unless the step says otherwise.

The process does not cover:

- The notification to Datatilsynet about the pupils of a school owner. The school owner is the controller and notifies Datatilsynet itself.
- The decision whether the parents of the pupils are told. The school owner decides that, not the company.

## Who does what

- Managing director: Ingrid Solheim. Head of finance Tomas Berg steps in when she is away.
- Head of finance: Tomas Berg. Ingrid Solheim steps in when he is away.
- Data protection officer: Kari Nordmann. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of the external firm Aas & Wold steps in when she is away, on the firm's emergency number.
- Head of IT: Marius Tangen. He can be reached on his mobile around the clock. Lead developer Amina Farah steps in when he is away.
- Lead developer: Amina Farah. Head of product Jonas Vikane steps in when she is away.
- Head of product: Jonas Vikane. Lead developer Amina Farah steps in when he is away.
- Head of customer success: Silje Haugland. Reachable in working hours only. Support lead Petter Dahl steps in when she is away.
- Support lead: Petter Dahl. Reachable in working hours only. Head of customer success Silje Haugland steps in when he is away.
- Head of people: Nora Lind. Ingrid Solheim steps in when she is away.
- On-call developer: one of the eight developers of the two development teams, on the weekly rota in the staff handbook, reachable around the clock on the on-call telephone number. In the week beginning 23 November 2026 it is Erik Moen, with Lise Berntsen as the stand-in for that week.

## Steps

Steps 1 to 3 are done in advance, before any breach. Where a report has just arrived, start at step 4.

1. Support lead (Petter Dahl): keep a standing configuration of the AI support assistant ready that hands breach cases over to a human, so that nobody has to write it at midnight.
2. Support lead (Petter Dahl): keep a standing holding message for the support desk ready, approved in advance by the managing director (Ingrid Solheim) and the data protection officer (Kari Nordmann).
3. Support lead (Petter Dahl): review the standing configuration and the standing holding message every six months.
4. Whoever receives the report: forward it to the head of IT (Marius Tangen) and telephone him the same hour. Where the head of IT cannot be reached, the on-call developer (Erik Moen in the week beginning 23 November 2026) takes the report and wakes him.
5. Head of IT (Marius Tangen): take the case within 1 hour of the report.
6. Head of IT (Marius Tangen), or outside working hours the on-call developer (Erik Moen in the week beginning 23 November 2026): secure the logs within 4 hours of the report. Export the Nordsky Cloud access logs for the case and copy them out of the normal 90-day retention, before anything in production is changed.
7. Head of IT (Marius Tangen): make a folder for the case in the office suite, beside the record.
8. Head of IT (Marius Tangen): put the secured copy in that folder.
9. Head of IT (Marius Tangen): give the right to open the folder to five people and no others: yourself, the lead developer (Amina Farah), the data protection officer (Kari Nordmann), Henrik Aas of Aas & Wold while he stands in for her, and the managing director (Ingrid Solheim).
10. Head of IT (Marius Tangen): give nobody else access to the folder without the agreement of the data protection officer (Kari Nordmann).
11. Head of IT (Marius Tangen): never send the secured copy by email, never print it and never put it on a private device, a private account or a memory stick.
12. Head of IT (Marius Tangen): decide which of closing the access, revoking the token and locking the account fit the breach, and do every one that fits, within 4 hours of the report. The lead developer (Amina Farah) decides when he is away. Outside working hours the on-call developer (Erik Moen in the week beginning 23 November 2026) does at once, without waiting for that decision, every one of the three the role can do in Nordsky Cloud, and then tells the head of IT what was done and when; the head of IT decides about anything the role cannot do.
13. Head of IT (Marius Tangen): stop the breach within 4 hours of the report. Take the reading app or a part of it offline only where there is no narrower way to stop the breach inside those 4 hours, because that stops teaching in 310 schools. The lead developer (Amina Farah) decides when Marius Tangen is away.
14. Head of IT (Marius Tangen): where a part of the app goes offline, tell the head of product (Jonas Vikane) and the head of customer success (Silje Haugland) the moment it happens.
15. Head of IT (Marius Tangen): write down the time of the report and who reported it.
16. Head of IT (Marius Tangen): tell the data protection officer (Kari Nordmann) and the managing director (Ingrid Solheim) within 4 hours of the report. Where Kari Nordmann is away, on a day she does not work or at a weekend, tell Henrik Aas of Aas & Wold on the firm's emergency number instead.
17. Head of IT (Marius Tangen): at the same time, where the breach touches the payroll system, the hiring system or employee or applicant data in the office suite, tell the head of people (Nora Lind), so that she starts her part. Do not wait for anyone to think of her.
18. Everyone on the case: delete nothing, fix no bug in production before the logs are secured, and email no school owner before the data protection officer (Kari Nordmann) has looked at the case.
19. Head of IT (Marius Tangen): say whether this is a real personal data breach, as a technical judgement, and say for each kind of data affected whether the company is the controller or the processor.
20. Data protection officer (Kari Nordmann): where the case is not a personal data breach, you decide it and you must agree before it is closed; the head of IT (Marius Tangen) may not close a case even where it looks obvious to him. Write the line in the record yourself, with your name, the reason and the time. Henrik Aas of Aas & Wold decides when she is away.
21. Head of IT (Marius Tangen): decide whether pupils, teachers or school owners are affected, or the breach is likely to become publicly known. Where you are unsure, the answer is yes. Where the answer is no, support is not closed on the subject of the breach: steps 22 to 24 do not apply, and the case goes on at step 25.
22. Support lead (Petter Dahl): where the answer is yes, close support on the subject of the breach. That means two things, and it does not mean that support stops answering: switch the AI support assistant into hand-over, and put the standing holding message into the support desk. The head of customer success (Silje Haugland) does both when Petter Dahl is away. Outside working hours the on-call developer (Erik Moen in the week beginning 23 November 2026) switches the AI support assistant into hand-over and puts in the standing holding message, and writes down when he did it.
23. AI: the AI support assistant hands every case that carries a sign of the breach to a human support person and answers nothing in that case. It keeps answering ordinary cases, and it says nothing about the breach, not even that there is one. The signs are these words, in Norwegian and in English: lekkasje, leak, hacket, hacked, hack, brudd, breach, data, personopplysninger, personal data, personvern, privacy, GDPR, Datatilsynet; and two signs that are not words: every case that comes from a parent rather than from a teacher or a school contact, and every case that names the system the breach is in. A case with any one of these signs goes to a human, as the AI use policy requires for any case that concerns a complaint, a contract or personal data. Support lead (Petter Dahl) answers for the result.
24. Support lead (Petter Dahl): you may add a word or a sign to the list of signs while the case runs; write down what you added and when. Take nothing off the list while the case runs. Outside working hours the on-call developer (Erik Moen in the week beginning 23 November 2026) may add one and tells you.
25. On-call developer (Erik Moen in the week beginning 23 November 2026): where a breach is confirmed outside working hours, telephone the head of customer success (Silje Haugland) and the support lead (Petter Dahl) at home at once. Where neither answers, telephone the managing director (Ingrid Solheim) and tell her that support has nobody.
26. Managing director (Ingrid Solheim): decide the sentences support may use, and the data protection officer (Kari Nordmann) checks them. They say that the company knows about it, that it is looking into it, who is handling it and when the person will hear more, and nothing else. They do not say how many pupils are affected, whether data was accessed, whose fault it is, or that it is probably nothing.
27. Support lead (Petter Dahl): put the sentences into the support desk as actual sentences, not as a rule telling support to improvise, within 4 hours of the report. Replace the standing holding message with them the moment the managing director (Ingrid Solheim) has decided them and the data protection officer (Kari Nordmann) has checked them. The head of customer success (Silje Haugland) does it when Petter Dahl is away. Where the sentences become ready outside working hours, put them in when you are next reachable.
28. Support lead (Petter Dahl): collect every question support cannot answer and bring it to the data protection officer (Kari Nordmann) once a day.
29. Head of people (Nora Lind): where employee or applicant data is affected, prepare what managers may say to staff who ask, as sentences and not as improvisation.
30. Head of IT (Marius Tangen): own the fact page and sign it off. The fact page is the one page that holds what step 32 lists, and it goes into the record. When he is away the lead developer (Amina Farah) owns it and the head of product (Jonas Vikane) signs it off. Outside working hours the on-call developer (Erik Moen in the week beginning 23 November 2026) starts the page with what is known in the first hours, and the head of IT or the lead developer takes it over.
31. The person responsible for each affected system: establish the facts in that system and give them to the head of IT (Marius Tangen) within 12 hours of being asked. That is the head of finance (Tomas Berg) for the payroll system, the head of people (Nora Lind) for the hiring system, the head of IT (Marius Tangen) himself for the office suite and the contract archive, the head of customer success (Silje Haugland) for the support desk, the support lead (Petter Dahl) for the AI support assistant, and the lead developer (Amina Farah) for the reading app and Nordsky Cloud. Where that person is away, the person named under `Who does what` as stepping in for them does it. Absence and sick leave from the payroll system are health data: the head of finance (Tomas Berg) gives them only as the categories absence and sick leave, with the number of employees affected, and nothing about any individual's health, diagnosis or reason for absence.
32. Head of IT (Marius Tangen), or the lead developer (Amina Farah) when he is away: put all of this on the fact page, on one page and not in a thread:
    - What data is affected, which categories and how sensitive it is. A read-aloud recording of a child's voice is worse than a reading level.
    - Which people are affected, how many of each kind, and which school owners their pupils belong to.
    - For each kind of data, whether the company is the controller or the processor. Do not see pupil data first, go into processor mode and forget that the teachers are the company's own.
    - The window: from when to when the data was exposed.
    - Whether anyone actually accessed it, which means what the Nordsky Cloud access logs show. Where the logs cannot tell, the answer is that it cannot be ruled out, and it is treated as accessed.
    - The likely consequence of the breach for every kind of person affected: pupils, teachers, school contacts, employees and job applicants.
    - What has already been done to stop it.

    Whoever writes on the fact page writes absence and sick leave from the payroll system only as the categories absence and sick leave, with the number of employees affected, and nothing about any individual's health, diagnosis or reason for absence.
33. Head of IT (Marius Tangen), or the lead developer (Amina Farah) when he is away: where something on the fact page cannot be established, write on the page that it is not established and why, rather than leaving it blank. That counts as a high risk until it is established.
34. Data protection officer (Kari Nordmann): absence and sick leave from the payroll system are health data. Name them on the fact page, in a notification to Datatilsynet and in a message to the people affected only as the categories absence and sick leave, with the number of employees affected and nothing about any individual's health, diagnosis or reason for absence. The company handles them on the ground of Article 9(2)(b) of the GDPR together with Article 6(1)(c), to carry out its obligations in the field of employment law. Where more than the category is needed, you decide what is written.
35. Head of IT (Marius Tangen), or the lead developer (Amina Farah) when he is away: finish the fact page within 24 hours of the report. It is not finished until the data protection officer (Kari Nordmann) says she has what she needs for her advice.
36. Data protection officer (Kari Nordmann): keep one list of the duties of the case. Where the company is the processor for some of the affected data and the controller for other data, put both sides on the one list. The deadline that binds the case is the earliest one on it.
37. Managing director (Ingrid Solheim): where pupil data of the reading app is affected, decide what the message to the affected school owners says, after advice from the data protection officer (Kari Nordmann), who writes the part about the data. The head of customer success (Silje Haugland) is asked how the school owners are reached before the decision is taken. The head of finance (Tomas Berg) decides when she is away.
38. Head of customer success (Silje Haugland): send one message per affected school owner, addressed to that school owner alone, and send them all at the same time, within 24 hours of the report, as the data processing annex to the subscription contract requires. No school contact sees the address of another, and no school owner is told before another. There is no telephone call to the big ones first.
39. Head of customer success (Silje Haugland): the message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do.
40. Head of customer success (Silje Haugland): tell the affected school owners before any notification to Datatilsynet goes out.
41. Managing director (Ingrid Solheim): where the company is the controller for affected data, decide whether Datatilsynet is notified, after advice from the data protection officer (Kari Nordmann) and after asking the head of IT (Marius Tangen) what happened in the systems. Take the decision at the latest 48 hours after the report, so that 24 hours are left to write a decent notification. The head of finance (Tomas Berg) decides when she is away.
42. Managing director (Ingrid Solheim): notify Datatilsynet in every case. The only ground for not notifying is that the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected, which is the ground Article 33 of the GDPR gives. Where the fact page cannot establish the risk, notify. The decision is about that one question and nothing else.
43. Data protection officer (Kari Nordmann): write the notification from the fact page. The head of IT (Marius Tangen) reads it first and says whether the technical description is actually true. The managing director (Ingrid Solheim) approves it, and nobody else needs to. Send it through Datatilsynet's own reporting form. Henrik Aas of Aas & Wold writes and sends it when she is away, and the managing director still approves it.
44. Data protection officer (Kari Nordmann): send the notification without undue delay, the moment the fact page carries enough to send it, and at the latest 72 hours after the report, as Article 33 of the GDPR requires. The 72 hours is the outer limit and not a waiting time. Where something is still unestablished, send the notification with that said in it.
45. Data protection officer (Kari Nordmann): where the company later learns something that changes the picture, send a supplementary notification without asking the managing director (Ingrid Solheim) again.
46. Data protection officer (Kari Nordmann): do not notify Datatilsynet about the pupils of the reading app. The school owner is the controller for them, notifies Datatilsynet itself and decides whether the parents are told.
47. Managing director (Ingrid Solheim): where the company is the controller for the affected data and the fact page shows a high risk for a kind of person affected, those people are told, as Article 34 of the GDPR requires. Decide, after advice from the data protection officer (Kari Nordmann); the head of finance (Tomas Berg) decides when she is away. The decision is only about the wording and the way the people are reached, not about whether they are told.
48. Head of customer success (Silje Haugland): tell the affected teachers and school contacts. The head of people (Nora Lind) tells the affected employees and job applicants.
49. Data protection officer (Kari Nordmann): the message says, in clear and plain language, what happened, as the nature of the breach; your name and contact details as data protection officer, and those of Henrik Aas of Aas & Wold when you are away; the likely consequences of the breach for that person; the measures the company has taken or proposes to take, including what it has done to limit the harm; and the description of the data and what the person can do, which you write. Check that all of this is in the message before it goes out.
50. Head of customer success (Silje Haugland) and head of people (Nora Lind): the message holds no personal data of anyone other than the person it is sent to, carries the date it was sent and goes to each person separately.
51. Head of customer success (Silje Haugland) and head of people (Nora Lind): send the message within 24 hours of the managing director's decision, without undue delay and at the latest 72 hours after the fact page shows the high risk.
52. Head of customer success (Silje Haugland): do not tell the pupils of the reading app. The company is the processor for their data, so telling them means telling their school owner, which has already happened within 24 hours, and the school owner decides about the parents.
53. Head of IT (Marius Tangen): draw up the list of the measures that stop the breach happening again. You are answerable for it to the managing director (Ingrid Solheim). Give each single measure one named person and a date: usually the lead developer (Amina Farah) for anything in the reading app or Nordsky Cloud, the support lead (Petter Dahl) for anything in support or the AI support assistant, and the head of people (Nora Lind) for anything about employees. A measure that could let the same breach happen again is in place within 30 days of the case being closed, and any other measure within 90 days.
54. Head of IT (Marius Tangen): have the list of measures, with one named person for each measure, before the case is closed.
55. Managing director (Ingrid Solheim): close the case, after the data protection officer (Kari Nordmann) says the record is complete. The head of IT (Marius Tangen) cannot close his own case and the data protection officer cannot close it alone. Six things must be in place before it is closed:
    - The breach is actually stopped and the head of IT (Marius Tangen) has said so in writing.
    - The fact page is final, including the parts that could not be established, written as not established rather than left blank.
    - The decision on Datatilsynet is in the record with its reason and the name of the person who took it, whether the answer was yes or no, and the notification is sent where it was yes.
    - Every affected school owner has been told, and every affected teacher, employee or job applicant the company decided to tell.
    - The list of measures exists with one named person per measure.
    - The secured logs are stored where the data protection officer (Kari Nordmann) can find them again.
56. Managing director (Ingrid Solheim): do not close the case inside 72 hours of the report, even where everything is done.
57. Head of IT (Marius Tangen): write down the dates on the measures within 2 weeks of the case being closed, and leave none open. Closing the case is not the end of the measures: you close the measures.
58. Data protection officer (Kari Nordmann): check the list of measures at your six-monthly review of the record of processing activities and tell the managing director (Ingrid Solheim) what is overdue. An overdue measure goes on the agenda of the Monday leadership meeting until it is done.
59. Data protection officer (Kari Nordmann): where Henrik Aas of Aas & Wold stood in on the case, Aas & Wold deletes or returns the case data when the stand-in on that case ends.
60. Head of IT (Marius Tangen): delete the secured copies of the Nordsky Cloud access logs 12 months after the day the case is closed. Keep them longer only while a case about the breach with Datatilsynet, with a school owner or before a court is still open, and then until that case ends, and write in the record why they were kept longer.
61. Head of IT (Marius Tangen): decide anything about the systems, including how long the reading app stays offline and when it goes back, and tell the head of product (Jonas Vikane) and the head of customer success (Silje Haugland) at once when it goes back. The lead developer (Amina Farah) decides when Marius Tangen is away.
62. Support lead (Petter Dahl): decide anything about an answer the AI support assistant has already sent, and ask the data protection officer (Kari Nordmann) when the answer touches personal data. The head of customer success (Silje Haugland) decides when Petter Dahl is away.
63. Data protection officer (Kari Nordmann): answer every other question this process does not answer, on the three days you work. Henrik Aas of Aas & Wold answers on the firm's emergency number on the other days and at weekends. A question none of them can answer goes to the managing director (Ingrid Solheim), and to the head of finance (Tomas Berg) when she is away.
64. Data protection officer (Kari Nordmann): put every such question and the answer given into the record.

## Who must be told

Inside the company:

- The head of IT (Marius Tangen), by whoever receives the report, the same hour and within 1 hour of the report.
- The data protection officer (Kari Nordmann) and the managing director (Ingrid Solheim), by the head of IT (Marius Tangen), within 4 hours of the report.
- The head of people (Nora Lind), by the head of IT (Marius Tangen), at the same time, where the breach touches the payroll system, the hiring system or employee or applicant data in the office suite.
- The head of product (Jonas Vikane) and the head of customer success (Silje Haugland), by the head of IT (Marius Tangen), the moment the reading app or a part of it goes offline, and at once when it goes back.
- The head of customer success (Silje Haugland) and the support lead (Petter Dahl), by telephone at home, by the on-call developer (Erik Moen in the week beginning 23 November 2026), at once when a breach is confirmed outside working hours. Where neither answers, the managing director (Ingrid Solheim), by the on-call developer, that support has nobody.
- Henrik Aas of Aas & Wold, in place of the data protection officer (Kari Nordmann), on the days she does not work and at weekends.

Outside the company:

- Every affected school owner, where pupil data of the reading app is affected: told by the head of customer success (Silje Haugland), one message each, all sent at the same time, without undue delay and at the latest 24 hours after the report, and before any notification to Datatilsynet. The message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. This is what the data processing annex to the subscription contract requires.
- Datatilsynet, where the company is the controller for affected data: notified by the data protection officer (Kari Nordmann), or by Henrik Aas of Aas & Wold when she is away, after the managing director (Ingrid Solheim) has decided and approved it, without undue delay and at the latest 72 hours after the report. Datatilsynet is notified in every case; the only ground for not notifying is that the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected, and where the risk cannot be established the breach is notified. A supplementary notification follows where the company later learns something that changes the picture.
- The people affected, where the company is the controller and the fact page shows a high risk: affected teachers and school contacts told by the head of customer success (Silje Haugland), affected employees and job applicants told by the head of people (Nora Lind), without undue delay, at the latest 72 hours after the fact page shows the high risk and within 24 hours of the managing director's decision. The message says what happened, names the data protection officer (Kari Nordmann) with her contact details, and Henrik Aas of Aas & Wold when she is away, gives the likely consequences for that person and the measures the company has taken or proposes, and describes the data and what the person can do.
- The pupils and their parents: the company does not tell them. Telling the pupils means telling their school owner, which has already happened, and the school owner decides about the parents and about notifying Datatilsynet for its own pupils.

## When to hand over

- The head of IT (Marius Tangen) cannot be reached with a report: the on-call developer (Erik Moen in the week beginning 23 November 2026) takes it and wakes him.
- The head of IT (Marius Tangen) is away: the lead developer (Amina Farah) decides which of closing the access, revoking the token and locking the account fit the breach, whether the reading app goes offline and when it goes back, and owns the fact page, which the head of product (Jonas Vikane) then signs off.
- A technical step outside working hours that the on-call developer (Erik Moen in the week beginning 23 November 2026) cannot take in Nordsky Cloud: the head of IT (Marius Tangen) decides it.
- The data protection officer (Kari Nordmann) is away, on the days she does not work and at weekends: Henrik Aas of Aas & Wold on the firm's emergency number decides whether a case is a breach, advises, and writes and sends the notification to Datatilsynet.
- The managing director (Ingrid Solheim) is away: the head of finance (Tomas Berg) decides whether Datatilsynet is notified, what the messages say and whether the people affected are told.
- The support lead (Petter Dahl) is away: the head of customer success (Silje Haugland) switches the hand-over on, puts the holding message and the approved sentences into the support desk, and decides about an answer the AI support assistant has already sent.
- The head of customer success (Silje Haugland) is away: the support lead (Petter Dahl) steps in.
- The head of people (Nora Lind) is away: the managing director (Ingrid Solheim) steps in.
- Neither the head of customer success (Silje Haugland) nor the support lead (Petter Dahl) answers the telephone at home: the on-call developer (Erik Moen in the week beginning 23 November 2026) telephones the managing director (Ingrid Solheim) and tells her that support has nobody.
- The head of IT (Marius Tangen) judges that a case is not a personal data breach: he may not close it. It goes to the data protection officer (Kari Nordmann), who decides and writes the line in the record herself.
- A measure is overdue: the data protection officer (Kari Nordmann) tells the managing director (Ingrid Solheim), and the measure goes on the agenda of the Monday leadership meeting until it is done.
- A question about the systems, including how long the reading app stays offline and when it goes back: the head of IT (Marius Tangen), and the lead developer (Amina Farah) when he is away.
- A question about an answer the AI support assistant has already sent: the support lead (Petter Dahl), who asks the data protection officer (Kari Nordmann) when the answer touches personal data, and the head of customer success (Silje Haugland) when he is away.

## What to record

One breach is one document, written while it happens and not reconstructed a month later. The data protection officer (Kari Nordmann) keeps the record of the case with the record of processing activities, in the folder of the data protection officer in the office suite, for 5 years.

The record holds:

- When the breach was reported and by whom, and the time the report reached the company.
- The timeline of the case with real timestamps.
- The fact page: what data and whose, how many people of each kind, whether the company is the controller or the processor for each kind of data, the time window, what the logs showed, the likely consequence for every kind of person affected, and what could not be established and why.
- What was done to stop the breach: which of closing the access, revoking the token and locking the account were done, which were not and why, when each was done and by whom, and whether the reading app or a part of it went offline and when it went back.
- That the Nordsky Cloud access logs were secured, where the secured copy is kept, that it holds personal data, that the head of IT (Marius Tangen) set the access rights to the folder, and the agreement of the data protection officer (Kari Nordmann) where anyone else was given access.
- When the AI support assistant was switched into hand-over and the standing holding message put in, by whom, and every word or sign added to the list of signs, by whom and when.
- Who was told and when: inside the company, each affected school owner, Datatilsynet, and each person the company told.
- The decision on Datatilsynet, with its reason, the name of the person who took it and the time, whether the answer was yes or no, and where it was yes the sent notification, the time it was sent and the receipt from Datatilsynet, and any supplementary notification.
- The decision whether the people affected are told, with its reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision that a case is not a personal data breach at all, with its reason, the name of the data protection officer (Kari Nordmann) and the time.
- The message that went to the school owners, and the message that went to the people affected.
- The list of measures that stop the breach happening again, with one named person and a date for each, and when each was done.
- Every question the process did not answer, and the answer that was given.
- Where the secured logs were kept longer than 12 months after the case was closed, why they were kept longer.

The secured copies of the Nordsky Cloud access logs are kept in the folder the head of IT (Marius Tangen) makes for the case in the office suite, beside the record, for 12 months from the day the case is closed, and then he deletes them. Only the head of IT (Marius Tangen), the lead developer (Amina Farah), the data protection officer (Kari Nordmann), Henrik Aas of Aas & Wold while he stands in for her, and the managing director (Ingrid Solheim) may open the folder. The copy is never sent by email, never printed and never put on a private device, a private account or a memory stick.

Where Henrik Aas of Aas & Wold stood in on the case, Aas & Wold deletes or returns the case data when the stand-in on that case ends.

## If something does not fit

Take it to the data protection officer (Kari Nordmann) on the three days she works, Tuesday, Wednesday and Thursday, and to Henrik Aas of Aas & Wold on the firm's emergency number on the other days and at weekends. Where neither of them can answer it, take it to the managing director (Ingrid Solheim), and to the head of finance (Tomas Berg) when she is away. Put the question and the answer you were given into the record.
