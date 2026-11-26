# Handle a personal data breach

## When this applies

Start this process on a confirmed personal data breach, and also on a suspicion that personal data may have been exposed. An unexplained access in the Nordsky Cloud access logs, a bug report that one teacher could see another school's pupils, a lost laptop and a phishing click by an employee each start it. Run the process ten times too often rather than once too late: the 72 hours start when the company became aware, and aware is earlier than certain. The process decides early whether it is a real breach. Where it is not, the case is closed with a line in the record, and that is the end of it.

Every report ends up in the same place, with head of IT Marius Tangen. The clock starts when the report reaches the company, not when someone gets round to reading it. A report reaches him in these ways:

- An employee reports a suspected security incident to the head of IT the same day.
- A support person who sees a case from a teacher or a school contact that may be a breach telephones Marius Tangen the same hour, and does not reclassify the case as a normal bug.
- Nordsky AS, for Nordsky Cloud, reports to the head of IT by email and telephone within 24 hours of becoming aware.
- Hjelpedesk AS, for the support desk, reports within 48 hours of becoming aware.
- Lønn Norge AS, for the payroll system, reports to head of finance Tomas Berg within 24 hours of becoming aware, and he brings it to Marius Tangen.
- Aas & Wold, for a breach of its own while standing in for the data protection officer, reports within 24 hours of becoming aware.
- Rekrutt AS, for the hiring system, reports without undue delay; the agreement sets no fixed number of hours.
- Anthropic, for the AI support assistant, notifies the company without undue delay; the agreement sets no fixed number of hours.
- Microsoft, for the office suite, notifies the company without undue delay through the tenant administrator, who is Marius Tangen; the addendum sets no fixed number of hours.
- Someone outside the company, such as a parent, a researcher, a teacher or a school contact, writes to the general address or to the managing director. Whoever receives it forwards it to Marius Tangen and telephones him.

Where Marius Tangen cannot be reached, the on-call developer takes the report and wakes him.

The process covers a personal data breach of all personal data in all the company's systems: the reading app, Nordsky Cloud, the support desk, the AI support assistant, the payroll system, the hiring system, the office suite and the contract archive. It is one process, not one per system.

See in the first minutes which of these two situations you are in, because the rest differs:

- **Pupil data in the reading app.** The company is the data processor and the 310 school owners are the controllers. The company tells the school owner, and the school owner notifies Datatilsynet, the Norwegian data protection authority. The pupils are children.
- **Teacher data, school contact data, support desk data, employee data and applicant data.** The company is the controller itself and notifies Datatilsynet directly.

A school owner is the municipality or the private body that subscribes to the reading app and is the controller for its own pupils; it is an organisation and not a person. A school contact is the person at that school owner whose name, work email address, telephone number and school are in the support desk as the one the company writes to and who signs for the school owner. A teacher is a person who uses the reading app to follow their pupils' reading, and is not a school contact unless they are also named as one.

Where one breach touches both pupil data and data the company controls, as a breach in Nordsky Cloud would, handle it as one case, with one record and one timeline, and run both duties at the same time.

The process leaves out what the school owner decides for its own pupils: whether Datatilsynet is notified about them, and whether the parents are told.

## Who does what

- Head of IT: Marius Tangen. He is reachable on his mobile around the clock. Lead developer Amina Farah steps in when he is away.
- Data protection officer: Kari Nordmann. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of the external firm Aas & Wold steps in on the other days and at weekends, on the firm's emergency number.
- Managing director: Ingrid Solheim. She is reachable on her mobile around the clock. Head of finance Tomas Berg steps in when she is away.
- Lead developer: Amina Farah. Head of product Jonas Vikane steps in when she is away, and signs off the fact page when she owns it.
- Head of customer success: Silje Haugland. She is reachable in working hours only. Support lead Petter Dahl steps in when she is away.
- Support lead: Petter Dahl. He is reachable in working hours only. Silje Haugland steps in when he is away.
- On-call developer: Erik Moen holds the week beginning 23 November 2026, reachable around the clock on the on-call telephone number in the staff handbook. Lise Berntsen is the stand-in named on the rota for that week. The role is one of the eight developers of the two development teams, on a weekly rota that Amina Farah sets a month ahead and keeps in the staff handbook.
- Head of people: Nora Lind. Ingrid Solheim steps in when she is away.
- Head of finance: Tomas Berg. Ingrid Solheim steps in when he is away.
- Head of product: Jonas Vikane. Amina Farah steps in when he is away.
- Support team: Hanne Riise, Jostein Vold, Maja Eriksen, Sondre Lie and Thea Nygård. While a breach is running they answer only with the sentences that stand in the support desk, and bring every question they cannot answer to Petter Dahl. When one of the five is away the other four take the queue. When fewer than two of them are reachable in working hours, Petter Dahl answers the queue himself, and Silje Haugland steps in for him when he is away.
- AI support assistant: Claude from Anthropic, inside the support desk. No one is named to step in for it. Petter Dahl answers for what it does in this process.

## Steps

Every time counts from the moment the report reached the company, unless the step says otherwise. That moment is the moment the company became aware, and the 72 hours of the GDPR run from it. All times run around the clock, including every evening, every weekend and every public holiday, because a leak on Friday evening is the common case and not the rare one.

Working hours are Monday to Friday, 08:00 to 16:00, the hours in which Silje Haugland and Petter Dahl are reachable. Every other hour is outside working hours. A step that falls partly on each side belongs to whoever holds it at the moment the step has to be done.

Steps 1 to 3 are done in advance, before any breach. A report that has just arrived starts at step 4.

1. Support lead (Petter Dahl): Prepare the standing configuration that puts the AI support assistant into hand-over for breach cases, so that nobody has to write it at midnight.
2. Support lead (Petter Dahl): Prepare the standing holding message for the support desk. It is the message that stands in the support desk from the moment support is closed on the subject until the sentences support may use replace it. Ingrid Solheim and Kari Nordmann approve it and the standing configuration in advance, as part of this process and not during an incident.
3. Support lead (Petter Dahl): Review the standing configuration and the standing holding message every six months.
4. Whoever receives the report: Forward it to Marius Tangen and telephone him. Where you are a support person who sees such a case, telephone him the same hour. Where he cannot be reached, the on-call developer (Erik Moen) takes the report and wakes him.
5. Head of IT (Marius Tangen): Answer the person who reported it within 1 hour of the report, so that they know the case is held and by whom. Where that person is outside the company, say in plain language: that their name and what they wrote are written in the record of the case; that this is because the company must be able to show how it handled the breach, which the GDPR requires of it; that the record is kept five years from the day the case is closed and is then deleted; and that Kari Nordmann is the data protection officer they can ask about this, with her contact details, and Henrik Aas of Aas & Wold when she is away. Where the person asks not to be named, their report is still recorded, and Kari Nordmann decides what of their identity the record holds and writes that decision in the record.
6. Head of IT (Marius Tangen): Open the record of the case within 1 hour of the report. It is the one document for this breach, written while it happens. Write in it the time the report reached the company, who reported it, what they said and that you have taken the case.
7. Head of IT (Marius Tangen): Decide within 1 hour of the report, from what you have, whether the breach may still be running. Where it may be, go at once to steps 10 to 19, and still do step 8 within 1 hour of the report. Where it may not be, go on to step 8.
8. Head of IT (Marius Tangen): Write in the record within 1 hour of the report which systems may be touched, so that the people responsible for them can be asked.
9. Lead developer (Amina Farah): Do steps 5 to 8 where Marius Tangen cannot do them within 1 hour of the report. Outside working hours the on-call developer (Erik Moen) does what the role can do and reaches Marius Tangen or Amina Farah for the rest.
10. Head of IT (Marius Tangen): Export and copy the Nordsky Cloud access logs out of the normal 90-day retention within 4 hours of the report, before anything is fixed in production and before anything is deleted. The logs roll over, and evidence has been lost that way before.
11. Head of IT (Marius Tangen): Make a folder for the case in the office suite.
12. Head of IT (Marius Tangen): Put the secured copy of the logs in that folder. Never send the copy by email, never print it and never put it on a private device, a private account or a memory stick.
13. Head of IT (Marius Tangen): Give the right to open the folder to five people and no others: yourself, Amina Farah, Kari Nordmann, Henrik Aas of Aas & Wold while he stands in for Kari Nordmann, and Ingrid Solheim. Give nobody else access without Kari Nordmann's agreement.
14. Head of IT (Marius Tangen): Take Henrik Aas's right to open the folder away when his stand-in on the case ends. Aas & Wold then deletes or returns the case data, as its data processor agreement requires.
15. Head of IT (Marius Tangen): Write in the record that you made the folder and set those rights, where the logs are kept and that they hold personal data. Where someone else is given access, put Kari Nordmann's agreement in the record too.
16. Head of IT (Marius Tangen): Decide which of closing the access, revoking the token and locking the account fit this breach, and do every one that fits, within 4 hours of the report. Amina Farah decides when you are away. Outside working hours the on-call developer (Erik Moen) does at once, without waiting for that decision, every one of the three that the role can do in Nordsky Cloud, and then tells Marius Tangen what was done and when; Marius Tangen decides about anything the role cannot do.
17. Head of IT (Marius Tangen): Take the reading app or a part of it offline, within 4 hours of the report, only where no narrower way stops the breach, because taking it offline stops teaching in 310 schools. Amina Farah decides when you are away. Tell Jonas Vikane and Silje Haugland the moment it happens.
18. Head of IT (Marius Tangen): Write in the record what was done to stop the breach, what was not done and why.
19. Everyone: Delete nothing. Fix no bug in production before the logs are secured. Email no school owner before Kari Nordmann has looked at the case.
20. Head of IT (Marius Tangen): Give your technical judgement whether this is a real personal data breach. You may not close a case, even where it looks obvious to you.
21. Head of IT (Marius Tangen): Tell Kari Nordmann and Ingrid Solheim about the case within 4 hours of the report. On the days Kari Nordmann does not work and at weekends, tell Henrik Aas of Aas & Wold on the firm's emergency number instead, rather than letting the case wait.
22. Head of IT (Marius Tangen): At the same time tell Nora Lind, whenever the breach touches the payroll system, the hiring system or employee or applicant data in the office suite, and Silje Haugland, whenever it touches pupil, teacher or school contact data. Do not wait for anyone to think of them.
23. Data protection officer (Kari Nordmann): Decide whether a reported case is not a personal data breach. Marius Tangen tells you about the case under step 21. You must agree before it is closed. Write the line in the record yourself, with your name, the reason and the time, so that there is a name on it if Datatilsynet ever asks. Where you decide that the case is not a personal data breach, the case is closed with that line in the record, and that is the end of it. Henrik Aas of Aas & Wold decides when you are away.
24. Head of IT (Marius Tangen): Decide, when you confirm the breach, whether support is closed on the subject. Close it where pupils, teachers, school owners or school contacts are affected, or where the breach is likely to become publicly known. Where you are unsure, close it: the cost of an unnecessary holding message is far lower than the cost of a support person improvising. Where you do not close it, as for a breach of the payroll system or the hiring system that affects no pupil, teacher, school owner or school contact and is not likely to become publicly known, the AI support assistant and the support desk are left as they are, and steps 27 to 33 and steps 35 to 38 fall away: go to step 34 and then on to the fact page at step 39.
25. Head of IT (Marius Tangen): At the same moment as you decide that this is a real breach, telephone Petter Dahl and say that it is a real breach and whether support is closed on the subject. Outside working hours the on-call developer (Erik Moen) does it. Amina Farah does it when you are away.
26. Head of IT (Marius Tangen): Write in the record whom you told and at what time.
27. Support lead (Petter Dahl): Where support is closed on the subject, switch on the standing configuration, which puts the AI support assistant into hand-over for breach cases, put the standing holding message into the support desk, and write down when you did it. Silje Haugland does it when you are away.
28. On-call developer (Erik Moen): Outside working hours, switch on the standing configuration and put the standing holding message into the support desk, and write down when it was done.
29. AI: The AI support assistant hands over to a human support person every support case that carries a sign of the breach, and answers nothing in such a case. Support lead (Petter Dahl) answers for the result. It says nothing about the breach itself, not even that it is happening. The signs are these words, in Norwegian and in English: lekkasje, leak, hacket, hacked, hack, brudd, breach, data, personopplysninger, personal data, personvern, privacy, GDPR, Datatilsynet. Two signs are added that are not words: every case that comes from a parent rather than from a teacher or a school contact, and every case that names the system the breach is in. A case with any one of these signs goes to a human. The hand-over is switched on with the standing configuration in step 27 or 28, so that it does not rest on someone guessing the right keyword in the moment. The assistant is not switched off while a breach is running: it keeps answering ordinary support cases on its own, within the AI use policy, which means that every answer it sends on its own comes from an approved help article and that a human decides any case that concerns a complaint, a contract or personal data.
30. Support lead (Petter Dahl): You may add a word or a sign to the list of signs while the case runs; write down what you added and when. Take nothing off the list while the case runs.
31. On-call developer (Erik Moen): Outside working hours you may add a word or a sign to the list of signs, and tell Petter Dahl.
32. Support lead (Petter Dahl): Decide what is done about an answer the assistant has already sent, and ask Kari Nordmann when the answer touches personal data. Silje Haugland decides when you are away.
33. On-call developer (Erik Moen): Where the breach is confirmed outside working hours, telephone Silje Haugland and Petter Dahl at home at once. Where neither answers, telephone Ingrid Solheim and tell her that support has nobody.
34. Head of people (Nora Lind): Prepare what managers may say to staff who ask, as sentences and not as a rule telling managers to improvise. Do this whether or not support is closed on the subject.
35. Managing director (Ingrid Solheim): Decide the sentences support may use within 3 hours of the report, after advice from Kari Nordmann, whose check is done inside that time. Where you are not reachable in that time, Tomas Berg decides them. Where neither is reachable, the standing holding message stays and the record says why.
36. Managing director (Ingrid Solheim): In the sentences, say that the company knows about it, that it is looking into it, who is handling it and when the person will hear more, and nothing else. Do not say how many pupils are affected, whether data was accessed, whose fault it is, or that it is probably nothing.
37. Support lead (Petter Dahl): Put the sentences support may use into the support desk within 4 hours of the report, in place of the standing holding message, so that they stand there as actual sentences and not as a rule telling support to improvise. Silje Haugland does it when you are away. Where the report came outside working hours, replace the standing holding message with them when you are next reachable.
38. Support lead (Petter Dahl): Collect every question support cannot answer and bring it to Kari Nordmann once a day, so that the answers are added, rather than five support people each inventing something.
39. Head of IT (Marius Tangen): Own the fact page and sign it off. The fact page is the one page that carries the facts of the breach, a document of its own and part of the record. Write it in the office suite, in the folder you made for the case; the record names it and lies beside it. When you are away Amina Farah owns it and Jonas Vikane signs it off. Outside working hours the on-call developer (Erik Moen) starts it with what is known in the first hours, and Marius Tangen or Amina Farah takes it over.
40. Head of IT (Marius Tangen): Ask the person responsible for every system your record names as possibly touched for the facts in that system, within 2 hours of the report, and ask a further one as soon as a new system turns out to be touched. Amina Farah asks when you are away, and outside working hours the on-call developer (Erik Moen) asks for you. Write in the record whom you asked and when.
41. The person responsible for each affected system: Establish in that system the categories of data touched, whose data and how many people, the time window and what the logs of that system show. Give that to Marius Tangen within 12 hours of being asked, so that the fact page can be finished within 24 hours of the report. Give nothing about any individual beyond those facts. The person responsible is lead developer Amina Farah for the reading app and Nordsky Cloud, head of finance Tomas Berg for the payroll system, head of people Nora Lind for the hiring system, head of customer success Silje Haugland for the support desk, support lead Petter Dahl for the AI support assistant, and head of IT Marius Tangen for the office suite and the contract archive. Where that person is away, the person who steps in for them under `Who does what` does it.
42. Head of finance (Tomas Berg): For the payroll system, give the categories of data touched, the number of employees affected and what the logs of the payroll system show. Name absence and sick leave only as the categories absence and sick leave, with nothing about any individual's health, diagnosis, reason for absence or dates of absence. The same limit binds everyone who gives facts about a system and whoever writes the fact page. Where Kari Nordmann needs more than that to judge the risk or to write a notification or a message, she asks you for exactly what she needs, says in the record why she needed it, and it goes no further than the people who must see it.
43. Head of IT (Marius Tangen): Write on the fact page, within 24 hours of the report, on one page and not in a thread:
    - what data and which categories, and how sensitive they are: a read-aloud recording of a child's voice is worse than a reading level;
    - which people and how many, and which school owners they belong to;
    - for each kind of data, whether the company is the controller or the processor, so that no reader sees pupil data first, goes into processor mode and forgets that the teachers are the company's own;
    - the window, from when to when the data was exposed;
    - whether anyone actually accessed it, which means what the Nordsky Cloud logs show; where the logs cannot tell, that it cannot be ruled out and that it is treated as accessed;
    - the likely consequence of the breach for every kind of person affected, so for pupils, teachers, school contacts, employees and job applicants;
    - what the company has already done to stop it.
44. Data protection officer (Kari Nordmann): Judge, for every kind of person affected separately, whether the breach is unlikely to result in a risk for them, is likely to result in a risk for them, or is likely to result in a high risk for them. Write that on the fact page as a sentence with the reason in one or two sentences, after asking Marius Tangen what the systems show and Amina Farah what the data is. Henrik Aas of Aas & Wold judges it when you are away. Ingrid Solheim does not change that judgement; she decides what is done about it.
45. Head of IT (Marius Tangen): Where something cannot be established, including the consequence for a kind of person affected or the level of risk, write on the fact page that it is not established and why, rather than leaving it blank, and handle the case as a high risk until it is established.
46. Data protection officer (Kari Nordmann): Say when you have what you need for your advice. The fact page is not finished until you say so.
47. Data protection officer (Kari Nordmann): Where the breach touches both pupil data, where the company is the processor, and data the company controls, keep one list of duties for the case: on the pupil side, tell the affected school owners within 24 hours and they notify Datatilsynet; on the controller side, the company notifies Datatilsynet itself within 72 hours and decides whether the people affected are told. The deadline that binds the case is the earliest one on the list. Do not split the case in two: that would mean two people each believing the other had told Datatilsynet.
48. Managing director (Ingrid Solheim): Steps 48 to 50 are for a breach of pupil data in the reading app, where the company is the processor. Decide whether the affected school owners are told and what the message says, after advice from Kari Nordmann and after asking Silje Haugland how the school owners are reached. The affected school owners are told, and that is not a choice: the school owner is the controller for its own pupils and its own 72 hours to Datatilsynet start when the company tells it. Your decision is only about what the message says and how the school owners are reached. Tomas Berg decides when you are away. Kari Nordmann writes the part of the message that describes the data.
49. Head of customer success (Silje Haugland): Send one message per affected school owner, addressed to that school owner alone, to its school contact, and send them all at the same time, without undue delay and at the latest 24 hours after the company became aware. No school contact sees the address of another, and no school owner is told before another.
50. Head of customer success (Silje Haugland): In the message say what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. Tell the affected school owners before the company notifies Datatilsynet.
51. Managing director (Ingrid Solheim): Steps 51 to 55 are for a breach of data the company controls. Decide whether Datatilsynet is notified, at the latest 48 hours after the report, after advice from Kari Nordmann and after asking Marius Tangen what happened in the systems. Tomas Berg decides when you are away.
52. Managing director (Ingrid Solheim): Notify Datatilsynet unless the fact page shows that the breach is unlikely to result in a risk to the rights and freedoms of the people affected, which is the only ground for not notifying. Where the fact page cannot establish the risk, notify. The decision is about that one question and nothing else.
53. Data protection officer (Kari Nordmann): Where Ingrid Solheim decided that Datatilsynet is notified, write the notification from the fact page. Marius Tangen reads it first for whether the technical description is actually true. Ingrid Solheim approves it before it is sent, and nobody else needs to. Henrik Aas of Aas & Wold writes it when you are away, and Ingrid Solheim still approves it.
54. Data protection officer (Kari Nordmann): In the notification, say:
    - what happened, as the nature of the breach, with the categories of personal data, the categories and approximate number of the people affected and the approximate number of records concerned;
    - your name and contact details as the data protection officer, and those of Henrik Aas of Aas & Wold where he is standing in and is the one who sends it;
    - the likely consequences of the breach;
    - the measures the company has taken or proposes to take, including what it has done to limit the harm.
    Where it is sent later than 72 hours after the company became aware, say why. Where something is not yet established, say so.
55. Data protection officer (Kari Nordmann): Send the notification through Datatilsynet's own reporting form, without undue delay and at the latest 72 hours after the company became aware. Send it the moment the fact page carries enough to send it: the 72 hours is the outer limit and not a waiting time. Henrik Aas of Aas & Wold sends it when you are away. Where the company later learns something that changes the picture, or something that was not established becomes established, send a supplementary notification without asking Ingrid Solheim again. Put the sent notification, the time it was sent and the receipt from Datatilsynet in the record.
56. Managing director (Ingrid Solheim): Decide whether the people affected are told, after advice from Kari Nordmann. Tomas Berg decides when you are away. Where the fact page shows that the breach is likely to result in a high risk for any kind of person affected, those people are told, and the decision is only about the wording and how they are reached.
57. Head of customer success (Silje Haugland): Tell the pupils of the reading app by telling their school owner, which step 49 already does within 24 hours: for them the company is the processor. The school owner decides whether the parents are told.
58. Head of customer success (Silje Haugland) and head of people (Nora Lind): Where Ingrid Solheim decided that the people affected are told, Silje Haugland tells the affected teachers and school contacts, and Nora Lind tells the affected employees and job applicants. Kari Nordmann writes the part of the message that describes the data and what the person can do, in every case.
59. Head of customer success (Silje Haugland) and head of people (Nora Lind): Send the message without undue delay, within 24 hours of Ingrid Solheim's decision and at the latest 72 hours after the fact page shows the high risk.
60. Head of customer success (Silje Haugland) and head of people (Nora Lind): In the message you send, say in clear and plain language:
    - what happened, as the nature of the breach;
    - the name and contact details of Kari Nordmann as the data protection officer, and those of Henrik Aas of Aas & Wold when she is away;
    - the likely consequences of the breach for that person;
    - the measures the company has taken or proposes to take, including what it has done to limit the harm;
    - the description of the data and what the person can do, which Kari Nordmann writes.
    The message holds no personal data of anyone other than the person it is sent to, carries the date it was sent, and goes to each person separately. Kari Nordmann checks that these things are in it before it goes out.
61. Head of IT (Marius Tangen): Write the list of the measures that stop the breach happening again. You answer for it to Ingrid Solheim. Give each measure one named person: usually Amina Farah for anything in the reading app or Nordsky Cloud, Petter Dahl for anything in support or the AI support assistant, and Nora Lind for anything about employees. Have the list, with one named person per measure, ready before the case is closed.
62. Managing director (Ingrid Solheim): Close the case, after Kari Nordmann says the record is complete, with the six things of step 63 in place and no earlier than the 72 hours of step 64 allow. Tomas Berg closes it when you are away. Marius Tangen cannot close his own case, and Kari Nordmann cannot close it alone.
63. Managing director (Ingrid Solheim): Before the case can be closed, have these six things in place:
    - get Marius Tangen's word in writing that the breach is stopped;
    - the fact page is final, including the parts that could not be established, written as not established rather than left blank;
    - the decision on Datatilsynet is in the record with its reason and the name of the person who took it, whether the answer was yes or no, and the notification is sent where it was yes;
    - every affected school owner has been told, and every affected teacher, school contact, employee and job applicant the company decided to tell;
    - the list of measures exists with one named person per measure;
    - the secured logs are stored where Kari Nordmann can find them again.
64. Managing director (Ingrid Solheim): Do not close the case inside 72 hours of the report, even where everything is done, because that is roughly how long it takes for the thing the company missed to show up.
65. Head of IT (Marius Tangen): Set the date on each measure within 2 weeks of the case being closed, and leave no date open.
66. The named person on each measure: Have your measure in place within 30 days of the case being closed where it could let the same breach happen again, and within 90 days of the case being closed otherwise. Marius Tangen closes the measures.
67. Data protection officer (Kari Nordmann): Check the list of measures at your six-monthly review of the record of processing activities, the list of every processing activity the company carries out that you keep, and tell Ingrid Solheim what is overdue. An overdue measure goes on the agenda of the Monday leadership meeting until it is done.
68. Head of IT (Marius Tangen): Delete the secured copies of the Nordsky Cloud access logs 12 months after the day the case is closed. Keep them longer only while a case about the breach with Datatilsynet, with a school owner or before a court is still open, and then until that case ends, and say in the record why they were kept longer.

## Who must be told

Inside the company:

- Head of IT Marius Tangen tells Kari Nordmann, or Henrik Aas of Aas & Wold on the days she does not work and at weekends, and Ingrid Solheim, within 4 hours of the report.
- At the same time he tells Nora Lind whenever the payroll system, the hiring system or employee or applicant data in the office suite is touched, and Silje Haugland whenever pupil, teacher or school contact data is touched.
- At the moment he confirms a real breach, he telephones Petter Dahl and says that it is a real breach and whether support is closed on the subject. Outside working hours the on-call developer (Erik Moen) does it, and also telephones Silje Haugland and Petter Dahl at home at once, and telephones Ingrid Solheim where neither of them answers.
- Jonas Vikane and Silje Haugland are told the moment the reading app or a part of it goes offline, and when it goes back. Marius Tangen tells them.
- Kari Nordmann tells Ingrid Solheim which measures are overdue.

Outside the company:

- The affected school owners, for a breach of pupil data in the reading app where the company is the processor: told by Silje Haugland, one message each, all sent at the same time, without undue delay and at the latest 24 hours after the company became aware, and before the company notifies Datatilsynet. The school owner then notifies Datatilsynet about its own pupils and decides whether the parents are told.
- Datatilsynet, for a breach of data the company controls: notified by Kari Nordmann, or by Henrik Aas of Aas & Wold when she is away, after Ingrid Solheim has decided and approved it, without undue delay and at the latest 72 hours after the company became aware. It is notified in every case unless the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected. A supplementary notification follows where something was not yet established or the picture changes.
- The teachers, school contacts, employees and job applicants affected, where the company is the controller: told by Silje Haugland for teachers and school contacts and by Nora Lind for employees and job applicants, after Ingrid Solheim has decided, without undue delay, within 24 hours of that decision and at the latest 72 hours after the fact page shows the high risk. Where the fact page shows a high risk for a kind of person affected, those people are told.
- The person who reported the breach from outside the company: answered by Marius Tangen within 1 hour of the report, and the answer says the four things of step 5 about the record.

## When to hand over

- Where Marius Tangen cannot be reached with a report, the on-call developer (Erik Moen) takes it and wakes him. Where he cannot do the first hour's steps, Amina Farah does them, and outside working hours the on-call developer does what the role can do and reaches him or Amina Farah for the rest.
- Where the on-call developer cannot take a decision the role does not hold, it goes to Marius Tangen, and to Amina Farah when he is away.
- Where Kari Nordmann is away, on the days she does not work and at weekends, the case, the advice, the decision whether a case is a breach, the judgement of the risk and the notification go to Henrik Aas of Aas & Wold on the firm's emergency number.
- Where Ingrid Solheim is away or is not reachable within the time a decision has to be taken, Tomas Berg decides in her place. Where neither is reachable in time for the sentences support may use, the standing holding message stays and the record says why.
- Where neither Silje Haugland nor Petter Dahl answers the telephone at home, the on-call developer (Erik Moen) telephones Ingrid Solheim and tells her that support has nobody.
- Where fewer than two of the support team are reachable in working hours, Petter Dahl answers the queue himself, and Silje Haugland steps in for him when he is away.
- A question support cannot answer goes to Petter Dahl, who brings it to Kari Nordmann once a day.
- An overdue measure goes on the agenda of the Monday leadership meeting until it is done.

## What to record

One breach, one record: one document per case, written while it happens and not reconstructed a month later. Keep a record for every case, including the ones the company decides not to notify and the ones that turn out not to be a breach at all. Kari Nordmann keeps the record with the record of processing activities in her folder in the office suite, and it lies beside the fact page in the folder Marius Tangen makes for the case. Keep the record five years from the day the case is closed.

The record holds:

- When the breach was reported and by whom, what they said, and that Marius Tangen took the case. Where the person who reported it is outside the company and asked not to be named: what of their identity the record holds, as Kari Nordmann decided it, and that decision.
- The timeline, with real timestamps.
- Which systems the first hour named as possibly touched, whom Marius Tangen asked for the facts and when, and whom he told and at what time.
- What data and whose, and how many people.
- What was done to stop the breach, what was not done and why.
- What the Nordsky Cloud logs showed; where the secured copy is kept, that it holds personal data and that Marius Tangen set the rights on the folder; any further access and Kari Nordmann's agreement to it; and, where the copy is kept longer than 12 months after the case is closed, why.
- The fact page, which the record names and lies beside.
- Who was told and when.
- Every message that went out about the breach, with the time it was sent and who sent it: the message to each affected school owner, the message to each affected teacher, school contact, employee and job applicant, the notification to Datatilsynet with the time it was sent and the receipt from Datatilsynet, and the sentences support used. Where the same wording went to many people, hold that wording once, how many people it went to, which kinds of person they were and the time it was sent, and not a copy per person.
- The decision whether Datatilsynet is notified, with the reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision whether the people affected are told, with the reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision that a case is not a personal data breach, written by Kari Nordmann with her name, the reason and the time.
- The list of measures, with one named person and a date per measure, and what was changed afterwards so that the same breach does not happen again.
- Why Kari Nordmann needed more than the categories of absence and sick leave, where she did.
- When the standing configuration was switched on and the standing holding message put in, what Petter Dahl or the on-call developer added to the list of hand-over signs and when, and the questions and answers of `If something does not fit`.

## If something does not fit

A question this document does not answer goes to data protection officer Kari Nordmann on the three days she works, and to Henrik Aas of Aas & Wold on the firm's emergency number on the other days and at weekends.

Three kinds of question go elsewhere first:

- Anything about the systems, including how long the reading app stays offline and when it goes back, is decided by head of IT Marius Tangen, and by lead developer Amina Farah when he is away.
- Anything about an answer the AI support assistant has already sent is decided by support lead Petter Dahl, who asks Kari Nordmann when the answer touches personal data, and by head of customer success Silje Haugland when he is away.
- A question nobody above can answer goes to managing director Ingrid Solheim, and to head of finance Tomas Berg when she is away.

Write every such question and the answer given in the record.
