# Specification: Handle a personal data breach

## Trigger

Status: decided

The process starts on a confirmed personal data breach and on a suspicion that personal data may have been exposed. An unexplained access in the Nordsky Cloud access logs, a bug report that one teacher could see another school's pupils, a lost laptop and a phishing click by an employee each start it. The company would rather run the process ten times too often than once too late, because the 72 hours start when the company became aware and aware is earlier than certain. The process itself decides early whether it is a real breach, and where it is not, the case is closed with a line in the record and that is the end of it.

Every report ends up in the same place, with head of IT Marius Tangen, and the clock starts when the report reaches the company, not when someone gets round to reading it. A report reaches him in these ways:

- An employee reports a suspected security incident to the head of IT the same day, as the information security policy requires.
- A support person who sees a case from a teacher or a school contact that may be a breach telephones Marius Tangen the same hour and does not reclassify the case as a normal bug.
- Nordsky AS, for Nordsky Cloud, reports to the head of IT by email and telephone within 24 hours of becoming aware.
- Hjelpedesk AS, for the support desk, reports within 48 hours of becoming aware.
- Lønn Norge AS, for the payroll system, reports to head of finance Tomas Berg within 24 hours of becoming aware, and he brings it to Marius Tangen.
- Aas & Wold, for a breach of its own while standing in for the data protection officer, reports within 24 hours of becoming aware.
- Rekrutt AS, for the hiring system, reports to the company without undue delay; the agreement sets no fixed number of hours.
- Anthropic, for the AI support assistant, notifies the company without undue delay; the agreement sets no fixed number of hours.
- Microsoft, for the office suite, notifies the company without undue delay through the tenant administrator, who is Marius Tangen; the addendum sets no fixed number of hours.
- Someone outside the company, such as a parent, a researcher, a teacher or a school contact, writes to the general address or to the managing director; whoever receives it forwards it to Marius Tangen and telephones him.

Where Marius Tangen cannot be reached, the on-call developer takes the report and wakes him.

## Scope

Status: decided

The process covers a personal data breach of all personal data in all the company's systems: the reading app, Nordsky Cloud, the support desk, the AI support assistant, the payroll system, the hiring system, the office suite and the contract archive. It is one process, not one per system.

Pupil data is special in two ways and the process shows it: the pupils are children, and for the pupil data in the reading app the company is the data processor while the 310 school owners are the controllers, so the company tells the school owner and the school owner notifies Datatilsynet. For teacher data, school contact data, support desk data, employee data and applicant data the company is the controller itself and notifies Datatilsynet directly. The person reading the process must be able to see within the first minutes which of the two situations they are in, because the rest of it differs.

Where one breach touches both pupil data and data the company controls, as a breach in Nordsky Cloud would, it is handled as one case, with one record and one timeline, and both duties run at the same time.

The process leaves out what the school owner decides for its own pupils: whether Datatilsynet is notified about them and whether the parents are told.

## Roles

Status: decided

- Head of IT, Marius Tangen. Takes every report, secures the logs, stops the breach, gives the technical judgement whether it is a real breach, tells the others, owns and signs off the fact page, owns the list of measures, and is reachable on his mobile around the clock. Lead developer Amina Farah steps in when he is away.
- Data protection officer, Kari Nordmann. Decides whether a reported case is not a breach, judges and writes the risk for every kind of person affected, advises on every decision of the process, writes and sends the notification to Datatilsynet, writes the part of every message that describes the data and what the person can do, keeps the record, and says when the record is complete. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of the external firm Aas & Wold steps in on the other days and at weekends, on the firm's emergency number.
- Managing director, Ingrid Solheim. Decides whether Datatilsynet is notified, whether the school owners are told and what the message says, whether the people affected are told, the sentences support may use, and when the case is closed. Reachable on her mobile around the clock. Head of finance Tomas Berg steps in when she is away.
- Lead developer, Amina Farah. Does the work in the reading app and in Nordsky Cloud that fills the fact page, and steps in for the head of IT. Head of product Jonas Vikane steps in when she is away and signs off the fact page when she owns it.
- Head of customer success, Silje Haugland. Is asked how the school owners are reached, sends the message to each affected school owner, tells the affected teachers and school contacts, establishes the facts in the support desk, and is told at once when the reading app or a part of it goes offline and when it goes back. Support lead Petter Dahl steps in when she is away. Reachable in working hours only.
- Support lead, Petter Dahl. Prepares and reviews the standing configuration and the standing holding message, switches the AI support assistant into hand-over for breach cases, puts the standing holding message and then the sentences support may use into the support desk, owns the list of hand-over signs, establishes the facts in the AI support assistant, collects the questions support cannot answer, and decides what is done about an answer the assistant has already sent. Silje Haugland steps in when he is away. Reachable in working hours only.
- On-call developer, one of the eight developers of the two development teams on a weekly rota that Amina Farah sets a month ahead and keeps in the staff handbook, reachable around the clock on the on-call telephone number in the staff handbook. The week beginning 23 November 2026 is held by Erik Moen, with Lise Berntsen as the stand-in for that week. Outside working hours the role takes the report, does what it can in Nordsky Cloud to stop the breach, switches on the standing configuration and puts the standing holding message in, telephones Silje Haugland and Petter Dahl at home, asks the people responsible for the systems, starts the fact page, and reaches Marius Tangen or Amina Farah for anything it cannot decide.
- Head of people, Nora Lind. Establishes the facts in the hiring system, tells the affected employees and job applicants, and prepares what managers may say to staff who ask. Ingrid Solheim steps in when she is away.
- Head of finance, Tomas Berg. Establishes the facts in the payroll system, and steps in for the managing director. Ingrid Solheim steps in when he is away.
- Head of product, Jonas Vikane. Is told at once when the reading app or a part of it goes offline and when it goes back, and signs off the fact page when Amina Farah owns it. Amina Farah steps in when he is away.
- Support team, the five people who answer teachers and school owners in the support desk: Hanne Riise, Jostein Vold, Maja Eriksen, Sondre Lie and Thea Nygård. While a breach is running they answer only with the sentences that stand in the support desk and bring every question they cannot answer to Petter Dahl. When fewer than two of them are reachable in working hours, Petter Dahl answers the queue himself.
- AI support assistant, Claude from Anthropic inside the support desk. Hands over every support case that carries a sign of the breach and says nothing about the breach.

## Steps

Status: decided

Steps 1 to 3 are done in advance, before any breach. A report that has just arrived starts at step 4.

1. Petter Dahl prepares the standing configuration that puts the AI support assistant into hand-over for breach cases, so that nobody has to write it at midnight.
2. Petter Dahl prepares the standing holding message for the support desk. Ingrid Solheim and Kari Nordmann approve it and the standing configuration in advance, as part of this process and not during an incident.
3. Petter Dahl reviews the standing configuration and the standing holding message every six months.

The report

4. Whoever receives a report of a breach or a suspicion of one forwards it to Marius Tangen and telephones him. A support person who sees such a case telephones him the same hour. Where he cannot be reached, the on-call developer takes the report and wakes him.
5. Marius Tangen answers the person who reported it, so that they know the case is held and by whom. Where that person is outside the company, the answer says in plain language that their name and what they wrote are written in the record of the case; that this is because the company must be able to show how it handled the breach, which the GDPR requires of it; that the record is kept five years from the day the case is closed and is then deleted; and that Kari Nordmann is the data protection officer they can ask about this, with her contact details, and Henrik Aas of Aas & Wold when she is away. Where the person asks not to be named, their report is still recorded and Kari Nordmann decides what of their identity the record holds and writes that decision in the record.
6. Marius Tangen opens the record of the case, the one document for this breach that is written while it happens and is kept as the section Records says, and writes in it the time the report reached the company, who reported it, what they said and that he has taken the case.
7. Marius Tangen decides from what he has whether the breach may still be running, and where it may be he goes at once to securing the logs and stopping it.
8. Marius Tangen writes in the record which systems may be touched, so that the people responsible for them can be asked.
9. Where Marius Tangen cannot do steps 5 to 8 within 1 hour of the report, Amina Farah does them, or outside working hours the on-call developer does what the role can do and reaches him or Amina Farah for the rest.

Secure the logs

10. Marius Tangen exports and copies the Nordsky Cloud access logs out of the normal 90-day retention within 4 hours of the report, before anything is fixed in production and before anything is deleted, because the logs roll over and evidence has been lost that way before.
11. Marius Tangen makes a folder for the case in the office suite.
12. Marius Tangen puts the secured copy of the logs in that folder. The copy is never sent by email, never printed and never put on a private device, a private account or a memory stick.
13. Marius Tangen gives the right to open the folder to five people and no others: himself, Amina Farah, Kari Nordmann, Henrik Aas of Aas & Wold while he stands in for Kari Nordmann, and Ingrid Solheim. Nobody else is given access without Kari Nordmann's agreement.
14. Marius Tangen writes in the record that he made the folder and set those rights, where the logs are kept and that they hold personal data. Where someone else is given access, Kari Nordmann's agreement goes into the record too.

Stop the breach

15. Marius Tangen decides which of closing the access, revoking the token and locking the account fit this breach, and every one that fits is done, within 4 hours of the report. Amina Farah decides when Marius Tangen is away. Outside working hours the on-call developer does at once, without waiting for that decision, every one of the three that the role can do in Nordsky Cloud, and then tells Marius Tangen what was done and when; Marius Tangen decides about anything the role cannot do.
16. Marius Tangen takes the reading app or a part of it offline only where there is no narrower way that stops the breach within 4 hours of the report, because that stops teaching in 310 schools. Amina Farah decides when Marius Tangen is away. Jonas Vikane and Silje Haugland are told the moment it happens.
17. Marius Tangen writes in the record what was done to stop the breach, what was not done and why.
18. Nobody deletes anything, nobody fixes the bug in production before the logs are secured, and nobody emails the school owners before Kari Nordmann has looked at the case.

Is it a real breach

19. Marius Tangen gives his technical judgement whether this is a real personal data breach. He may not close a case even where it looks obvious to him.
20. Kari Nordmann decides whether a reported case is not a personal data breach, and she must agree before it is closed. She writes the line in the record herself, with her name, the reason and the time, so that there is a name on it if Datatilsynet ever asks. Henrik Aas of Aas & Wold decides when Kari Nordmann is away.
21. Marius Tangen tells Kari Nordmann and Ingrid Solheim about the case within 4 hours of the report. On the days Kari Nordmann does not work and at weekends he tells Henrik Aas of Aas & Wold on the firm's emergency number instead, rather than letting the case wait.
22. At the same time Marius Tangen tells Nora Lind, whenever the breach touches the payroll system, the hiring system or employee or applicant data in the office suite, and Silje Haugland, whenever it touches pupil, teacher or school contact data. He does not wait for anyone to think of them.
23. At the same moment as he decides that this is a real breach, Marius Tangen telephones Petter Dahl and says that it is a real breach and whether support is closed on the subject. Outside working hours the on-call developer does it. Amina Farah does it when Marius Tangen is away.
24. Marius Tangen writes in the record whom he told and at what time.

Close support on the subject

25. Marius Tangen decides, when he confirms the breach, whether support is closed on the subject. It is closed where pupils, teachers, school owners or school contacts are affected, or where the breach is likely to become publicly known. Where he is unsure, it is closed, because the cost of an unnecessary holding message is far lower than the cost of a support person improvising.
26. Where support is closed on the subject, Petter Dahl switches on the standing configuration, which puts the AI support assistant into hand-over for breach cases, and puts the standing holding message into the support desk, and writes down when he did it. Silje Haugland does it when Petter Dahl is away.
27. Outside working hours the on-call developer switches on the standing configuration and puts the standing holding message into the support desk, and writes down when it was done.
28. Where the breach is confirmed outside working hours, the on-call developer telephones Silje Haugland and Petter Dahl at home at once. Where neither answers, the on-call developer telephones Ingrid Solheim and tells her that support has nobody.
29. Where support is not closed on the subject, as for a breach of the payroll system or the hiring system that affects no pupil, teacher, school owner or school contact and is not likely to become publicly known, the AI support assistant and the support desk are left as they are, steps 26 to 33 fall away and the case goes on with the fact page. Nora Lind prepares what managers may say to staff who ask, as sentences and not as a rule telling managers to improvise.

The sentences support may use

30. Ingrid Solheim decides the sentences support may use within 3 hours of the report, after advice from Kari Nordmann, whose check is done inside that time. Where Ingrid Solheim is not reachable in that time, Tomas Berg decides them. Where neither is reachable, the standing holding message stays and the record says why.
31. The sentences say that the company knows about it, that it is looking into it, who is handling it and when the person will hear more, and nothing else. They do not say how many pupils are affected, whether data was accessed, whose fault it is, or that it is probably nothing.
32. Petter Dahl puts the sentences support may use into the support desk within 4 hours of the report, in place of the standing holding message, so that they stand there as actual sentences and not as a rule telling support to improvise. Silje Haugland does it when he is away. Where the report came outside working hours, Petter Dahl replaces the standing holding message with them when he is next reachable.
33. Petter Dahl collects every question support cannot answer and brings it to Kari Nordmann once a day, so that the answers are added, rather than five support people each inventing something.

The fact page

34. Marius Tangen owns the fact page and signs it off. The fact page is the one page that carries the facts of the breach, a document of its own and part of the record; he writes it in the office suite, in the folder he made for the case, and the record names it and lies beside it. When he is away Amina Farah owns it and Jonas Vikane signs it off. Outside working hours the on-call developer starts it with what is known in the first hours, and Marius Tangen or Amina Farah takes it over.
35. Marius Tangen asks the person responsible for every system his record names as possibly touched for the facts in that system, within 2 hours of the report, and asks a further one as soon as a new system turns out to be touched. Amina Farah asks when he is away, and outside working hours the on-call developer asks for him. Whom he asked and when goes into the record.
36. The person responsible for each affected system establishes in it the categories of data touched, whose data and how many people, the time window and what the logs of that system show, and gives that to Marius Tangen within 12 hours of being asked, so that the fact page can be finished within 24 hours of the report. They give nothing about any individual beyond those facts. The person responsible is Amina Farah for the reading app and Nordsky Cloud, Tomas Berg for the payroll system, Nora Lind for the hiring system, Silje Haugland for the support desk, Petter Dahl for the AI support assistant, and Marius Tangen for the office suite and the contract archive. Where that person is away, the person who steps in for them in the section Roles does it.
37. For the payroll system, Tomas Berg gives the categories of data touched, the number of employees affected and what the logs of the payroll system show, and names absence and sick leave only as the categories absence and sick leave, with nothing about any individual's health, diagnosis, reason for absence or dates of absence. The same limit binds everyone who gives facts about a system and whoever writes the fact page. Where Kari Nordmann needs more than that to judge the risk or to write a notification or a message, she asks Tomas Berg for exactly what she needs, says in the record why she needed it, and it goes no further than the people who must see it.
38. Marius Tangen writes on the fact page, within 24 hours of the report, and on one page and not in a thread: what data and which categories, and how sensitive they are, a read-aloud recording of a child's voice being worse than a reading level; which people and how many, and which school owners they belong to; for each kind of data whether the company is the controller or the processor, so that no reader sees pupil data first, goes into processor mode and forgets that the teachers are the company's own; the window, from when to when the data was exposed; whether anyone actually accessed it, which means what the Nordsky Cloud logs show, and where the logs cannot tell, that it cannot be ruled out and that it is treated as accessed; the likely consequence of the breach for every kind of person affected, so for pupils, teachers, school contacts, employees and job applicants; and what the company has already done to stop it.
39. Kari Nordmann judges, for every kind of person affected separately, whether the breach is unlikely to result in a risk for them, is likely to result in a risk for them, or is likely to result in a high risk for them, and writes that on the fact page as a sentence with the reason in one or two sentences, after asking Marius Tangen what the systems show and Amina Farah what the data is. Henrik Aas of Aas & Wold judges it when Kari Nordmann is away. Ingrid Solheim does not change that judgement; she decides what is done about it.
40. Where something cannot be established, including the consequence for a kind of person affected or the level of risk, the fact page says that it is not established and why, rather than leaving it blank, and the case is handled as a high risk until it is established.
41. The fact page is not finished until Kari Nordmann says she has what she needs for her advice.
42. Where the breach touches both pupil data, where the company is the processor, and data the company controls, Kari Nordmann keeps one list of duties for the case: on the pupil side, tell the affected school owners within 24 hours and they notify Datatilsynet; on the controller side, the company notifies Datatilsynet itself within 72 hours and decides whether the people affected are told. The deadline that binds the case is the earliest one on the list. The case is not split in two, because that would mean two people each believing the other had told Datatilsynet.

Tell the school owners

43. Steps 43 to 45 are for a breach of pupil data in the reading app, where the company is the processor. Ingrid Solheim decides whether the affected school owners are told and what the message says, after advice from Kari Nordmann and after asking Silje Haugland how the school owners are reached. Tomas Berg decides when Ingrid Solheim is away. Kari Nordmann writes the part of the message that describes the data.
44. Silje Haugland sends one message per affected school owner, addressed to that school owner alone, to its school contact, and sends them all at the same time, within 24 hours of the company becoming aware. No school contact sees the address of another, and no school owner is told before another. A school owner is the municipality or the private body that subscribes to the reading app and is the controller for its own pupils, and is an organisation and not a person; a school contact is the person at that school owner whose name, work email address, telephone number and school are in the support desk as the one the company writes to and who signs for the school owner; a teacher is a person who uses the reading app to follow their pupils' reading, and is not a school contact unless they are also named as one.
45. The message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. The affected school owners are told before the company notifies Datatilsynet, and that is not a choice: the school owner is the controller for its own pupils and its own 72 hours to Datatilsynet start when the company tells it.

Notify Datatilsynet

46. Steps 46 to 50 are for a breach of data the company controls. Ingrid Solheim decides whether Datatilsynet, the Norwegian data protection authority, is notified, at the latest 48 hours after the report, after advice from Kari Nordmann and after asking Marius Tangen what happened in the systems. Tomas Berg decides when Ingrid Solheim is away.
47. Datatilsynet is notified in every case. The only ground for not notifying is that the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected. Where the fact page cannot establish the risk, the breach is notified. The decision is about that one question and nothing else.
48. Kari Nordmann writes the notification from the fact page. Marius Tangen reads it first for whether the technical description is actually true. Ingrid Solheim approves it before it is sent and nobody else needs to. Henrik Aas of Aas & Wold writes it when Kari Nordmann is away, and Ingrid Solheim still approves it.
49. The notification says what happened, as the nature of the breach, with the categories of personal data, the categories and approximate number of the people affected and the approximate number of records concerned; the name and contact details of Kari Nordmann as the data protection officer, and of Henrik Aas of Aas & Wold where he is standing in and is the one who sends it; the likely consequences of the breach; and the measures the company has taken or proposes to take, including what it has done to limit the harm. Where it is sent later than 72 hours after the company became aware, it says why. Where something is not yet established it says so.
50. Kari Nordmann sends the notification through Datatilsynet's own reporting form, without undue delay and at the latest 72 hours after the company became aware; it goes the moment the fact page carries enough to send it, and the 72 hours is the outer limit and not a waiting time. Henrik Aas of Aas & Wold sends it when she is away. Where the company later learns something that changes the picture, or something that was not established becomes established, Kari Nordmann sends a supplementary notification without asking Ingrid Solheim again. The sent notification, the time it was sent and the receipt from Datatilsynet go into the record.

Tell the people affected

51. Ingrid Solheim decides whether the people affected are told, after advice from Kari Nordmann. Tomas Berg decides when she is away. Where the fact page shows that the breach is likely to result in a high risk for any kind of person affected, those people are told, and the decision is only about the wording and how they are reached.
52. For the pupils of the reading app the company is the processor, so telling them means telling their school owner, which step 44 already does within 24 hours, and the school owner decides whether the parents are told.
53. Silje Haugland tells the affected teachers and school contacts. Nora Lind tells the affected employees and job applicants. Kari Nordmann writes the part of the message that describes the data and what the person can do, in every case.
54. The message goes out without undue delay, within 24 hours of Ingrid Solheim's decision and at the latest 72 hours after the fact page shows the high risk.
55. The message says, in clear and plain language: what happened, as the nature of the breach; the name and contact details of Kari Nordmann as the data protection officer, and of Henrik Aas of Aas & Wold when she is away; the likely consequences of the breach for that person; the measures the company has taken or proposes to take, including what it has done to limit the harm; and the description of the data and what the person can do. It holds no personal data of anyone other than the person it is sent to, carries the date it was sent, and goes to each person separately. Kari Nordmann checks that these things are in it before it goes out.

The measures and closing the case

56. Marius Tangen writes the list of the measures that stop the breach happening again and is answerable for it to Ingrid Solheim. Each measure gets one named person: usually Amina Farah for anything in the reading app or Nordsky Cloud, Petter Dahl for anything in support or the AI support assistant, and Nora Lind for anything about employees. The list, with one named person per measure, exists before the case is closed.
57. Ingrid Solheim closes the case, after Kari Nordmann says the record is complete. Tomas Berg closes it when Ingrid Solheim is away. Marius Tangen cannot close his own case and Kari Nordmann cannot close it alone.
58. Before the case can be closed, six things are in place: the breach is stopped and Marius Tangen has said so in writing; the fact page is final, including the parts that could not be established, written as not established rather than left blank; the decision on Datatilsynet is in the record with its reason and the name of the person who took it, whether the answer was yes or no, and the notification is sent where it was yes; every affected school owner has been told, and every affected teacher, school contact, employee and job applicant the company decided to tell; the list of measures exists with one named person per measure; and the secured logs are stored where Kari Nordmann can find them again.
59. The case is not closed inside 72 hours of the report even where everything is done, because that is roughly how long it takes for the thing the company missed to show up.
60. Marius Tangen sets the date on each measure within 2 weeks of the case being closed, and no date is left open.
61. The named person has their measure in place within 30 days of the case being closed where it could let the same breach happen again, and within 90 days of the case being closed otherwise. Marius Tangen closes the measures.
62. Kari Nordmann checks the list of measures at her six-monthly review of the record of processing activities, the list of every processing activity the company carries out that she keeps, and tells Ingrid Solheim what is overdue. An overdue measure goes on the agenda of the Monday leadership meeting until it is done.
63. Marius Tangen deletes the secured copies of the Nordsky Cloud access logs 12 months after the day the case is closed. They are kept longer only while a case about the breach with Datatilsynet, with a school owner or before a court is still open, and then until that case ends, and the record says why they were kept longer.

## AI steps

Status: decided

The AI support assistant does one step of this process, and every other step is done by a person. The assistant is not switched off while a breach is running, because that would bury the support team on the worst day of the year: it keeps answering ordinary support cases on its own, within the AI use policy, which means that every answer it sends on its own comes from an approved help article and that a human decides any case that concerns a complaint, a contract or personal data.

Its step is to hand over to a human support person every support case that carries a sign of the breach, and to answer nothing in such a case. It says nothing about the breach itself, not even to say that it is happening. The signs are the words it looks for, in Norwegian and in English: lekkasje, leak, hacket, hacked, hack, brudd, breach, data, personopplysninger, personal data, personvern, privacy, GDPR, Datatilsynet. To them are added two signs that are not words: every case that comes from a parent rather than from a teacher or a school contact, and every case that names the system the breach is in. A case with any one of these signs goes to a human, and the hand-over is switched on with the standing configuration in step 26 or 27, so that it does not rest on someone guessing the right keyword in the moment.

Petter Dahl may add a word or a sign to the list while the case runs, and writes down what he added and when; he may take nothing off the list while the case runs. Outside working hours the on-call developer may add one, and tells Petter Dahl. Petter Dahl decides what is done about an answer the assistant has already sent, and asks Kari Nordmann when the answer touches personal data; Silje Haugland decides when he is away.

## Deadlines

Status: decided

Every time counts from the moment the report reached the company, unless the deadline says otherwise. That moment is the moment the company became aware, and the 72 hours of the GDPR run from it. All times run around the clock, including evenings, weekends and public holidays, because a leak on Friday evening is the common case and not the rare one.

Working hours are Monday to Friday, 08:00 to 16:00, the hours in which Silje Haugland and Petter Dahl are reachable. Every other hour, including every evening, every weekend and every public holiday, is outside working hours. A step that falls partly on each side belongs to whoever holds it at the moment the step has to be done.

- Marius Tangen has the case and has done steps 5 to 8: within 1 hour.
- The Nordsky Cloud access logs secured: within 4 hours.
- The breach stopped, whether by closing the access, revoking the token, locking the account or taking the reading app or a part of it offline: within 4 hours.
- Marius Tangen asks the person responsible for each affected system: within 2 hours.
- The person responsible for a system gives what they found: within 12 hours of being asked.
- Kari Nordmann, or Henrik Aas of Aas & Wold on the days she does not work and at weekends, and Ingrid Solheim have the case: within 4 hours.
- Ingrid Solheim decides the sentences support may use, with Kari Nordmann's check done: within 3 hours.
- The sentences support may use stand in the support desk: within 4 hours.
- The fact page finished: within 24 hours.
- Every affected school owner told: without undue delay and at the latest 24 hours after the company became aware, because the data processing annex to the subscription contract says so.
- Ingrid Solheim decides whether Datatilsynet is notified: at the latest 48 hours, so that 24 hours are left to write a decent notification where the answer is yes.
- The notification sent to Datatilsynet: without undue delay and at the latest 72 hours after the company became aware.
- The people affected whom the company tells itself: without undue delay, within 24 hours of Ingrid Solheim's decision and at the latest 72 hours after the fact page shows the high risk.
- The case closed: not before 72 hours after the report, and only when the six things of step 58 are in place.
- The date on each measure written down: within 2 weeks of the case being closed.
- A measure that could let the same breach happen again in place: within 30 days of the case being closed.
- Any other measure in place: within 90 days of the case being closed.
- The secured copies of the access logs deleted: 12 months after the day the case is closed, later only while a case about the breach is still open.
- The record kept: five years from the day the case is closed.
- The standing configuration and the standing holding message reviewed: every six months.
- Kari Nordmann checks the list of measures: at her six-monthly review of the record of processing activities.

## Legal basis

Status: decided

- The GDPR, Articles 33 and 34: the legal obligation to establish what happened, to notify Datatilsynet and to tell the people affected. Article 33 requires the notification without undue delay and at the latest 72 hours after the company became aware, with the nature of the breach, the categories of personal data, the categories and approximate number of the people affected and of the records concerned, the name and contact details of the data protection officer, the likely consequences and the measures taken or proposed, and the reason where the notification is sent later. Article 34 requires the people affected to be told, in clear and plain language, where the breach is likely to result in a high risk for them. Article 33 also requires the company to be able to show how it handled a breach, which is why the record holds the cases that were not notified and the reason for not notifying.
- The GDPR, Article 9(2)(b) together with Article 6(1)(c): the ground on which the company handles the absence and sick leave of the 48 employees that the payroll system holds, in the fact page, in a notification to Datatilsynet and in a message to the people affected. The handling is necessary for the company to carry out its obligations in the field of employment law, together with the legal obligation of Articles 33 and 34. On that ground the absence and sick leave are named only as the categories absence and sick leave, with the number of employees affected and nothing about any individual's health, diagnosis or reason for absence, and Kari Nordmann decides what is written where a notification or a message would need more than the category.
- The data processing annex to the subscription contract with each of the 310 school owners: the company is the data processor for the pupil data in the reading app, must tell the school owner about a breach that affects its pupils without undue delay and at the latest 24 hours after the company became aware of it, must say what happened, which data and how many pupils are affected, what the company has done and what the school owner should do, and the school owner decides whether Datatilsynet and the parents are told about its own pupils.
- The data processor agreements with Nordsky AS, Hjelpedesk AS, Anthropic, Lønn Norge AS, Rekrutt AS and Microsoft: each obliges the processor to report a personal data breach to the company, which is what the start of this process rests on, and Nordsky AS must also help with the investigation.
- The data processor agreement with Aas & Wold: Henrik Aas may receive the record of a case and its fact page and the personal data they hold, advise on it, decide whether a case is a breach, and write and send the notification to Datatilsynet on behalf of the company while he stands in for Kari Nordmann. Aas & Wold must keep the data confidential, use no sub-processor without the written consent of the company, report a breach of its own without undue delay and at the latest 24 hours after becoming aware of it, and delete or return the case data when the stand-in on that case ends.
- The information security policy: every employee must report a suspected security incident to the head of IT the same day. The policy stops there, and this process is what follows.
- The AI use policy: every answer the AI support assistant sends on its own must come from an approved help article, and a human must decide any case that concerns a complaint, a contract or personal data.

## Duties to notify

Status: decided

Inside the company:

- Marius Tangen tells Kari Nordmann, or Henrik Aas of Aas & Wold on the days she does not work and at weekends, and Ingrid Solheim, within 4 hours of the report.
- At the same time he tells Nora Lind whenever the payroll system, the hiring system or employee or applicant data in the office suite is touched, and Silje Haugland whenever pupil, teacher or school contact data is touched.
- At the moment he confirms a real breach he telephones Petter Dahl and says that it is a real breach and whether support is closed on the subject. Outside working hours the on-call developer does it, and also telephones Silje Haugland and Petter Dahl at home at once, and telephones Ingrid Solheim where neither of them answers.
- Jonas Vikane and Silje Haugland are told the moment the reading app or a part of it goes offline, and when it goes back.
- Kari Nordmann tells Ingrid Solheim which measures are overdue.

Outside the company:

- The affected school owners, for a breach of pupil data in the reading app where the company is the processor: told by Silje Haugland, one message each, all sent at the same time, without undue delay and at the latest 24 hours after the company became aware, and before the company notifies Datatilsynet. The school owner then notifies Datatilsynet about its own pupils and decides whether the parents are told.
- Datatilsynet, for a breach of data the company controls: notified by Kari Nordmann, or by Henrik Aas of Aas & Wold when she is away, after Ingrid Solheim has decided and approved it, without undue delay and at the latest 72 hours after the company became aware, in every case unless the fact page shows the breach is unlikely to result in a risk to the rights and freedoms of the people affected. A supplementary notification follows where something was not yet established or the picture changes.
- The teachers, school contacts, employees and job applicants affected, where the company is the controller: told by Silje Haugland for teachers and school contacts and by Nora Lind for employees and job applicants, after Ingrid Solheim has decided, without undue delay, within 24 hours of that decision and at the latest 72 hours after the fact page shows the high risk. Where the fact page shows a high risk for a kind of person affected, those people are told.
- The person who reported the breach from outside the company: answered by Marius Tangen within 1 hour of the report, and the answer says the four things of step 5 about the record.

## Escalation

Status: decided

- Where Marius Tangen cannot be reached with a report, the on-call developer takes it and wakes him. Where he cannot do the first hour's steps, Amina Farah does them, and outside working hours the on-call developer does what the role can do and reaches him or Amina Farah for the rest.
- Where the on-call developer cannot take a decision the role does not hold, it goes to Marius Tangen, and to Amina Farah when he is away.
- Where Kari Nordmann is away, on the days she does not work and at weekends, the case, the advice, the decision whether a case is a breach, the judgement of the risk and the notification go to Henrik Aas of Aas & Wold on the firm's emergency number.
- Where Ingrid Solheim is away or is not reachable within the time a decision has to be taken, Tomas Berg decides in her place. Where neither is reachable in time for the sentences support may use, the standing holding message stays and the record says why.
- Where neither Silje Haugland nor Petter Dahl answers the telephone at home, the on-call developer telephones Ingrid Solheim and tells her that support has nobody.
- Where fewer than two of the support team are reachable in working hours, Petter Dahl answers the queue himself, and Silje Haugland steps in for him when he is away.
- A question support cannot answer goes to Petter Dahl, who brings it to Kari Nordmann once a day.
- A question this process does not answer goes to Kari Nordmann on the three days she works, and to Henrik Aas of Aas & Wold on the firm's emergency number on the other days and at weekends. Three kinds of question go elsewhere first: anything about the systems, including how long the reading app stays offline and when it goes back, is decided by Marius Tangen, and by Amina Farah when he is away; anything about an answer the AI support assistant has already sent is decided by Petter Dahl, who asks Kari Nordmann when the answer touches personal data, and by Silje Haugland when he is away; and a question nobody above can answer goes to Ingrid Solheim, and to Tomas Berg when she is away. Every such question and the answer given go into the record, so that the next version of this process covers it.
- An overdue measure goes on the agenda of the Monday leadership meeting until it is done.

## Records

Status: decided

One breach, one record: one document per case, written while it happens and not reconstructed a month later, for every case, including the ones the company decides not to notify and the ones that turn out not to be a breach at all. Kari Nordmann keeps the record with the record of processing activities in her folder in the office suite, and it lies beside the fact page in the folder Marius Tangen makes for the case. The record is kept five years from the day the case is closed.

The record holds:

- When the breach was reported and by whom, what they said, and that Marius Tangen took the case. Where the person who reported it is outside the company and asked not to be named, what of their identity the record holds, as Kari Nordmann decided it, and that decision.
- The timeline, with real timestamps.
- Which systems the first hour named as possibly touched, whom Marius Tangen asked for the facts and when, and whom he told and at what time.
- What data and whose, and how many people.
- What was done to stop the breach, what was not done and why.
- What the Nordsky Cloud logs showed; where the secured copy is kept, that it holds personal data and that Marius Tangen set the rights on the folder; any further access and Kari Nordmann's agreement to it; and, where the copy is kept longer than 12 months after the case is closed, why.
- The fact page, which the record names and lies beside.
- Who was told and when.
- Every message that went out about the breach, with the time it was sent and who sent it: the message to each affected school owner, the message to each affected teacher, school contact, employee and job applicant, the notification to Datatilsynet with the time it was sent and the receipt from Datatilsynet, and the sentences support used. Where the same wording went to many people, the record holds that wording once, how many people it went to, which kinds of person they were and the time it was sent, and not a copy per person.
- The decision whether Datatilsynet is notified, with the reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision whether the people affected are told, with the reason, the name of the person who took it and the time, whether the answer was yes or no.
- The decision that a case is not a personal data breach, written by Kari Nordmann with her name, the reason and the time.
- The list of measures, with one named person and a date per measure, and what was changed afterwards so that the same breach does not happen again.
- Why Kari Nordmann needed more than the categories of absence and sick leave, where she did.
- When the standing configuration was switched on and the standing holding message put in, what Petter Dahl or the on-call developer added to the list of hand-over signs and when, and the questions and answers of the last bullet of Escalation.

## Dependencies

Status: decided

- Law: the GDPR, Articles 33 and 34
- Law: the GDPR, Article 9(2)(b) together with Article 6(1)(c)
- Role: Managing director
- Role: Head of product
- Role: Head of customer success
- Role: Support lead
- Role: Data protection officer
- Role: Head of IT
- Role: Head of finance
- Role: Head of people
- Role: On-call developer
- Role: Lead developer
- Role: Support team
- System: Reading app
- System: Nordsky Cloud
- System: AI support assistant
- System: Support desk
- System: Payroll system
- System: Hiring system
- System: Office suite
- System: Contract archive
- Agreement: The school owners
- Agreement: Nordsky AS
- Agreement: Hjelpedesk AS
- Agreement: Anthropic
- Agreement: Lønn Norge AS
- Agreement: Rekrutt AS
- Agreement: Microsoft
- Agreement: Aas & Wold
- Policy: Information security policy
- Policy: AI use policy
- Policy: Record of processing activities
