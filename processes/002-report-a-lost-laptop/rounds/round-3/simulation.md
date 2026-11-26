# simulation review of draft-4.md

Verdict: CHANGES

- [high] Steps 4 to 7 and `Who must be told`: the draft never says that Nora Lind is told when the accounts and access are blocked. The only telling of Nora Lind in the draft is in step 22 and in `Who must be told`, about how long the person could not work, so whoever follows the draft ends the sessions, changes the password, revokes the tokens and blocks the device and goes on to the facts without telling her at all. The draft must say in steps 4 to 7, and in `Who must be told`, that Marius Tangen tells Nora Lind that the person's accounts and access are blocked as soon as they are, because the person cannot work until it is undone. (case 1, case 2, case 3, case 5, case 6, case 7, case 8, case 9, case 10, case 11, case 14, case 15, case 16, case 19, case 21, case 22)
- [high] Step 18 and `When this applies`: the draft says that the record holds the moment the loss reached the company and the moment of the decision, but never says when the 72 hours of `Handle a personal data breach` begin, so whoever decides a loss is a personal data breach counts them from the decision and the record says nothing about it. The draft must say that the 72 hours of `Handle a personal data breach` count from the moment the loss reached the company and not from the decision, because that moment is the moment the company became aware. (case 18, case 22)
- [low] `If something does not fit`: the draft names no one to turn to where it does not cover the situation, so a person who meets one has nobody to ask. The draft must name whom to turn to. spec.md does not name anyone either. (case 5, case 17, case 21)

## Case 1: Laptop left in a train luggage rack

Would do: He opens the record at 10:40 and writes the time of the report, who reported it and what she said, locates and locks the laptop in device management well before 11:40, then before 12:40 ends Hanne Riise's sessions, changes her password and revokes her access tokens in the office suite, Nordsky Cloud and the support desk and blocks the device, tells Kari Nordmann about the lost laptop as he starts on the facts, writes all six facts into the record by 14:40 with the four from device management, what Hanne Riise gives him and what the sign-in and access logs show, tells Hanne Riise by 14:40 the five things about what he reads and why, decides the wipe by 14:40 after asking Kari Nordmann because the laptop held personal data and because it was signed in to the support desk, tells Hanne Riise beforehand and asks what exists only on it, wipes it and records what was lost, leaves the police out because it was mislaid, has Tomas Berg tell the insurer within 3 working days because it cost 14,200 kroner, gives her a replacement laptop and her access back within 2 working days and tells Nora Lind how long she could not work, and puts the replacement and the lost laptop into the equipment register.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked, because no step of the draft says to, so the record holds no such entry by 12:40.
Result: FAIL at step 7

## Case 2: The laptop is found in a school staff room

Would do: He records the report at 13:20, locks the laptop by 14:20, ends the sessions, changes the password, revokes the tokens and blocks the device by 15:20, tells Kari Nordmann as he starts on the facts, writes the six facts into the record by 17:20 with `not established` and a reason where one is missing, tells Petter Dahl what he reads and why by 17:20, decides the wipe by 17:20 after asking Kari Nordmann because the laptop held personal data, and when the school telephones at 15:20 writes into the record when and where the laptop was found and whether anyone else could have reached it, undoes nothing until he has checked the laptop and written that it is safe to use again, and gives Petter Dahl a laptop and his access back within 2 working days with Nora Lind told how long he could not work.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 15:20, because no step of the draft says to.
Result: FAIL at step 7

## Case 3: Work bag taken from a car on a Saturday night

Would do: He takes the call at 22:50, locates and locks the laptop in device management at once without asking anyone, revokes the access token and locks the account in Nordsky Cloud, writes the time of the call and what he did into the record, and telephones Marius Tangen at once on his mobile, who takes over everything beyond Nordsky Cloud and does the rest himself or writes into the record what waits until working hours; Marius Tangen then ends the sessions, changes the password, revokes the tokens and blocks the device by 00:50, tells Henrik Aas of Aas & Wold because it is a Saturday, has the six facts in the record by 02:50, decides the wipe by 02:50 on the ground that the laptop was taken after asking Henrik Aas and telling Jonas Vikane beforehand, has Henrik Aas's breach decision in the record by 02:50, helps Jonas Vikane report the theft to the police within 24 hours, has Tomas Berg tell the insurer within 3 working days and gives the replacement and the access back within 2 working days.
Stops at: nowhere
Gets wrong: Nobody tells Nora Lind that the accounts and access are blocked when the measures are finished by 00:50, because no step of the draft says to.
Result: FAIL at step 7

## Case 4: The 72 hours for a waiting wipe run out on a Sunday

Would do: He locks the tablet by 10:20 on the Thursday, ends the sessions, changes the password, revokes the tokens and blocks the device by 11:20, tells Kari Nordmann as he starts on the facts, has the six facts in the record by 13:20, decides the wipe by 13:20 and, because none of the five grounds is true, waits and writes into the record that he decided to wait and why, and because the draft says every time runs around the clock he treats the 72 hours as falling at 09:20 on the Sunday rather than on the Monday: on the Sunday morning he either wipes the tablet, telling Sondre Lie beforehand and asking what exists only on it and writing what was lost into the record, or, where the hotel has found it, writes into the record when and where it was found and whether anyone else could have used it and lets nothing be undone until he has said it is safe to use again.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 5: The head of IT is on holiday with his telephone off

Would do: She takes the report at 14:10 as the one who steps in for the head of IT, opens the record and writes the time, who reported it and what he said, locates and locks the work phone by 15:10, ends Jostein Vold's sessions, changes his password, revokes his access tokens and blocks the device by 16:10, tells Kari Nordmann as she starts on the facts, has the six facts in the record by 18:10 with `not established` and a reason where one is missing, tells Jostein Vold what is read about him and why by 18:10, decides the wipe by 18:10 on the ground that the phone was taken, asks Kari Nordmann first because it held personal data, tells Jostein Vold beforehand and asks what exists only on it, gives him the help the head of IT gives with the report to the police within 24 hours, leaves the insurer out because the phone cost 8,900 kroner, and gives him a replacement device and his access back within 2 working days with Nora Lind told how long he could not work.
Stops at: nowhere
Gets wrong: She never tells Nora Lind that the accounts and access are blocked by 16:10, because no step of the draft says to, and the draft does not say whom an employee telephones in working hours when the head of IT cannot be reached, so nothing about that gap reaches the record.
Result: FAIL at step 7

## Case 6: The loss is reported three days after it was noticed

Would do: He writes into the record that Lise Berntsen reported the loss at 09:05 on the Monday and noticed it at about 19:00 on the Friday, counts every time from 09:05 because the draft says every time counts from the moment the loss reached the company, locks the laptop by 10:05, ends the sessions, changes the password, revokes the tokens and blocks the device by 11:05, tells Henrik Aas of Aas & Wold because Kari Nordmann works Tuesday to Thursday and it is a Monday, has the six facts in the record by 13:05 including whether anything was reached from the laptop after 16:00 on the Friday, tells Lise Berntsen what he reads and why by 13:05, decides the wipe by 13:05 on the ground that the laptop was signed in to Nordsky Cloud after asking Henrik Aas and telling her beforehand, has Henrik Aas's breach decision in the record by 13:05, and runs the police report, the insurer and the replacement from 09:05.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 11:05, because no step of the draft says to.
Result: FAIL at step 7

## Case 7: A hotel reports the laptop while its user is on a flight

Would do: He writes into the record at 11:00 that Petter Dahl, not the employee, reported the loss, locks the laptop by 12:00 without waiting for Silje Haugland because locking needs no asking, ends her sessions, changes her password, revokes her tokens and blocks the device by 13:00, tells Kari Nordmann as he starts on the facts, writes the six facts into the record by 15:00 with every fact only she can give marked `not established` with the reason that she could not be reached and fills them in when she lands, sends her by 15:00 at her work email the five things about what he reads and why and says them again when he first speaks to her, decides the wipe by 15:00 after asking Kari Nordmann because the laptop held personal data and does not hold the wipe back more than an hour on her account, and because the laptop is at the hotel reception writes into the record when and where it was found and whether anyone else could have used it, undoing nothing until he has said it is safe to use again, and gives her a laptop and her access back within 2 working days.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 13:00, because no step of the draft says to.
Result: FAIL at step 7

## Case 8: Nobody can be asked before a wipe that is already due

Would do: He records the report at 10:00, tries to locate and lock the laptop by 11:00 and writes into the record that it could not be located, ends Thea Nygard's sessions, changes her password, revokes her tokens and blocks the device by 12:00, telephones the emergency number of Aas & Wold as he starts on the facts and writes every attempt and its time into the record, has the six facts in the record by 14:00 with `not established` and a reason for those device management cannot give, and because the draft says that where neither Kari Nordmann nor Henrik Aas can be reached within the 4 hours he decides the wipe alone where a ground is met, he decides it himself by 14:00 on the grounds that the laptop was taken and cannot be located, tells Thea Nygard beforehand and asks what exists only on it, decides the breach question himself within the same 4 hours and writes into the record what he tried, when and what he based it on, helps her report the theft within 24 hours, has Tomas Berg tell the insurer within 3 working days because the laptop cost 16,500 kroner, and gives her a replacement laptop and her access back within 2 working days.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 12:00, because no step of the draft says to.
Result: FAIL at step 7

## Case 9: The employee boards a flight right after reporting the loss

Would do: He records the report at 11:00, tries to locate and lock the laptop by 12:00 and writes into the record that it could not be located, ends Maja Eriksen's sessions, changes her password, revokes her tokens and blocks the device by 13:00, tells Kari Nordmann as he starts on the facts, has the six facts in the record by 15:00 with what only Maja Eriksen can give beyond what she said at 11:00 marked `not established` with the reason that she could not be reached, decides the wipe by 15:00 after asking Kari Nordmann on the ground that the laptop cannot be located, tries to reach Maja Eriksen beforehand and writes the attempt and its time into the record, holds the wipe back no longer than an hour on her account and then wipes the laptop, writes into the record that what existed only on it is not known because she could not be reached, and runs the police report, the insurer and the replacement from 11:00.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 13:00, because no step of the draft says to.
Result: FAIL at step 7

## Case 10: A memory stick with support case exports is missing

Would do: He treats the memory stick as covered because the draft covers any memory stick with company data on it, writes into the record that the device cannot be reached from device management and why and lets the locating, the block and the wipe fall away, ends Sondre Lie's sessions, changes his password and revokes his access tokens in the office suite, Nordsky Cloud and the support desk by 11:30, tells Kari Nordmann as he starts on the facts, writes all six facts into the record by 13:30 with the four from device management marked `not established` because it is not a managed device, the ones from the sign-in and access logs marked `not established` because a memory stick signs in to no system, and what Sondre Lie cannot say marked `not established` with that reason, tells him by 13:30 what is read about him and why, treats what was on the stick as exposed because he cannot confirm it was encrypted, leaves the police out while nothing shows it was taken, and gives him his access back within 2 working days.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 11:30, because no step of the draft says to.
Result: FAIL at step 6

## Case 11: A private laptop used for work is stolen

Would do: He records the report at 13:10, does not locate, lock, block or wipe the laptop because the company does not own it, ends Petter Dahl's sessions, changes his password and revokes his access tokens in the office suite, Nordsky Cloud and the support desk by 15:10, tells Kari Nordmann as he starts on the facts, writes the six facts into the record by 17:10 with the four from device management marked `not established` because the laptop is not a company device and the rest from Petter Dahl and from the sign-in and access logs, tells him by 17:10 what is read about him and why, writes into the record that the device was private and what he says was on it, helps him with what the company knows while he reports the theft to the police himself within 24 hours, leaves the insurer out and gives no replacement because the draft says the company does neither for a device it does not own, and gives him his access back within 2 working days.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 15:10, because no step of the draft says to.
Result: FAIL at step 6

## Case 12: A returned laptop is gone from the IT cupboard

Would do: He starts the process at 10:00 because the draft starts it the moment a device cannot be accounted for and treats a device nobody reported missing exactly like one an employee reported, writes the report into the record, locates and locks the laptop by 11:00 without asking anyone, blocks it in device management by 12:00 and writes into the record that the account of the person who had it was already closed and when in place of the sessions, the password and the tokens, tells Henrik Aas of Aas & Wold because it is a Monday, answers for the device himself and has Nora Lind give what the company knows in place of the facts only that person could give, writes the six facts into the record by 14:00 with `not established` and the reason where one is left, decides the wipe by 14:00 after asking Henrik Aas because the laptop held personal data and wipes it at once because there is nobody to tell beforehand, has Henrik Aas's breach decision with his name, reason and time in the record by 14:00, gives no replacement because there is no person behind the device, and marks the laptop in the equipment register as lost with the date.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 13: A register check finds a laptop an employee who left never handed back

Would do: He opens the record at 09:00 and writes that his own check of the equipment register was how the loss was noticed, locates and locks the laptop by 10:00 without asking anyone, writes into the record that the person's account was already closed and when in place of the sessions, the password and the tokens, blocks the device by 11:00, tells Kari Nordmann as he starts on the facts because she works on Tuesdays, answers for the device himself and takes from Nora Lind who had the laptop, that she left on 31 August 2026, what she handed back and that she said it had been taken from her car in August, writes the six facts into the record by 13:00 with `not established` and a reason for what is left, decides the wipe by 13:00 on the ground that it was taken after asking Kari Nordmann and wipes it at once because there is nobody to tell beforehand, has her breach decision with her name, reason and time in the record by 13:00, reports the theft to the police himself with the serial number within 24 hours, has Tomas Berg tell the insurer within 3 working days because the laptop cost 15,900 kroner, gives no replacement and marks the laptop in the equipment register as lost with the date.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 14: An external disk with a cloud key on it, and nobody can say it was encrypted

Would do: He writes the report into the record at 08:45, writes that the disk cannot be reached from device management and why and lets the locating, the block and the wipe fall away, ends Lise Berntsen's sessions, changes her password and revokes her access tokens in the office suite, Nordsky Cloud and the support desk by 10:45 and changes or revokes the Nordsky Cloud service account key that was on the disk in every system it could reach by 10:45, writes into the record that the disk counts as unencrypted and its data is treated as exposed because he cannot confirm from the equipment register or the purchase that it was an encrypted device, tells Kari Nordmann as he starts on the facts, writes the six facts into the record by 12:45 with the four from device management and the ones from the logs marked `not established` with their reasons and the rest from Lise Berntsen, tells her by 12:45 in the same answer what is read about her and why, has Kari Nordmann's breach decision in the record by 12:45, helps her report the theft within 24 hours, leaves the insurer out because the disk cost 1,400 kroner, and gives her her access back within 2 working days with Nora Lind told how long she could not work.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 10:45, because no step of the draft says to.
Result: FAIL at step 6

## Case 15: The employee must be told at three in the morning what is read about them

Would do: He takes over from Erik Moen, who locked the laptop and revoked the Nordsky Cloud token at 23:10, ends Jostein Vold's sessions, changes his password and revokes his access tokens in the office suite, Nordsky Cloud and the support desk and blocks the device by 01:10 and writes into the record anything he decides must wait until working hours, tells Henrik Aas of Aas & Wold on the firm's emergency number because it is a Saturday, has the six facts in the record by 03:10, tells Jostein Vold by 03:10 in the same answer in which he asks for the facts all five things about what he reads and why, because the draft says every time runs around the clock through every evening and weekend, decides the wipe by 03:10 after asking Henrik Aas and telling Jostein Vold beforehand and asking what exists only on it, has Henrik Aas's breach decision with his name, reason and time in the record by 03:10, and gives the replacement laptop and the access back within 2 working days with Nora Lind told how long he could not work.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 01:10, because no step of the draft says to.
Result: FAIL at step 7

## Case 16: Neither the data protection officer nor her stand-in answers within four hours

Would do: He takes over from Erik Moen, who locked the phone at 08:00, ends Hanne Riise's sessions, changes her password, revokes her access tokens and blocks the device by 10:00, telephones the emergency number of Aas & Wold at 09:10, 10:15 and 11:40 and writes every attempt and its time into the record, has the six facts in the record by 12:00 and tells Hanne Riise by 12:00 what is read about her and why, and because the draft says that where neither Kari Nordmann nor Henrik Aas can be reached within the 4 hours he decides the wipe alone where a ground is met, he decides it himself at 12:00 on the ground that the phone was taken, reaches Hanne Riise beforehand, tells her it will be wiped, asks what exists only on it, writes her answer into the record and wipes it, decides the breach question himself within the same 4 hours and writes into the record what he tried and when and what he based it on, tells Henrik Aas at 17:00 at the first hour one of them is reachable, helps her report the theft within 24 hours, leaves the insurer out because the phone cost 9,400 kroner, and gives her a replacement device and her access back within 2 working days.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 10:00, because no step of the draft says to.
Result: FAIL at step 7

## Case 17: The report ends up with the head of finance on a Friday night

Would do: He takes the report at 22:00 and, because the draft says the one who took the report and has no access to device management does four things and nothing in the systems, opens the record and writes into it that the report reached the company at 22:00, that Thea Nygard reported it, that she noticed at 21:30, what she said and that he is holding the case, telephones in order the on-call number, Marius Tangen's mobile and then Amina Farah, not by email, and keeps trying every 30 minutes until one of them answers, writing each attempt and its time into the record, tells Thea Nygard that the case is held and that someone will come back to her, asks her for the facts while she is on the telephone anyway and writes them into the record, counts the lock as due by 23:00 and the sessions, the password, the tokens and the block as due by 00:00 from 22:00 and lets those deadlines keep running, holds the case until Marius Tangen or Amina Farah writes in the record that they have taken it, and tells the insurer within 3 working days because the laptop cost 16,500 kroner.
Stops at: nowhere
Gets wrong: Nothing of what he does, though the draft does not say whether the unanswered call to the on-call number at 21:40 is itself the moment the loss reached the company and names nobody he could ask, so nothing about that reaches the record.
Result: PASS

## Case 18: Pupil data is downloaded from the laptop after it went missing

Would do: She takes the six established facts, sees that the screen was not locked and that a pupil data export was downloaded with Amina Farah's account at 13:50 after the laptop went missing, decides by 18:00 that the loss is a personal data breach and writes the decision into the record with her name, the reason and the time, in the same hour tells Marius Tangen and Ingrid Solheim that it is a personal data breach and that `Handle a personal data breach` now runs, hands the holding of both processes to Marius Tangen with one record and one timeline and has the record say both the moment the loss reached the company, 14:00, and the moment of her decision, decides what is looked at beyond the window from 13:30 to the block and why and writes that into the record while drawing no conclusion about how Amina Farah works, and lets this process run on to its end, which her decision does not bring about.
Stops at: nowhere
Gets wrong: She never records that the 72 hours of `Handle a personal data breach` count from 14:00, the moment the loss reached the company and the company became aware, rather than from her decision, because the draft nowhere says when those 72 hours begin.
Result: FAIL at step 18

## Case 19: A private laptop is stolen and the employee still needs something to work on

Would do: He records the report at 08:30, does not locate, lock or wipe the laptop because the company does not own it, ends Maja Eriksen's sessions, changes her password and revokes her access tokens in the office suite, Nordsky Cloud and the support desk by 10:30, tells Kari Nordmann as he starts on the facts, writes the six facts into the record by 12:30 with the four from device management marked `not established` because the laptop is not a company device and the rest from her and from the sign-in and access logs, tells her by 12:30 in the same answer what is read about her and why, has Kari Nordmann's breach decision with her name, reason and time in the record by 12:30, helps her with what the company knows while she reports the theft to the police herself within 24 hours, leaves the insurer out and does not replace her own laptop, gives her a company laptop within 2 working days because she needs one to work and gives her her access back, puts that laptop into the equipment register, tells Nora Lind how long she could not work, and writes into the record that the device was private, what she says was on it and that the company could not reach it.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 10:30, because no step of the draft says to.
Result: FAIL at step 6

## Case 20: No address reaches the former employee who must be told

Would do: She gives Marius Tangen what the company knows in place of the facts only the person who had the laptop could give, namely that this former employee had it, that she left in October 2026, what she handed back and that she said in the call at 14:40 that it was taken in a burglary on 18 November, and because the person has left the company she sends her the same five things Marius Tangen would tell an employee, in writing and by 15:00 on the Thursday, which is 24 hours from the report at 15:00 and not a working-day count, at the private email address and then the private postal address in the employment files; when the email bounces, the letter comes back on 2 December marked that she has moved and the private telephone number no longer answers, she writes into the record that no address the company holds reaches her and what was tried and when, and does not drop the telling but holds it to be sent at the first address the company later has.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 21: The laptop of an employee on three weeks' leave is gone from his desk

Would do: He records the report at 10:40, locates and locks the laptop by 11:40 without asking anyone, ends Jostein Vold's sessions, changes his password, revokes his access tokens and blocks the device by 12:40 without waiting for him to answer his telephone, tells Kari Nordmann as he starts on the facts, treats the device as one with no person behind it because Jostein Vold cannot be reached, has Nora Lind give what the company knows, writes the six facts into the record by 14:40 with everything still open marked `not established` with its reason and asks Jostein Vold for those facts as soon as he can be reached, sends him by 14:40 at his work email all five things about what is read about him and why and says them again when he first speaks to him, decides the wipe by 14:40 after asking Kari Nordmann on the ground that the laptop was signed in to the office suite and the support desk, tries to reach him beforehand and holds the wipe back no longer than an hour on his account, has Kari Nordmann's breach decision in the record by 14:40, leaves the police out while it is not established that the laptop was taken, has Tomas Berg tell the insurer within 3 working days, and gives a replacement laptop and the access back within 2 working days with Nora Lind told.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 12:40, because no step of the draft says to, and the draft does not say what she gives in place of the facts only a person who is away rather than gone could give, nor what the replacement and the access back mean for someone on leave for three weeks, and names nobody he could ask.
Result: FAIL at step 7

## Case 22: The head of IT decides the breach question himself, and it is reversed the next morning

Would do: He records the report at 09:00, locates and locks the laptop by 10:00, ends Sondre Lie's sessions, changes his password, revokes his access tokens and blocks the device by 11:00, telephones the emergency number of Aas & Wold at 09:30, 10:30, 11:30 and 12:30 and writes each attempt and its time into the record, has the six facts in the record by 13:00 with whether the screen was locked marked `not established` and why, tells Sondre Lie by 13:00 what is read about him and why, decides the wipe alone by 13:00 because neither Kari Nordmann nor Henrik Aas can be reached and the laptop was taken, telling Sondre Lie beforehand and recording what was lost, decides the breach question himself within the same 4 hours and, because he cannot establish that the loss is not a personal data breach, decides that it is one and starts `Handle a personal data breach` at once, writes into the record that he decided it himself, whom he tried and when and what he based it on, tells Ingrid Solheim because the draft says she is told when the loss is a personal data breach, holds both processes with one record and one timeline, tells Kari Nordmann at 08:30 on the Tuesday, lets her line that it was not a personal data breach after all stand without undoing the wipe, the lock, the block or the measures on the accounts, and runs the police report, the insurer, the replacement and the closing line to the end.
Stops at: nowhere
Gets wrong: He never tells Nora Lind that the accounts and access are blocked by 11:00, and he never records that the 72 hours of `Handle a personal data breach` count from 09:00 rather than from his own decision, because the draft says neither.
Result: FAIL at step 7

## Case 23: The managing director holds the case for five hours on a Sunday

Would do: She takes the report at 11:20 and, because the draft says the one who took the report and has no access to device management does four things and nothing in the systems, opens the record and writes into it that the report reached the company at 11:20, that Maja Eriksen reported it, that she noticed at 11:00 and had the laptop at 10:30 in the hotel breakfast room, and that she is holding the case, telephones in order the on-call number, Marius Tangen's mobile and then Amina Farah, not by email, and keeps trying every 30 minutes until 16:00, writing each attempt and its time into the record, tells Maja Eriksen that the case is held and that someone will come back to her, asks her for the facts while she is on the telephone anyway and writes them into the record, lets the deadlines keep running so that the lock due at 12:20 and the measures and the block due at 13:20 are missed and the record names each missed deadline and why, telephones Henrik Aas of Aas & Wold on the firm's emergency number at 15:20 because four hours have passed with nobody who has access to the systems reachable and writes that into the record, and hands the case to Amina Farah at 16:00 when she writes in the record that she has taken it and carries on from the step the process has reached rather than beginning again.
Stops at: nowhere
Gets wrong: nothing
Result: PASS
