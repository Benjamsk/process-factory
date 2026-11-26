# Report a lost laptop

## When this applies

This applies from the moment a device of Fjordlys Læring AS cannot be accounted for. A device nobody has reported missing is treated exactly like one an employee reported. Start it when

- the person who had the device notices it is gone;
- a colleague notices that a device is gone;
- head of IT Marius Tangen finds a device in the equipment register that nobody can account for;
- a report comes from outside the company, such as from a hotel, a train company, the police or a finder.

A device that is only missing is lost from the first minute. Do not wait to see whether it turns up. A laptop left on a train, a laptop that may be in the other jacket at home and a laptop taken in a burglary all start this the same way.

Whoever notices it telephones head of IT Marius Tangen the same hour they notice it. In working hours, where he cannot be reached, telephone lead developer Amina Farah. Outside working hours, in the evening, at the weekend and on a public holiday, telephone the on-call developer on the on-call telephone number in the staff handbook. Do not send an email and do not wait for Monday. The number is also on the card you were given when you started. Where the on-call developer cannot be reached, telephone Marius Tangen on his mobile, who can be reached around the clock; where he cannot be reached either, telephone managing director Ingrid Solheim, and head of finance Tomas Berg where she cannot be reached.

Every time in this document counts from the moment the loss reached the company. The times given in hours run around the clock: through every evening, every weekend and every public holiday. Two times are given in working days and are counted in working days: the report to the insurer within 3 working days, and the laptop and the access back within 2 working days.

This covers every device that held company data or could sign in to a company system: company laptops, work phones and tablets in the equipment register, and any memory stick or external disk with company data on it. It covers the measures on the device, the measures on the accounts of the person who had it, establishing the facts of the loss, the decision whether to wipe the device, the report to the police, the report to the insurer, the replacement device and the access back, the record of the case, and the decision whether the loss is a personal data breach.

It does not cover what follows from that decision. Where the loss is a personal data breach, the fact page, Datatilsynet, the school owners and the people affected belong to the process `Handle a personal data breach`, which runs alongside this one.

**A private device the employee used for work.** This covers it only for what the company can do in its own systems. End the employee's sessions, change their password and revoke their tokens exactly as for a company device. Do not locate, lock or wipe a device the company does not own, do not claim on the company insurer for it and do not replace it. The employee claims on their own insurance and reports a theft to the police themselves, and Marius Tangen helps them with what the company knows. Where the employee needs a device to work, Marius Tangen gives them a company laptop within 2 working days; that is the company equipping them, not a replacement of their own device. Write into the record that the device was private, what the employee says was on it, and that the company could not reach it.

**A company device that device management cannot reach**, such as a memory stick or an external disk. The steps on the device fall away, because there is nothing to reach, and the record says that the device cannot be reached from device management and why. Everything else is done, and two things are done differently. Treat the data on the device as exposed from the first minute, not as possibly exposed, unless the person who had it says the disk was encrypted and Marius Tangen can confirm from the equipment register or the purchase that it was an encrypted device; where that cannot be confirmed, it counts as unencrypted. And where any password, key or token was stored on the device, Marius Tangen changes or revokes it in every system it could reach, beyond the sessions and tokens of the person who had it.

**A device with no person behind it**, such as a laptop that someone who has left the company never handed back, or one whose holder cannot be reached. This covers it, and Marius Tangen answers for the device in that person's place.

It ends when the employee is working again, the record is complete and data protection officer Kari Nordmann has said whether the loss was a personal data breach. Finding the device again does not end it.

## Who does what

- Head of IT: Marius Tangen. Takes the report, carries out the measures on the device and the accounts, establishes the facts, decides the wipe, writes and keeps the record, gives the replacement device and the access back, and answers for a device that has no person behind it. Lead developer Amina Farah steps in when he is away and decides in his place.
- On-call developer: Erik Moen holds the week beginning 23 November 2026. Takes the report outside working hours and carries out the first measures within what the role can reach. Lise Berntsen is the stand-in for that week. The weekly rota is in the staff handbook.
- Data protection officer: Kari Nordmann. Is told about every lost device, is asked before a wipe where the device held personal data, decides whether the loss is a personal data breach and starts `Handle a personal data breach` where it is. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of Aas & Wold steps in when she is away and decides in her place, on the firm's emergency number.
- Head of people: Nora Lind. Is told when the accounts of an employee are blocked and when the employee is working again, and gives what the company knows in place of a person who has left the company. Ingrid Solheim steps in when she is away.
- Head of finance: Tomas Berg. Reports a loss of equipment worth more than 10,000 kroner to the insurer. Ingrid Solheim steps in when he is away.
- Managing director: Ingrid Solheim. Takes the report where neither the on-call developer nor Marius Tangen can be reached, and is told when the loss is a personal data breach. Tomas Berg steps in when she is away.

## Steps

1. Whoever notices that a device cannot be accounted for, which can be any employee or someone outside the company: telephone head of IT Marius Tangen the same hour you notice it, by the route under `When this applies`.
2. Head of IT (Marius Tangen): write into the record who reported the loss, when they noticed it and the time the report reached the company. Outside working hours the on-call developer (Erik Moen for the week beginning 23 November 2026) writes the time of the call and what was done.
3. Head of IT (Marius Tangen): locate and lock the device in device management, which is Microsoft Intune, within 1 hour of the report. This comes first, because it is the only measure that can stop someone who has the device in their hands right now. Locking needs no basis: ask nobody first. This step falls away where the device is the employee's own or device management cannot reach it.
4. Head of IT (Marius Tangen): within 2 hours of the report, end the sessions of the account of the person who had the device, in the office suite, which is Microsoft 365, in Nordsky Cloud and in the support desk. Do this also where the device is the employee's own. Where that person has left the company and their account was already closed, write into the record that it was closed and when, and steps 5 and 6 fall away with it.
5. Head of IT (Marius Tangen): within 2 hours of the report, change the password of that account.
6. Head of IT (Marius Tangen): within 2 hours of the report, revoke the access tokens of that account, in the office suite, in Nordsky Cloud and in the support desk.
7. Head of IT (Marius Tangen): tell Nora Lind that the accounts are blocked.
8. Head of IT (Marius Tangen): within 2 hours of the report, block the device itself in device management, so that it cannot sign in again even with a new password. This step falls away where the device is the employee's own or device management cannot reach it.
9. Head of IT (Marius Tangen): where a password, a key or a token was stored on a device that device management cannot reach, change or revoke it in every system it could reach, within 2 hours of the report.
10. Head of IT (Marius Tangen): tell Kari Nordmann about the lost device, at the same time as you start establishing the facts. Tell her even when you are sure what her answer will be.
11. Head of IT (Marius Tangen): within 4 hours of the report, establish the facts below and write them into the record. Where one of them cannot be established, write `not established` with the reason rather than leaving it blank.
    - from device management: the model and the serial number, whether the disk was encrypted, whether the screen was locked, and when and from where the device last contacted the company;
    - from the person who had the device: where and when it went missing, whether it was taken or mislaid, whether anyone else could have seen the screen or the password, and what was stored on it that exists nowhere else;
    - from the sign-in logs of the office suite and the access logs of Nordsky Cloud: which systems the device was signed in to, with which account, and whether anything was reached from it after the time it went missing.

    Read only the device's own entries in device management and the entries of that one account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, and only for the window from when the device went missing until its access was blocked. Do not use what you read to see how the person works or what they worked on, and draw no conclusion about their performance or their conduct from it. Where more than that window is needed, Kari Nordmann decides what is looked at and why, and writes it into the record.
12. Head of IT (Marius Tangen): within 4 hours of the report, tell the person who had the device in plain language what the company reads about them and why. Where you ask them for the facts in step 11, tell them in the same answer. Tell them
    - that you look at where and when the device last contacted the company and at the entries of their account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, for the window from when the device went missing until its access was blocked;
    - that this is to find out what could have been reached and nothing else;
    - that it is not used to judge how they work;
    - that what you find goes into the record of the case, which is kept 3 years, or 5 where the loss was also a personal data breach;
    - that Kari Nordmann is the data protection officer they can ask about it.
13. Head of people (Nora Lind): where the person who had the device has left the company, give what the company knows in their place: who had the device, when they left, what they handed back and what they said about it then. Where that person has not left the company and simply cannot be reached, head of IT (Marius Tangen) asks them for the facts as soon as they can be reached and adds what they say to the record.
14. Head of IT (Marius Tangen): within 4 hours of the report, decide whether the device is wiped. Ask Kari Nordmann first where the device held personal data. Wipe the device where any of these is true: it cannot be located; it was not encrypted; the screen was not locked when it went missing; it was signed in to the reading app, Nordsky Cloud or the support desk; or it was taken rather than mislaid. This step falls away where the device is the employee's own or device management cannot reach it: there is no wipe, and steps 15 to 19 fall away with it.
15. Head of IT (Marius Tangen): before the wipe, reach the person who had the device, tell them that it will be wiped and ask them what exists only on it. Do not hold the wipe back for longer than 1 hour because they cannot be reached.
16. Head of IT (Marius Tangen): write into the record what they said exists only on the device, and what work was lost with it.
17. Head of IT (Marius Tangen): where there is no person behind the device, tell nobody and wipe the device at once.
18. Head of IT (Marius Tangen): wipe the device and write into the record who decided it, why and when.
19. Head of IT (Marius Tangen): where none of the grounds in step 14 is true, wait with the wipe, and wipe the device 72 hours after the report where it has not been recovered by then. That is an outer limit: do not ask again, whether or not anyone is still looking for the device. Write into the record who decided to wait and why.
20. Head of IT (Marius Tangen): where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours of the report and a ground in step 14 is met, decide the wipe alone and do not wait. Write into the record that you could not reach either of them, what you tried and when, and tell Kari Nordmann, or Henrik Aas, at the first hour one of them is reachable. She may then write into the record that she would have advised otherwise; that stands as a finding for the next version of this process and is not something to undo.
21. Data protection officer (Kari Nordmann): within 4 hours of the report, decide from the established facts whether the loss is a personal data breach; Henrik Aas decides when she is away. For a device that device management cannot reach, decide it knowing that the data on the device is treated as exposed. Write the decision into the record with your name, the reason and the time, whether the answer is yes or no.
22. Data protection officer (Kari Nordmann): where you decide that it is a personal data breach, start the process `Handle a personal data breach` in the same hour, by telling Marius Tangen and Ingrid Solheim that it is a personal data breach and that the breach process now runs; Henrik Aas starts it when she is away. Marius Tangen then holds both processes and keeps one record and one timeline for the two. The moment the loss reached the company is the moment the company became aware, so the 72 hours of that process count from it and not from the decision, and the record says both times. This process keeps running, and neither process waits for the other.
23. The person who had the device: where the device was taken, report the theft to the police within 24 hours of the report, with the help of head of IT (Marius Tangen). Where there is no employee behind the device, Marius Tangen reports it himself with the serial number from the equipment register. Marius Tangen writes the case number into the record.
24. Head of finance (Tomas Berg): where the lost equipment was worth more than 10,000 kroner, report the loss to the insurer within 3 working days of the report. This step falls away where the device is the employee's own.
25. Head of IT (Marius Tangen): within 2 working days of the report, give the employee a replacement laptop and their access back. Give no replacement where the person who had the device has left the company. Where the device was the employee's own, give them a company laptop only where they need one to work, which is the company equipping them and not a replacement of their own device.
26. Head of IT (Marius Tangen): tell Nora Lind that the employee is working again, and for how long they could not work.
27. Head of IT (Marius Tangen): put the replacement device into the equipment register and mark the lost device there as lost, with the date.
28. Head of IT (Marius Tangen): where the device is found again, write into the record when and where it was found and whether anyone else could have used it in the meantime. Undo nothing that was already done until you have checked the device and said that it is safe to use again. The case still ends as step 29 says.
29. Head of IT (Marius Tangen): write into the record that the case is closed, once the employee is working again, the record is complete and Kari Nordmann has said whether the loss was a personal data breach.

## Who must be told

- Whoever notices that a device cannot be accounted for tells head of IT Marius Tangen the same hour.
- The on-call developer (Erik Moen for the week beginning 23 November 2026) telephones Marius Tangen at once, on his mobile, about a loss reported outside working hours, and says what was done.
- Marius Tangen tells Kari Nordmann about every lost device, at the same time as he starts establishing the facts.
- Marius Tangen asks Kari Nordmann before a wipe where the device held personal data, and tells her in every case what was done to the device.
- Where he had to decide the wipe without her, Marius Tangen tells Kari Nordmann, or Henrik Aas of Aas & Wold, at the first hour one of them is reachable.
- Marius Tangen tells Nora Lind when the accounts of an employee are blocked, and when the employee is working again and for how long they could not work.
- Marius Tangen tells the person who had the device, within 4 hours of the report, what the company reads about them and why, in the terms of step 12.
- Marius Tangen reaches the person who had the device before it is wiped and tells them that it will be wiped.
- Kari Nordmann tells Marius Tangen and managing director Ingrid Solheim, in the same hour she decides it, that the loss is a personal data breach and that `Handle a personal data breach` now runs.
- The employee reports a theft to the police, with Marius Tangen's help, within 24 hours; Marius Tangen reports it himself where there is no employee behind the device.
- Head of finance Tomas Berg tells the insurer within 3 working days where the lost equipment was worth more than 10,000 kroner.

The duties to tell the school owners, the parents and Datatilsynet are not duties of this process. They belong to `Handle a personal data breach`, which runs alongside this one where Kari Nordmann decides that the loss is a personal data breach.

## When to hand over

- In working hours, where head of IT Marius Tangen cannot be reached, the report and every decision of his go to lead developer Amina Farah, who steps in when he is away.
- Outside working hours the report goes to the on-call developer (Erik Moen for the week beginning 23 November 2026), who locates and locks the device at once, revokes the access token and locks the account in Nordsky Cloud at once, writes the time of the call and what was done into the record, and telephones Marius Tangen. For the office suite and the support desk, and for any decision the role cannot take, the on-call developer reaches Marius Tangen or Amina Farah. Marius Tangen then does the rest himself or decides what waits until working hours, and says so in the record.
- Where the employee cannot reach the on-call developer, they telephone Marius Tangen on his mobile, and managing director Ingrid Solheim where he cannot be reached either; head of finance Tomas Berg takes the report where she cannot be reached.
- Where data protection officer Kari Nordmann is away, lawyer Henrik Aas of Aas & Wold is asked before a wipe and decides whether the loss is a personal data breach. Where neither can be reached within 4 hours of the report and a ground for a wipe is met, Marius Tangen decides the wipe alone and tells one of them at the first reachable hour. No one else is named to decide whether the loss is a personal data breach: that decision stays with Kari Nordmann, or with Henrik Aas when she is away.
- Where Kari Nordmann decides that the loss is a personal data breach, the case goes also to `Handle a personal data breach`, which she starts and which runs alongside this process with one record and one timeline. This process keeps the device, the accounts, the police, the insurer and the replacement; that process takes the fact page, Datatilsynet, the school owners and the people affected.

## What to record

Head of IT Marius Tangen keeps one record per lost device, in the folder he makes for the case in the office suite, for every loss including the ones that turn out to be harmless, because the pattern across losses is what shows whether the routine works. The record holds

- who reported the loss and when they noticed it, and the time it reached the company;
- the device, its model and its serial number from the equipment register, and whether it was a company device or the employee's own;
- where and when it went missing and whether it was taken or mislaid;
- the established facts, with `not established` and the reason where one could not be established;
- for a device that device management cannot reach: that it cannot be reached and why, and whether it was an encrypted device or counts as unencrypted;
- what was done to the device and to the accounts, and at what time;
- who decided to wipe or to wait, with the reason and the time, and what the attempts to reach Kari Nordmann or Henrik Aas were where the wipe was decided without them;
- what the person who had the device said existed only on it, and what work was lost;
- what the employee was told about what the company reads about them;
- where more than the window from when the device went missing until its access was blocked was needed: what Kari Nordmann decided to look at beyond it, and why;
- Kari Nordmann's decision whether the loss was a personal data breach, with her name, the reason and the time, whether the answer was yes or no, and the moment the company became aware;
- the police case number where there was a theft, and whether the insurer was told;
- when the replacement was given and the access restored;
- where the device was found again: when and where, and whether anyone else could have used it in the meantime;
- that the case is closed.

Keep the record 3 years from the day the case is closed, and 5 years where the loss was also a personal data breach, so that it lasts as long as the record of that case.

The equipment register holds which employee had the lost device, which replacement they were given and the date the lost device was marked as lost. Keep that entry 3 years from the day the case is closed, and 5 years where the loss was also a personal data breach, so that the register and the record never disagree. Marius Tangen then deletes the personal part of the entry, which is which employee had the device, and keeps the device, its serial number and the dates without a name for as long as the company needs them for its accounts and its insurance. The entry for a device that was returned rather than lost is kept 3 years after the return.

## If something does not fit

No one is named for a situation this document does not cover. Where the person named for a step cannot be reached, follow `When to hand over`.
