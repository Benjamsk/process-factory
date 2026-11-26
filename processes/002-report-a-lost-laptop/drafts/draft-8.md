# Report a lost laptop

## When this applies

This applies whenever anyone cannot account for a device that held company data or could sign in to a company system. It is the fact that the device cannot be accounted for that starts it, not an admission by the person who had it: a device nobody has reported missing is treated exactly like one an employee reported.

A device that is only missing for now is lost from the first minute. Do not wait to see whether it turns up. A device left on a train, a device that may be in the other jacket at home and a device taken in a burglary all start this the same way.

Whoever notices tells head of IT Marius Tangen in the same hour they notice it. The loss can be noticed and reported by the person who had the device, by a colleague who notices that it is gone, by Marius Tangen finding a device in the equipment register that nobody can account for, or by someone outside the company such as a hotel, a train company, the police or a finder. The equipment register is the list of which laptop, work phone and other equipment each employee has, with the model, the serial number and the dates it was given out and returned.

This covers every device that held company data or could sign in to a company system: company laptops, work phones and tablets in the equipment register, and any memory stick or external disk with company data on it.

A device the person owns themselves and used for work is covered, but only for what the company can do in its own systems: the sessions of their account are ended, its password changed and its tokens revoked. The company does not locate, lock or wipe a device it does not own, does not claim on its insurer for it and does not replace it. The person claims on their own insurance and reports a theft to the police themselves, and Marius Tangen helps them with what the company knows. Where they need a device to work, Marius Tangen gives them a company laptop within 2 working days, which is the company equipping them and not a replacement of their own device.

A company device that device management cannot reach, such as a memory stick or an external disk, is covered. Device management is Microsoft Intune, part of the company's subscription to the office suite, and it is where a company laptop, work phone or tablet is located, locked and wiped. The office suite is the company's email, documents, spreadsheets and video meetings in Microsoft 365. The steps on the device fall away because there is nothing to reach, and everything else is done.

This covers getting the person working again, with a replacement laptop and their access back, and the entries in the equipment register for the lost device and the replacement.

This covers the decision whether the loss is a personal data breach, and starting `Handle a personal data breach` where it is one. It does not cover what that process does: the notification of Datatilsynet, the Norwegian data protection authority, of the school owners and of the people affected. This process keeps the device, the accounts, the police, the insurer and the replacement. Where the loss is a personal data breach the two processes run alongside each other, with one record and one timeline, and neither waits for the other. The 72 hours of `Handle a personal data breach` count from the moment the loss reached the company, which is the moment the company became aware, and not from the moment the breach question was decided.

Where the device is found again, this does not end: the case is closed as the steps below say, and nothing already done is undone until Marius Tangen says the device is safe to use again.

Every time below counts from the moment the loss reached the company. The times given in hours run around the clock, including every evening, every weekend and every public holiday. Three times are counted in working days, and each says so. The deadlines keep running while nobody with access to the systems can be reached, and the record says which deadline was missed and why.

## Who does what

- Head of IT: Marius Tangen. He takes the report, carries out the measures on the device and the accounts, establishes the facts, decides the wipe, keeps the record, reports a theft to the police where there is no person behind the device, gives the replacement and keeps the equipment register. Lead developer Amina Farah steps in when he is away.
- Lead developer: Amina Farah. She does everything the head of IT does when Marius Tangen is away. Head of product Jonas Vikane steps in when she is away.
- On-call developer: Erik Moen for the week beginning 23 November 2026, with Lise Berntsen as the stand-in for that week. The role takes a report that arrives outside working hours, locates and locks the device, revokes an access token and locks the account in Nordsky Cloud, writes what was done into the record and reaches Marius Tangen. The rota for other weeks is in the staff handbook. Nordsky Cloud is the cloud platform that runs the reading app, the product the company sells.
- Data protection officer: Kari Nordmann. She is told about every lost device, is asked before a wipe where the device held personal data, decides whether the loss is a personal data breach and starts `Handle a personal data breach` where it is one, decides what is looked at where more than the window from when the device went missing until its access was blocked is needed, and decides what of a reporter's identity the record holds where the reporter asks not to be named. She works Tuesday, Wednesday and Thursday. Lawyer Henrik Aas of Aas & Wold steps in when she is away, on the other days and at weekends, on the firm's emergency number.
- Head of people: Nora Lind. She is told that a person's accounts and access are blocked and that they could not work and for how long, gives what the company knows about a person who has left or cannot be reached, and sends the telling about the logs to a person who has left. Managing director Ingrid Solheim steps in when she is away.
- Head of finance: Tomas Berg. He tells the insurer where the lost equipment was worth more than 10,000 kroner. Ingrid Solheim steps in when he is away.
- Managing director: Ingrid Solheim. She takes the report where neither the on-call developer nor Marius Tangen can be reached, and answers a question nobody else can answer. Tomas Berg steps in when she is away.
- The person who had the device: whoever had the lost device. They give the facts only they can give, say what existed only on the device, report a theft to the police with Marius Tangen's help, and are told what the company reads about them. No one is named to step in for them; where they have left the company or cannot be reached, Nora Lind gives what the company knows in their place.

## Steps

1. Whoever cannot account for the device: Tell head of IT Marius Tangen in the same hour you notice it. Outside working hours, telephone the on-call developer, Erik Moen, on the on-call telephone number in the staff handbook. Do not wait for Monday and do not send an email that nobody reads.
2. Head of IT (Marius Tangen): Open the record of the case as a folder in the office suite. Write in it who reported the loss, how they can be reached, what they said, when they noticed the loss and the time the report reached the company.
3. Head of IT (Marius Tangen): Answer the reporter within 1 hour of the report and tell them, in plain words:
    - that their name, how they can be reached and what they said are written in the record of the case;
    - that this is so that the company can show how it handled the loss and from what moment;
    - that the record is kept 3 years from the day the case is closed, or 5 years where the loss was also a personal data breach, and is then deleted;
    - that data protection officer Kari Nordmann is the one they can ask, with Henrik Aas of Aas & Wold when she is away.

    Lead developer Amina Farah or on-call developer Erik Moen does this where they answered the report instead. A reporter who is an employee is told the same. Where the reporter asks not to be named, Kari Nordmann decides what of their identity the record holds and writes that decision in the record.
4. Head of IT (Marius Tangen): Locate and lock the device in device management within 1 hour of the report. Lock every lost device at once: this needs no basis and no asking. Not where the device is the person's own, and not where device management cannot reach the device.
5. Head of IT (Marius Tangen): End the sessions of the account the device last used, change its password and revoke its access tokens, in the office suite, in Nordsky Cloud and in the support desk, within 2 hours of the report. The support desk is where support cases from teachers and school owners arrive and are answered.
6. Head of IT (Marius Tangen): Block the device itself in device management within 2 hours of the report, so that it cannot sign in again even with a new password. Not where the device is the person's own, and not where device management cannot reach the device.
7. Head of IT (Marius Tangen): Tell head of people Nora Lind as soon as the accounts and access are blocked.
8. Head of IT (Marius Tangen): Where device management cannot reach the device, write in the record that the device cannot be reached from device management and why. Treat the data on the device as exposed from the first minute, not as possibly exposed. Treat it otherwise only where the person who had the device says the disk was encrypted and you can confirm from the equipment register or the purchase that it was an encrypted device. Where you cannot confirm that, the disk counts as unencrypted. Where any password, key or token was stored on the device, change or revoke that password, key or token in every system it could reach, within 2 hours of the report, beyond the sessions and tokens of the account itself.
9. Head of IT (Marius Tangen): Tell data protection officer Kari Nordmann about the lost device at the same time as you start establishing the facts, and Henrik Aas of Aas & Wold where she is away. Tell her even when you are sure what her answer will be.
10. Head of IT (Marius Tangen): Establish the facts within 4 hours of the report, from three sources:
    - from device management: the model and serial number of the device, whether its disk was encrypted, whether its screen was locked, and when and from where the device last contacted the company;
    - from the person who had the device: where and when it went missing, whether it was taken or mislaid, whether anyone else could have seen the screen or the password, and what was stored on it that exists nowhere else. Ask them for this in the same message in which you tell them what step 13 lists;
    - from the sign-in logs of the office suite and the access logs of Nordsky Cloud: which systems the device was signed in to, with which account, and whether anything was reached from it after the time it went missing. Read only the entries of that one account, and only in the window from when the device went missing until its access was blocked. Do not use them to see how the person works, what they worked on or where they were at other times.
11. Head of IT (Marius Tangen): Write every established fact into the record. Where something cannot be established, write `not established` with the reason rather than leaving it blank.
12. Head of IT (Marius Tangen): Keep the reading to what the loss needs: the device's own entries in device management, and the entries of that one account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, in the window from when the device went missing until its access was blocked. Do not use it to see how the person works, what they worked on or where they were at other times, and draw no conclusion about their performance or conduct from it. Where more than that window is needed, Kari Nordmann decides what is looked at and why, and it is written into the record.
13. Head of IT (Marius Tangen): Tell the person who had the device, within 4 hours of the report and in the same answer in which you ask them for the facts of step 10, in plain words:
    - that you look at where and when the device last contacted the company and at the entries of their account in the sign-in logs of the office suite and the access logs of Nordsky Cloud, for the window from when the device went missing until its access was blocked;
    - that this is to find out what could have been reached and nothing else;
    - that it is not used to judge how they work;
    - that what you find goes into the record of the case, which is kept 3 years from the day the case is closed, or 5 years where the loss was also a personal data breach;
    - that where they cannot be reached or have left the company, head of people Nora Lind gives what the company already knows about them for the case, which is who had the device, when they left, what they handed back and what they said about it then, and that this comes from the employment file she keeps;
    - that the entry in the equipment register naming them as the person who had the device is kept as long as the record of the case, after which the name is removed and the device, its serial number and the dates are kept without it;
    - that Kari Nordmann is the data protection officer they can ask about it.
14. Head of IT (Marius Tangen): Where the person is still at the company but could not be reached within those 4 hours, send them the same thing at their work email within those 4 hours, so that it is waiting for them, and say it again when you first speak to them.
15. Head of people (Nora Lind): Where the person has left the company, send them the same thing in writing within 24 hours of the report, at the private email address or postal address the company holds for them in the employment file you keep. Where the company holds no address that reaches them, write that in the record with what was tried. The telling is not dropped: send it at the first address the company later has.
16. Head of people (Nora Lind): Where the person who had the device cannot give the facts, because they have left the company or cannot be reached, give what the company knows in their place: who had the device, when they left, what they handed back and what they said about it then. Where the person has not left the company and simply cannot be reached, head of IT Marius Tangen asks them for the facts as soon as they can be reached and adds what they say to the record.
17. Head of IT (Marius Tangen): Where there is no person behind the device, answer for it in their place. Where the person has left the company and their account was already closed, write in the record that it was closed and when.
18. Head of IT (Marius Tangen): Decide within 4 hours of the report whether the device is wiped, and ask Kari Nordmann first where the device held personal data, with Henrik Aas of Aas & Wold where she is away. Her answer is advice on the decision, not permission for it. Decide that the device is wiped where any of these is true: it cannot be located; it was not encrypted; the screen was not locked when it went missing; it was signed in to Nordsky Cloud, to the support desk or to the reading app; or it was taken rather than mislaid. Do not wipe it here: you wipe it at step 23, after step 21. Not where the device is the person's own.
19. Head of IT (Marius Tangen): Where none of those is true and the device is locked, encrypted and being looked for, do not wipe the device yet. Write into the record who decided to wait and why. The wipe waits no longer than 72 hours from the report.
20. Head of IT (Marius Tangen): Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours of the report and a ground for a wipe is met, decide the wipe alone and do not wait. Write in the record that you could not reach either of them, what you tried and when, and tell Kari Nordmann, or Henrik Aas, at the first hour one of them is reachable. Whoever you reached may then write in the record that they would have advised otherwise, and that stands as a finding for the next version of this document rather than as something to undo.
21. Head of IT (Marius Tangen): Before the wipe, reach the person who had the device by telephone or in writing, as soon as the wipe is decided. Tell them that the device will be wiped and ask them what exists only on it. Write the time of that first attempt into the record. Wipe the device one hour after that first attempt whether or not they have answered; where they answer sooner, wipe once you have their answer. Where the wipe was decided before anyone tried to reach them, the hour starts at the first attempt and the record says why the attempt came later. Where there is nobody to tell, wipe the device at once rather than after any waiting time.
22. Head of IT (Marius Tangen): Write into the record what the person said exists only on the device, and, after the wipe, what work existed only on the device and is lost.
23. Head of IT (Marius Tangen): Wipe the device in device management.
24. Head of IT (Marius Tangen): Wipe a device that has not been recovered within 72 hours of the report, whether or not a ground for an earlier wipe was met, and do it without asking again.
25. Data protection officer (Kari Nordmann): Decide within 4 hours of the report, from the established facts, whether the loss is a personal data breach. Henrik Aas of Aas & Wold decides when she is away.
26. Data protection officer (Kari Nordmann): Where you decide that it is a personal data breach, start `Handle a personal data breach` in the same hour you decide it, by telling head of IT Marius Tangen and managing director Ingrid Solheim that it is a personal data breach and that the breach process now runs. Marius Tangen then holds both processes and keeps one record and one timeline for the two. Henrik Aas of Aas & Wold starts it when she is away. This process keeps running and neither waits for the other. The 72 hours of `Handle a personal data breach` count from the moment the loss reached the company, which is the moment the company became aware, and not from the moment the breach question was decided.
27. Data protection officer (Kari Nordmann): Where you decide that it is not a personal data breach, write that line in the record with your name, the reason and the time. This process then runs on to its end on its own.
28. Head of IT (Marius Tangen): Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours of the report, decide the breach question within the same 4 hours, and lead developer Amina Farah decides where you are away. Decide it one way: decide that the loss is a personal data breach, unless you can establish from the facts that it is not. `Handle a personal data breach` then starts at once. Write in the record that you decided it yourself, whom you tried to reach and when, and what you based it on. The 72 hours of `Handle a personal data breach` count from the moment the loss reached the company, which is the moment the company became aware, and not from the moment the breach question was decided.
29. Data protection officer (Kari Nordmann): Look at that decision again at the first hour you or Henrik Aas of Aas & Wold are reachable. You may decide that it is not a personal data breach after all. Write that line in the record with your name, your reason and the time, and the breach process stops with that line in its own record. Do not undo what was already done.
30. The person who had the device: Where the device was taken, report the theft to the police within 24 hours of the report, with head of IT Marius Tangen's help, and report it yourself where the device is your own. Where there is no person behind the device, Marius Tangen reports it himself with the serial number from the equipment register. The police case number goes into the record.
31. Head of finance (Tomas Berg): Where the lost equipment was worth more than 10,000 kroner, tell the insurer within 3 working days of the report. Not where the device is the person's own.
32. Head of IT (Marius Tangen): Give the person a replacement laptop and their access back within 2 working days of the report, and tell head of people Nora Lind, so that she knows the person could not work and for how long. Where the device was the person's own, give them a company laptop within 2 working days where they need one to work. Give no replacement where the person has left the company.
33. Head of IT (Marius Tangen): Put the new device into the equipment register and mark the lost device as lost there with the date.
34. Head of IT (Marius Tangen): Where the device is found again, write into the record that it was found, when, where and whether anyone else could have used it in the meantime. Undo nothing that was already done until you say the device is safe to use again. Do not wipe a device recovered inside the 72 hours; check it and say it is safe before the person uses it again.
35. Head of IT (Marius Tangen): Write into the record that the case is closed, once the person is working again, the record is complete and the breach question has been decided.

## Who must be told

- Whoever cannot account for the device tells head of IT Marius Tangen in the same hour they notice it, and the on-call developer, Erik Moen, outside working hours.
- The on-call developer, Erik Moen, telephones Marius Tangen on his mobile at once and tells him what was done and what is left.
- Marius Tangen tells the reporter, within 1 hour of the report, that their name, how they can be reached and what they said are written in the record, why, how long the record is kept and whom they can ask. Lead developer Amina Farah or Erik Moen tells them where they answered the report.
- Marius Tangen tells data protection officer Kari Nordmann about every lost device, at the same time as he starts establishing the facts, whatever he thinks her answer will be. Henrik Aas of Aas & Wold is told where she is away.
- Marius Tangen tells head of people Nora Lind as soon as the accounts and access are blocked, and again when the person has their replacement and their access back, so that she knows the person could not work and for how long.
- Marius Tangen tells the person who had the device, within 4 hours of the report, what is read about them and why. Where they have left the company, Nora Lind tells them within 24 hours. Where they are still at the company but could not be reached, Marius Tangen sends it to their work email within those 4 hours.
- Marius Tangen tells the person who had the device, before the wipe, that the device will be wiped, and asks what exists only on it.
- Where Kari Nordmann decides that the loss is a personal data breach, she tells Marius Tangen and managing director Ingrid Solheim in the same hour, and that starts `Handle a personal data breach`. Henrik Aas of Aas & Wold tells them when she is away.
- Where Marius Tangen decided the breach question himself because neither Kari Nordmann nor Henrik Aas could be reached, he tells one of them at the first hour they are reachable.
- Where Marius Tangen decided a wipe without being able to reach Kari Nordmann or Henrik Aas, he tells one of them at the first hour they are reachable.
- Where the device was taken, the police are told within 24 hours of the report, by the person who had the device with Marius Tangen's help, or by Marius Tangen himself where there is no person behind the device.
- Where the lost equipment was worth more than 10,000 kroner, head of finance Tomas Berg tells the insurer within 3 working days.

The notification of Datatilsynet, of the school owners and of the people affected belongs to `Handle a personal data breach` and not here. The 72 hours of that process count from the moment the loss reached the company, which is the moment the company became aware, and not from the moment the breach question was decided.

## When to hand over

- Where head of IT Marius Tangen is away, lead developer Amina Farah does everything he does, including the decision to lock, block or wipe and the breach question where the data protection officer cannot be reached.
- Outside working hours the report goes to the on-call developer, Erik Moen, who locates and locks the device at once, revokes an access token and locks the account in Nordsky Cloud, writes the time of the call and what was done into the record, and telephones Marius Tangen on his mobile, who can be reached around the clock. Marius Tangen then does the rest himself or decides what waits until working hours, and says so in the record.
- Where Erik Moen cannot be reached, telephone Marius Tangen directly, and managing director Ingrid Solheim where he cannot be reached either, with head of finance Tomas Berg in her place.
- Where the report ends with Ingrid Solheim, or with Tomas Berg in her place, the one who took it does four things and nothing in the systems, because they have no access to device management:
    - they open the record and write in it the time the report reached the company, who reported it, what they said and that they are holding it;
    - they telephone, in this order and not by email, Erik Moen on the on-call number, then Marius Tangen on his mobile, then Amina Farah, and keep trying every 30 minutes until one of them answers, writing each attempt and its time in the record;
    - they tell the person who reported it that the case is held and that someone will come back to them;
    - they ask the person who had the device for the facts only insofar as they are on the telephone anyway, and write what they say in the record.

    They hold the case until Marius Tangen or Amina Farah writes in the record that they have taken it, and that person then carries on from the step the process has reached rather than starting again. Where four hours pass with nobody reachable, Ingrid Solheim, or Tomas Berg in her place, telephones data protection officer Kari Nordmann, or Henrik Aas of Aas & Wold, so that the breach question is at least in the hands of someone, and writes that in the record.
- Where Kari Nordmann is away, Henrik Aas of Aas & Wold stands in, on the days she does not work and at weekends, on the firm's emergency number.
- Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours and a ground for a wipe is met, Marius Tangen decides the wipe alone and tells one of them afterwards.
- Where neither Kari Nordmann nor Henrik Aas can be reached within 4 hours, Marius Tangen decides the breach question within the same 4 hours, and decides that the loss is a personal data breach where he cannot establish that it is not.

## What to record

Keep one record per lost device, for every loss including the ones that turn out to be harmless. Head of IT Marius Tangen keeps it in the office suite, in the folder he makes for the case. Where the loss is also a personal data breach, that process and this one share this one record and one timeline.

The record holds:

- who reported the loss, how they can be reached, what they said and when they noticed the loss; where the reporter asked not to be named, what data protection officer Kari Nordmann decided the record holds of their identity, with her reason and the time;
- the time the loss reached the company;
- the device, its model and its serial number from the equipment register, and whether the device was the person's own;
- where and when it went missing, and whether it was taken or mislaid;
- every established fact, with `not established` and the reason where one could not be established;
- where device management cannot reach the device: that it cannot be reached and why, what the person says was on it, and whether the disk could be confirmed as encrypted;
- what was done to the device and to the accounts, and at what time, including what the on-call developer did and the time of the call;
- what Kari Nordmann decided to look at beyond the window from when the device went missing until its access was blocked, and why;
- who decided to wipe or to wait, with the reason and the time; where the data protection officer could not be reached, that she could not, what was tried and when; and the time of the first attempt to reach the person before the wipe;
- what the person said existed only on the device, and what work was lost;
- for every telling this document requires, that it was sent, who sent it, to which address or telephone number and at what time; where a telling could not be sent, that it could not, what was tried and at what times;
- the decision whether the loss was a personal data breach, with the name of whoever decided it, the reason and the time, whether the answer was yes or no; where Marius Tangen decided it himself, whom he tried to reach and when, and what he based it on;
- the police case number where there was a theft;
- whether the insurer was told;
- when the replacement was given and the access restored;
- where the device was found again, when and where and whether anyone else could have used it;
- every deadline that was missed and why;
- every question this document did not cover and the answer that was given;
- that the case is closed, and when.

Keep the record 3 years from the day the case is closed, and 5 years where the loss was also a personal data breach.

Keep the entry in the equipment register that says which person had the lost device, which replacement they were given and the date the lost device was marked as lost as long as the record of the case: 3 years from the day it is closed, or 5 years where the loss was also a personal data breach. Marius Tangen then deletes the personal part of the entry, which is which person had the device, and keeps the device, its serial number and the dates without a name for as long as the company needs them for its accounts and its insurance. The entry for a device that was returned rather than lost is kept 3 years after the return.

## If something does not fit

Turn to data protection officer Kari Nordmann, on the three days a week she works, and to Henrik Aas of Aas & Wold on the other days and at weekends, on the firm's emergency number.

Two kinds of question go elsewhere first. Anything about the devices, the accounts or the systems is decided by head of IT Marius Tangen, and by lead developer Amina Farah when he is away. A question nobody above can answer goes to managing director Ingrid Solheim, and to head of finance Tomas Berg when she is away.

Write every such question and the answer given into the record of the case.
