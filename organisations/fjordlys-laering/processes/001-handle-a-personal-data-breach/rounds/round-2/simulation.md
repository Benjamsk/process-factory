# simulation review of draft-2.md

Verdict: PASS

- [low] Step 14 and step 16: the draft does not say which school owners are told when the logs cannot say whose recordings were fetched, and the section "If something does not fit" names no one to turn to; the fact page says "not established" while step 16 still requires that "every affected school owner" is told. `spec.md` does not say this either. (case 6)
- [low] "When this applies", the two situations: the draft names only pupil data in the reading app as processor data, so for pupil spreadsheets exported into the office suite the person finds neither answer nor anyone to turn to; only step 14 lets it be written as not established. `spec.md` does not say this either. (case 7)
- [low] Step 11: the draft says nothing about an answer the AI support assistant has already sent before the configuration was changed, and names no one to turn to for it. `spec.md` does not say this either. (case 8)

## Case 1: Nordsky AS reports an open storage bucket

Would do: He reads "When this applies", sees that Nordsky AS reporting a breach starts the process and that the clock runs from 09:10, takes the report (step 1), exports and copies the Nordsky Cloud access logs out of the normal retention before anything is fixed in production (step 2), confirms the access is closed (step 3), writes down the time of the report and who reported it (step 4), tells Kari Nordmann and Ingrid Solheim, who are both at work (step 5), decides that this is a real breach (step 6) and, because pupils and school owners are affected, closes support to the subject (step 8), so the AI support assistant goes into hand-over and the standing holding message goes into the support desk (steps 9 and 10) and Silje Haugland and Petter Dahl are telephoned at once; Petter Dahl changes the configuration himself in working hours (step 11) and Ingrid Solheim's wording, checked by Kari Nordmann, is in the support desk within 4 hours (step 12). He owns and signs off the fact page within 24 hours with Amina Farah doing the work in the systems, including the line that the company is the processor (step 14), Kari Nordmann keeps the one list of duties (step 15), Silje Haugland sends the one message to both school owners within 24 hours of 09:10 and before Datatilsynet (step 16), he draws up the list of measures with one named person each (step 20), and Ingrid Solheim closes the case after Kari Nordmann says the record is complete and no earlier than 72 hours after 09:10 (step 21).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 2: Head of IT on holiday when a bug exposes another school's pupils

Would do: She reads "Who does what", sees that she steps in for the head of IT while Marius Tangen is away, and takes the report within 1 hour (step 1). She secures a copy of the Nordsky Cloud access logs before the bug goes anywhere near production and closes the exposure within 4 hours (steps 2 and 3); step 3 gives her the decision on taking the reading app or a part of it offline while Marius Tangen is away, and Jonas Vikane and Silje Haugland are told the moment it happens. She writes down the time of the report and who reported it (step 4), tells Kari Nordmann and Ingrid Solheim within 4 hours (step 5), and decides that this is a real breach (step 6) and that support is closed to the subject (step 8). Step 14 gives her the fact page within 24 hours with Jonas Vikane signing it off, and step 16 sends Ingrid Solheim's message, with Kari Nordmann's part about the data, to every affected school owner within 24 hours of 11:00 and before Datatilsynet is notified.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 3: A support case was reclassified as a normal bug five days ago

Would do: He reads "When this applies", sees that a teacher writing to support about seeing another school's pupils is a report and that the support person must telephone Marius Tangen the same hour rather than only tag the case, and telephones Marius Tangen at once, so that Marius Tangen has the case by 15:00. The same section tells him that the clock starts when the report reached the company and not when someone got round to reading it, so the report time of the case is 08:30 on the Wednesday before, which is what step 4 has written down together with the teacher who reported it; the record then carries the five days with real timestamps ("What to record"). Marius Tangen secures the Nordsky Cloud access logs before the bug is fixed in production (step 2), stops the breach (step 3), and tells Kari Nordmann and Ingrid Solheim (step 5), and Kari Nordmann keeps the one list of duties whose earliest deadline binds the case (step 15). He also goes on collecting the questions support cannot answer for Kari Nordmann (step 13).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 4: Friday night report and the head of IT does not answer

Would do: He reads "When this applies" and step 1, which give him the report when Marius Tangen cannot be reached and tell him to wake him, so he keeps telephoning until Marius Tangen answers, and the record names who called him and when. Step 3 gives him the revoking of the access token and the locking of the account in Nordsky Cloud outside working hours, done well inside the 4 hours from 23:40, and the Nordsky Cloud access logs are secured out of the normal retention (step 2); step 14 has him start the fact page with what is known in the first hours. Step 5 tells him that Friday is not one of Kari Nordmann's three working days, so Henrik Aas of Aas & Wold is telephoned on the firm's emergency number and the case does not wait for Tuesday, and Ingrid Solheim is reached on her mobile, both within 4 hours. When support is closed to the subject (step 8) he switches on the standing configuration Petter Dahl prepared and puts the standing holding message into the support desk (steps 9 and 10), telephones Silje Haugland and Petter Dahl at home at once and, when neither answers, escalates to Ingrid Solheim ("When to hand over"); the record says when this was done and that he did it. He leaves the decision whether this is a real breach to the head of IT (steps 6 and 8).
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 5: Payroll breach that a newspaper is already asking about

Would do: He takes the report forwarded by Tomas Berg within 1 hour of 08:00 (step 1 and "When this applies" for Lønn Norge AS), stops the breach and writes down the time of the report and who reported it (steps 3 and 4), and tells Kari Nordmann and Ingrid Solheim by 12:00 (step 5). He decides that this is a real breach (step 6). At step 8 he reads both rules: the journalist makes it likely that the breach becomes publicly known, which closes support to the subject, while a breach of employee data alone does not; the step settles it with "When you are unsure, close it", so he closes it, and the record says when and by whom, and the same step has head of people Nora Lind prepare in writing what managers may say to staff who ask. Step 17 gives Ingrid Solheim the decision on Datatilsynet at the latest 48 hours after the report, after advice from Kari Nordmann and after asking him what happened in the systems, with the decision, its reason and her name in the record either way; step 18 has Kari Nordmann write and send the notification within 72 hours after he has checked the technical description and Ingrid Solheim has approved it; step 19 has Nora Lind tell the employees within 24 hours of the decision, with Kari Nordmann's part about the data and what the person can do. No school owner is told, because no pupil data of the reading app is involved ("Who must be told").
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 6: The access logs have already rolled over

Would do: He follows step 2 and keeps the secured copy of what is left of the Nordsky Cloud access logs where Kari Nordmann can find it again ("What to record"), and follows step 14 for the fact page within 24 hours of 10:00, which he owns and signs off with Amina Farah doing the work in the systems. The page states the four-month window; because the logs cannot tell whether anyone fetched a recording, step 14 tells him to write that access cannot be ruled out and to treat the case as accessed. The pupils and the school owners the logs cannot identify he writes as not established, because step 14 tells him to write what cannot be established as not established and to leave nothing blank, and the page is not final until Kari Nordmann says she has what she needs. The record says what the logs showed and what could not be established ("What to record"). Which school owners are told while the logs cannot say whose recordings were fetched he does not find in the draft, and the last section tells him that no one is named to turn to.
Stops at: nowhere; step 16 gives the message to Silje Haugland, so the open question about which school owners are told does not stop him on his own steps
Gets wrong: nothing
Result: PASS

## Case 7: Documents about pupils in the office suite

Would do: She reads "When this applies", which puts the office suite inside the scope, names Marius Tangen as the tenant administrator Microsoft reports through, and says that a breach touching both kinds of data is one case with one record and one timeline that is not split in two; she has the case within 4 hours of 13:00 together with Ingrid Solheim (step 5). She keeps the one list of duties with the pupil side and the controller side on the same list and names the earliest deadline as the one that binds (step 15), and she keeps the one record with the one timeline for the case ("What to record"). She advises Ingrid Solheim, whose decision on Datatilsynet for the teacher data the company is controller for goes into the record with its reason and her name at the latest 48 hours after the report, so by 13:00 on the Saturday (step 17). For the exported spreadsheets about pupils that sit in the office suite she finds no answer whether the company is controller or processor, and she holds the fact page open under step 14 until she has what she needs, with that part written as not established.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 8: The AI support assistant answers a teacher who asks about the leak

Would do: He reads step 11, which is his step in working hours, and changes the configuration of the AI support assistant himself so that it hands over to a human every case that touches the breach, on the ordinary signs a teacher would use, words such as leak, hacked, data, privacy or Datatilsynet, and a complaining parent; he writes down when he changed it, and the record holds that ("What to record"). He does not switch the assistant off, because it keeps answering ordinary support cases from the approved help articles, and it says nothing about the breach itself, not even that there is one. The four cases that use those words go to a human support person under the changed configuration. Step 12 has Ingrid Solheim's wording, checked by Kari Nordmann, in the support desk within 4 hours of the report, so by 13:00, replacing the standing holding message, and he keeps to those sentences himself. Step 13 has him bring the questions support cannot answer to Kari Nordmann the same day. What to do about the four answers the assistant has already sent he does not find in the draft.
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 9: Not a breach, on a Monday

Would do: He reads "When this applies", which names a phishing click by an employee as a start of the process and says that a case that is not a breach is closed with a line in the record, so a document is written for the case the same day ("What to record"). He writes down the time of the report and who reported it (step 4) and tells the data protection officer and Ingrid Solheim within 4 hours; step 5 tells him that Monday is not one of Kari Nordmann's three working days, so he telephones Henrik Aas of Aas & Wold on the firm's emergency number and does not wait for Tuesday. At step 6 he judges that this is not a breach but does not close the case, because that step and "When to hand over" say he may not close his own case; step 7 gives the decision to the data protection officer, which on a Monday is Henrik Aas, who must agree and who writes the line in the record himself with his name and his reason. The record also holds what he did and what the sign-in logs showed, and the secured logs are stored where Kari Nordmann can find them again ("What to record"). Nobody outside the company is told ("Who must be told").
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 10: A parent writes to the managing director

Would do: She reads "When this applies", which says that a parent writing to the managing director is a report, that whoever receives it forwards it to Marius Tangen and telephones him, and that the clock starts at 16:20 when the email arrived and not at 16:25 when she read it, so she forwards the email and telephones him rather than only forwarding it, and he has the case by 17:20 (step 1). The same section says all the times run around the clock, so Marius Tangen secures the Nordsky Cloud access logs before anything is deleted or fixed in production and closes the page that evening, both within 4 hours of 16:20 (steps 2 and 3), writes down 16:20 and the parent as the one who reported it (step 4), and has her and Kari Nordmann, or Henrik Aas if she is away, on the case within 4 hours (step 5). Because this is pupil data of the reading app she decides what the message to every affected school owner says, Kari Nordmann writes the part about the data and Silje Haugland sends it to all of them at the same time within 24 hours of 16:20 and before Datatilsynet is notified (step 16), and whether the parents are told is left to the school owner (step 16 and "When this applies").
Stops at: nowhere
Gets wrong: nothing
Result: PASS

## Case 11: The 24 hours to the school owners run out at 03:00 on a Sunday

Would do: She was telephoned at home when support was closed to the subject (step 10) and reads step 16, which is her step: she sends the message Ingrid Solheim decided, with the part about the data Kari Nordmann wrote, to every affected school owner within 24 hours of the report and before Datatilsynet is notified, to all 41 at the same time and not to the big ones first. "When this applies" tells her that the 24 hours run around the clock from 03:00 on the Saturday, including the weekend, so she sends it on the Saturday evening rather than waiting for Monday morning, and the message says what happened, which data and how many pupils are affected, what the company has done and what the school owner should do. Each school owner's own 72 hours then start when it is told (step 16). The record holds the message that went to the school owners and who was told and when ("What to record"), and had she not been reachable, "When to hand over" gives the step to Petter Dahl and, when neither of them answers at home, escalates it to Ingrid Solheim.
Stops at: nowhere
Gets wrong: nothing
Result: PASS
