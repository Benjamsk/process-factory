# Specification: Report a lost laptop

## Trigger

Status: decided

The process starts whenever anyone cannot account for a device that held company data or could sign in to a company system. It is the fact that the device cannot be accounted for that starts it, not an admission by the person who had it: a device nobody has reported missing is treated exactly like one an employee reported.

Whoever notices tells the head of IT, Marius Tangen, in the same hour they notice it. The loss can be noticed and reported by:

- the person who had the device;
- a colleague who notices that it is gone;
- Marius Tangen, finding a device in the equipment register that nobody can account for;
- someone outside the company, such as a hotel, a train company, the police or a finder.

A device that is only missing for now is treated as lost from the first minute. The person does not wait to see whether it turns up: a device left on a train, a device that may be in the other jacket at home, and a device taken in a burglary all start the process the same way.

Every time in this specification counts from the moment the loss reached the company.

## Scope

Status: decided

The process covers every device that held company data or could sign in to a company system: company laptops, work phones and tablets in the equipment register, and any memory stick or external disk with company data on it.

A device the person owns themselves and used for work is covered, but only for what the company can do in its own systems: the sessions of their account are ended, its password changed and its tokens revoked. The company does not locate, lock or wipe a device it does not own, does not claim on its insurer for it and does not replace it; the person claims on their own insurance and reports a theft to the police themselves, and Marius Tangen helps them with what the company knows. Where the person needs a device to work, Marius Tangen gives them a company laptop within 2 working days, which is the company equipping them and not a replacement of their own device.

A company device that device management cannot reach, such as a memory stick or an external disk, is covered. The steps on the device fall away because there is nothing to reach, and everything else is done.

The process covers getting the person working again, with a replacement laptop and their access back, and the entries in the equipment register for the lost device and the replacement.

The process covers the decision whether the loss is a personal data breach, and starting `Handle a personal data breach` where it is one. It does not cover what that process does: the notification of Datatilsynet, of the school owners and of the people affected. This process keeps the device, the accounts, the police, the insurer and the replacement. Where the loss is a personal data breach the two processes run alongside each other, with one record and one timeline, and neither waits for the other.

Where the device is found again, the process does not end: the case is closed as this specification says, and nothing already done is undone until Marius Tangen says the device is safe to use again.

## Roles

Status: decided

- Head of IT, Marius Tangen, who takes the report, carries out the measures on the device and the accounts, establishes the facts, decides the wipe, keeps the record, reports a theft to the police where there is no person behind the device, gives the replacement and keeps the equipment register. Lead developer Amina Farah steps in when he is away.
- Lead developer, Amina Farah, who does all of it when Marius Tangen is away.
- On-call developer, one of the eight developers on the weekly rota in the staff handbook, held for the week beginning 23 November 2026 by Erik Moen with Lise Berntsen as the stand-in. The role takes a report that arrives outside working hours, locates and locks the device, revokes an access token and locks the account in Nordsky Cloud, writes what was done into the record and reaches Marius Tangen.
- Data protection officer, Kari Nordmann, who is told about every lost device, is asked before a wipe where the device held personal data, decides whether the loss is a personal data breach, starts `Handle a personal data breach` where it is one, decides what is looked at where more than the window is needed, decides what of a reporter's identity the record holds where the reporter asks not to be named, and is the one a person turns to where this process does not cover the situation they meet. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of Aas & Wold steps in when she is away, on the other days and at weekends.
- Head of people, Nora Lind, who is told that a person's accounts and access are blocked and that they could not work and for how long, gives what the company knows about a person who has left or cannot be reached, and sends the telling about the logs to a person who has left.
- Head of finance, Tomas Berg, who tells the insurer where the lost equipment was worth more than 10,000 kroner. He also steps in for Ingrid Solheim when she is away.
- Managing director, Ingrid Solheim, who takes the report where neither the on-call developer nor Marius Tangen can be reached, and who answers a question nobody else can answer. Tomas Berg steps in when she is away.
- The person who had the device, who gives the facts only they can give, says what existed only on the device, reports a theft to the police with Marius Tangen's help, and is told what the company reads about them.

## Steps

Status: decided

1. Whoever cannot account for the device tells Marius Tangen in the same hour they notice it. Outside working hours they telephone the on-call developer on the on-call telephone number in the staff handbook, and do not wait for Monday or send an email that nobody reads.
2. Marius Tangen opens the record of the case, as a folder in the office suite, and writes in it who reported the loss, how they can be reached, what they said, when they noticed the loss and the time the report reached the company.
3. Marius Tangen answers the reporter within 1 hour of the report and tells them, in plain language, that their name, how they can be reached and what they said are written in the record of the case; that this is so that the company can show how it handled the loss and from what moment; that the record is kept 3 years from the day the case is closed, or 5 years where the loss was also a personal data breach, and is then deleted; and that Kari Nordmann is the data protection officer they can ask, with Henrik Aas of Aas & Wold when she is away. Amina Farah or the on-call developer does this where they answer the report instead. A reporter who is an employee is told the same. Where the reporter asks not to be named, Kari Nordmann decides what of their identity the record holds and writes that decision in the record.
4. Marius Tangen locates and locks the device in device management, which is Microsoft Intune in the office suite subscription, within 1 hour of the report. This is the first measure because it is the only one that can stop someone who has the device in their hands. Locking needs no basis and no asking: every lost device is locked at once. Not where the device is the person's own, and not where device management cannot reach the device.
5. Marius Tangen ends the sessions of the account the device last used, changes its password and revokes its access tokens, in the office suite, in Nordsky Cloud and in the support desk, within 2 hours of the report.
6. Marius Tangen blocks the device itself in device management within 2 hours of the report, so that it cannot sign in again even with a new password. Not where the device is the person's own, and not where device management cannot reach the device.
7. Marius Tangen tells Nora Lind as soon as the accounts and access are blocked.
8. Where device management cannot reach the device, Marius Tangen writes in the record that the device cannot be reached from device management and why. The data on it is treated as exposed from the first minute, not as possibly exposed, unless the person who had it says the disk was encrypted and Marius Tangen can confirm from the equipment register or the purchase that it was an encrypted device; where that cannot be confirmed, it counts as unencrypted. Where any password, key or token was stored on the device, Marius Tangen changes or revokes that password, key or token in every system it could reach, within 2 hours of the report, beyond the sessions and tokens of the account itself.
9. Marius Tangen tells Kari Nordmann about the lost device at the same time as he starts establishing the facts, and tells her even when he is sure what her answer will be.
10. Marius Tangen establishes the facts within 4 hours of the report, from three sources:
    - from device management: the model and serial number of the device, whether its disk was encrypted, whether its screen was locked, and when and from where the device last contacted the company;
    - from the person who had the device: where and when it went missing, whether it was taken or mislaid, whether anyone else could have seen the screen or the password, and what was stored on it that exists nowhere else;
    - from the sign-in logs of the office suite and the access logs of Nordsky Cloud: which systems the device was signed in to, with which account, and whether anything was reached from it after the time it went missing.
11. Marius Tangen writes every established fact into the record, and writes `not established` with the reason where something cannot be established, rather than leaving it blank.
12. Marius Tangen keeps the reading to what the loss needs: the device's own entries in device management, and the entries of that one account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, in the window from when the device went missing until its access was blocked. It is not used to see how the person works, what they worked on or where they were at other times, and no conclusion about their performance or conduct may be drawn from it. Where more than that window is needed, Kari Nordmann decides what is looked at and why, and it is written into the record.
13. Marius Tangen tells the person who had the device, within 4 hours of the report and in the same answer in which he asks them for the facts of step 10, in plain language:
    - that he looks at where and when the device last contacted the company and at the entries of their account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, for the window from when the device went missing until its access was blocked;
    - that this is to find out what could have been reached and nothing else;
    - that it is not used to judge how they work;
    - that what he finds goes into the record of the case, which is kept 3 years from the day the case is closed, or 5 years where the loss was also a personal data breach;
    - that where they cannot be reached or have left the company, head of people Nora Lind gives what the company already knows about them for the case, which is who had the device, when they left, what they handed back and what they said about it then, and that this comes from the employment file she keeps;
    - that the entry in the equipment register naming them as the person who had the device is kept as long as the record of the case, after which the name is removed and the device, its serial number and the dates are kept without it;
    - that Kari Nordmann is the data protection officer they can ask about it.
14. Where the person is still at the company but could not be reached within the 4 hours, Marius Tangen sends them the same thing at their work email within those 4 hours, so that it is waiting for them, and says it again when he first speaks to them.
15. Where the person has left the company, Nora Lind sends them the same thing in writing within 24 hours of the report, at the private email address or postal address the company holds for them in the employment file she keeps. Where the company holds no address that reaches them, she writes that in the record with what was tried, and the telling is not dropped: it is sent at the first address the company later has.
16. Where the person who had the device cannot give the facts, because they have left the company or cannot be reached, Nora Lind gives what the company knows in their place: who had the device, when they left, what they handed back and what they said about it then. Where the person has not left the company and simply cannot be reached, Marius Tangen asks them for the facts as soon as they can be reached and adds what they say to the record.
17. Where there is no person behind the device, Marius Tangen answers for it in their place. Where the person has left the company and their account was already closed, he writes in the record that it was closed and when.
18. Marius Tangen decides within 4 hours of the report whether the device is wiped, and asks Kari Nordmann first where the device held personal data. Her answer is advice on the decision, not permission for it. The device is wiped where any of these is true: it cannot be located; it was not encrypted; the screen was not locked when it went missing; it was signed in to Nordsky Cloud, to the support desk or to the reading app, which is the product the company sells; or it was taken rather than mislaid. Not where the device is the person's own.
19. Where none of those is true and the device is locked, encrypted and being looked for, the wipe waits, and Marius Tangen writes into the record who decided to wait and why. It waits no longer than 72 hours from the report.
20. Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours of the report and a ground for a wipe is met, Marius Tangen decides the wipe alone and does not wait. He writes in the record that he could not reach either of them, what he tried and when, and tells Kari Nordmann, or Henrik Aas, at the first hour one of them is reachable. She may then write in the record that she would have advised otherwise, and that stands as a finding for the next version of this process rather than as something to undo.
21. Before the wipe, Marius Tangen reaches the person who had the device by telephone or in writing, as soon as the wipe is decided, tells them that the device will be wiped and asks them what exists only on it. He writes the time of that first attempt into the record. He wipes the device one hour after that first attempt whether or not they have answered; where they answer sooner he wipes once he has their answer. Where the wipe was decided before anyone tried to reach them, the hour starts at the first attempt and the record says why the attempt came later. Where there is nobody to tell, the device is wiped at once rather than after any waiting time.
22. Marius Tangen writes into the record what the person said exists only on the device, and, after the wipe, what work existed only on the device and is lost.
23. Marius Tangen wipes the device in device management.
24. A device that has not been recovered within 72 hours of the report is wiped whether or not a ground for an earlier wipe was met, and Marius Tangen does it without asking again.
25. Kari Nordmann decides within 4 hours of the report, from the established facts, whether the loss is a personal data breach. Henrik Aas of Aas & Wold decides when she is away.
26. Where she decides that it is a personal data breach, she starts `Handle a personal data breach` in the same hour she decides it, by telling Marius Tangen and Ingrid Solheim that it is a personal data breach and that the breach process now runs. Marius Tangen then holds both processes and keeps one record and one timeline for the two. Henrik Aas starts it when she is away. This process keeps running and neither waits for the other.
27. Where she decides that it is not a personal data breach, she writes that line in the record with her name, the reason and the time, and this process runs on to its end on its own.
28. Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours of the report, Marius Tangen decides the breach question within the same 4 hours, and Amina Farah where he is away. He decides it one way: where he cannot establish that the loss is not a personal data breach, he decides that it is one, and `Handle a personal data breach` starts at once. He writes in the record that he decided it himself, whom he tried to reach and when, and what he based it on.
29. Kari Nordmann, or Henrik Aas, looks at that decision again at the first hour one of them is reachable, and may decide that it is not a personal data breach after all. She then writes that line in the record with her name, her reason and the time, and the breach process stops with that line in its own record. She does not undo what was already done.
30. Where the device was taken, a theft is reported to the police within 24 hours of the report. The person who had the device reports it with Marius Tangen's help, and reports it themselves where the device is their own. Where there is no person behind the device, Marius Tangen reports it himself with the serial number from the equipment register. The police case number goes into the record.
31. Where the lost equipment was worth more than 10,000 kroner, Tomas Berg tells the insurer within 3 working days of the report. Not where the device is the person's own.
32. Marius Tangen gives the person a replacement laptop and their access back within 2 working days of the report, and tells Nora Lind, so that she knows the person could not work and for how long. Where the device was the person's own, he gives them a company laptop within 2 working days where they need one to work. No replacement is given where the person has left the company.
33. Marius Tangen puts the new device into the equipment register and marks the lost device as lost there with the date.
34. Where the device is found again, Marius Tangen writes into the record that it was found, when, where and whether anyone else could have used it in the meantime. Nothing that was already done is undone until he says the device is safe to use again. A device recovered inside the 72 hours is not wiped, and he checks it and says it is safe before the person uses it again.
35. Marius Tangen writes into the record that the case is closed, once the person is working again, the record is complete and the breach question has been decided.

## AI steps

Status: decided

No step of this process is done by an AI. Every step is done by a named person: Marius Tangen, Amina Farah, the on-call developer, Kari Nordmann, Henrik Aas, Nora Lind, Tomas Berg, Ingrid Solheim or the person who had the device. The AI use policy says that a human must decide any case that concerns personal data, and every decision of this process does.

## Deadlines

Status: decided

Every time counts from the moment the loss reached the company. The times given in hours run around the clock, including every evening, every weekend and every public holiday, because a device is most often lost on the way home or on a trip. Three times are counted in working days, and are marked as such below.

| What | By when |
| --- | --- |
| Whoever cannot account for the device tells the head of IT | The same hour they notice it |
| The reporter is told what the record holds about them | Within 1 hour |
| The device is located and locked | Within 1 hour |
| The sessions ended, the password changed, the tokens revoked, the device blocked | Within 2 hours |
| A password, key or token stored on a device that device management cannot reach is changed or revoked in every system it could reach | Within 2 hours |
| The facts are established | Within 4 hours |
| The person who had the device is told what is read about them, and asked for the facts | Within 4 hours |
| The decision whether the device is wiped | Within 4 hours |
| The decision whether the loss is a personal data breach | Within 4 hours |
| The wipe, where the person who had the device cannot be reached | 1 hour after the first attempt to reach them |
| A wipe that waits because no ground for it is met | No later than 72 hours |
| A person who has left the company is told what is read about them | Within 24 hours |
| A theft is reported to the police | Within 24 hours |
| Nora Lind is told that the accounts and access are blocked | As soon as they are blocked; no time is set |
| The insurer is told, where the equipment was worth more than 10,000 kroner | Within 3 working days |
| The replacement laptop and the access back | Within 2 working days |

The 72 hours of `Handle a personal data breach` count from the moment the loss reached the company, which is the moment the company became aware, and not from the moment the breach question was decided.

The deadlines keep running while nobody with access to the systems can be reached. The record says which deadline was missed and why, so that the gap is visible rather than quietly absorbed.

## Legal basis

Status: decided

- GDPR Article 6(1)(f): the company's legitimate interest in protecting its systems and the personal data of pupils, teachers, employees and job applicants that it holds. This is the basis for processing the personal data of the person who had the device, namely the device's own entries in device management and the entries of that one account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, in the window from when the device went missing until its access was blocked. Where more than that window is needed, Kari Nordmann decides what is looked at and why, and writes it in the record.
- GDPR Article 6(1)(f): the same legitimate interest is the basis for keeping in the record the name of whoever reported the loss, how they can be reached and what they said about the loss, including a reporter from outside the company such as a hotel, a train company, the police or a finder, because the company must be able to show who told it about the loss and when: the whole timeline of the case counts from that moment. Nothing else about the reporter is kept, and it is kept no longer than the record of the case.
- GDPR Article 6(1)(c), with Articles 33 and 34: from the moment it is decided that the loss is a personal data breach, the company also processes the data to meet its legal obligation to establish what happened.
- The routine for lost or stolen equipment, which says that every company laptop and work phone is encrypted and screen-locked through device management, that the person who loses one tells the head of IT the same hour, that the device is locked as soon as the loss is known and wiped where it cannot be recovered, that a theft is reported to the police by the person who had the device with Marius Tangen's help and the case number written into the record, and that a loss of equipment worth more than 10,000 kroner is reported to the insurer by Tomas Berg.
- The information security policy, which says that every employee must report a suspected security incident to the head of IT the same day.
- The company's own rules on who decides, in `organisation/authority.md`: `Lock or wipe a lost device remotely` and `Block an employee's accounts and access`.

## Duties to notify

Status: decided

- Whoever cannot account for the device tells Marius Tangen in the same hour they notice it, and the on-call developer outside working hours.
- The on-call developer telephones Marius Tangen on his mobile at once and tells him what was done and what is left.
- Marius Tangen tells the reporter, within 1 hour of the report, that their name, how they can be reached and what they said are written in the record, why, how long the record is kept and whom they can ask. Amina Farah or the on-call developer tells them where they answered the report.
- Marius Tangen tells Kari Nordmann about every lost device, at the same time as he starts establishing the facts, whatever he thinks her answer will be.
- Marius Tangen tells Nora Lind as soon as the accounts and access are blocked, and again when the person has their replacement and their access back, so that she knows the person could not work and for how long.
- Marius Tangen tells the person who had the device, within 4 hours of the report, what is read about them and why. Where they have left the company, Nora Lind tells them within 24 hours. Where they are still at the company but could not be reached, Marius Tangen sends it to their work email within those 4 hours.
- Marius Tangen tells the person who had the device, before the wipe, that the device will be wiped, and asks what exists only on it.
- Where Kari Nordmann decides that the loss is a personal data breach, she tells Marius Tangen and Ingrid Solheim in the same hour, and that starts `Handle a personal data breach`. Henrik Aas tells them when she is away.
- Where Marius Tangen decided the breach question himself because neither Kari Nordmann nor Henrik Aas could be reached, he tells one of them at the first hour they are reachable.
- Where Marius Tangen decided a wipe without being able to reach Kari Nordmann or Henrik Aas, he tells one of them at the first hour they are reachable.
- Where the device was taken, the police are told within 24 hours of the report, by the person who had the device with Marius Tangen's help, or by Marius Tangen himself where there is no person behind the device.
- Where the lost equipment was worth more than 10,000 kroner, Tomas Berg tells the insurer within 3 working days.

The duties of `Handle a personal data breach`, which are the notification of Datatilsynet, of the school owners and of the people affected, belong to that process and not to this one.

## Escalation

Status: decided

- Where Marius Tangen is away, Amina Farah does everything he does, including the decision to lock, block or wipe and the breach question where the data protection officer cannot be reached.
- Outside working hours the report goes to the on-call developer, who locates and locks the device at once, revokes an access token and locks the account in Nordsky Cloud, writes the time of the call and what was done into the record, and telephones Marius Tangen on his mobile, who can be reached around the clock. Marius Tangen then does the rest himself or decides what waits until working hours, and says so in the record.
- Where the on-call developer cannot be reached, the person telephones Marius Tangen directly, and Ingrid Solheim where he cannot be reached either, with Tomas Berg in her place.
- Where the report ends with Ingrid Solheim, or with Tomas Berg in her place, the one who took it does four things and nothing in the systems, because they have no access to device management: they open the record and write in it the time the report reached the company, who reported it, what they said and that they are holding it; they telephone, in this order and not by email, the on-call developer on the on-call number, then Marius Tangen on his mobile, then Amina Farah, and keep trying every 30 minutes until one of them answers, writing each attempt and its time in the record; they tell the person who reported it that the case is held and that someone will come back to them; and they ask the person who had the device for the facts only insofar as they are on the telephone anyway, and write what they say in the record. They hold the case until Marius Tangen or Amina Farah writes in the record that they have taken it, and he then carries on from the step the process has reached rather than starting again. Where four hours pass with nobody reachable, Ingrid Solheim, or Tomas Berg in her place, telephones Kari Nordmann, or Henrik Aas, so that the breach question is at least in the hands of someone, and writes that in the record.
- Where Kari Nordmann is away, Henrik Aas of Aas & Wold stands in, on the days she does not work and at weekends, on the firm's emergency number.
- Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours and a ground for a wipe is met, Marius Tangen decides the wipe alone and tells one of them afterwards.
- Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours, Marius Tangen decides the breach question within the same 4 hours, and decides that the loss is a personal data breach where he cannot establish that it is not.
- Where this process does not cover the situation a person meets, they turn to Kari Nordmann, on the three days a week she works, and to Henrik Aas of Aas & Wold on the other days and at weekends, on the firm's emergency number. Two kinds of question go elsewhere first: anything about the devices, the accounts or the systems is decided by Marius Tangen, and by Amina Farah when he is away; and a question nobody above can answer goes to Ingrid Solheim, and to Tomas Berg when she is away. Every such question and the answer given go into the record of the case, so that the next version of this process covers it.

## Records

Status: decided

One record per lost device, kept for every loss including the ones that turn out to be harmless, because the pattern across losses is what shows whether the routine works. Marius Tangen keeps it in the office suite, in the folder he makes for the case. Where the loss is also a personal data breach, that process and this one share this one record and one timeline.

The record holds:

- who reported the loss, how they can be reached, what they said and when they noticed the loss; where the reporter asked not to be named, what Kari Nordmann decided the record holds of their identity, with her reason and the time;
- the time the loss reached the company;
- the device, its model and its serial number from the equipment register, and whether the device was the person's own;
- where and when it went missing, and whether it was taken or mislaid;
- every established fact, with `not established` and the reason where one could not be established;
- where device management cannot reach the device: that it cannot be reached and why, what the person says was on it, and whether the disk could be confirmed as encrypted;
- what was done to the device and to the accounts, and at what time, including what the on-call developer did and the time of the call;
- what Kari Nordmann decided to look at beyond the window from when the device went missing until its access was blocked, and why;
- who decided to wipe or to wait, with the reason and the time; where the data protection officer could not be reached, that she could not, what was tried and when; and the time of the first attempt to reach the person before the wipe;
- what the person said existed only on the device, and what work was lost;
- for every telling this process requires, that it was sent, who sent it, to which address or telephone number and at what time; where a telling could not be sent, that it could not, what was tried and at what times;
- the decision whether the loss was a personal data breach, with the name of whoever decided it, the reason and the time, whether the answer was yes or no; where Marius Tangen decided it himself, whom he tried to reach and when, and what he based it on;
- the police case number where there was a theft;
- whether the insurer was told;
- when the replacement was given and the access restored;
- where the device was found again, when and where and whether anyone else could have used it;
- every deadline that was missed and why;
- every question this process did not cover and the answer that was given;
- that the case is closed, and when.

The record is kept 3 years from the day the case is closed, and 5 years where the loss was also a personal data breach, so that it lasts as long as the record of that case.

The entry in the equipment register that says which person had the lost device, which replacement they were given and the date the lost device was marked as lost is kept as long as the record of the case: 3 years from the day it is closed, or 5 years where the loss was also a personal data breach. Marius Tangen then deletes the personal part of the entry, which is which person had the device, and keeps the device, its serial number and the dates without a name for as long as the company needs them for its accounts and its insurance. The entry for a device that was returned rather than lost is kept 3 years after the return.

## Dependencies

Status: decided

- Law: GDPR Article 6(1)(f)
- Law: GDPR Article 6(1)(c)
- Law: GDPR Articles 33 and 34
- Role: Head of IT
- Role: Lead developer
- Role: On-call developer
- Role: Data protection officer
- Role: Head of people
- Role: Head of finance
- Role: Managing director
- Role: Reachability outside working hours
- System: Device management
- System: Equipment register
- System: Office suite
- System: Nordsky Cloud
- System: Support desk
- System: Reading app
- System: Staff handbook
- System: Employment files
- Agreement: Microsoft
- Agreement: Nordsky AS
- Agreement: Hjelpedesk AS
- Agreement: Aas & Wold
- Policy: Lost or stolen equipment
- Policy: Information security policy
- Policy: AI use policy
- Process: Handle a personal data breach
