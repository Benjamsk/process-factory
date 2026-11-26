# Case 2: Head of IT on holiday when a bug exposes another school's pupils

Kind: Person away

## Situation

Marius Tangen is on holiday for two weeks and is not reachable. On a Wednesday at 11:00 a teacher telephones support: in the reading app she can see the names, classes and reading levels of pupils at a school that is not hers. The support person who takes the call telephones about it the same hour. The release that caused it went out eight days ago, so the reading app is still exposing the data while the call is being handled.

## Who acts

Lead developer, Amina Farah.

## What the person knows

She knows what the teacher described and which release went out eight days ago. She knows the code of the reading app and the pupil data it stores, and that Marius Tangen is away. She does not yet know how many pupils of how many school owners were visible, whether any teacher other than the caller looked at them, or whether a narrower fix than taking a part of the app offline will close it; the Nordsky Cloud access logs and the code have to be read for that.

## What should happen

Amina Farah steps in for Marius Tangen. The case reaches her within 1 hour of the report. She secures the Nordsky Cloud access logs before the bug is fixed in production, and the logs are secured and the breach stopped within 4 hours. If there is no narrower way than taking the reading app or a part of it offline, she is the one who decides that, and Jonas Vikane and Silje Haugland are told the moment it happens. Kari Nordmann and Ingrid Solheim have the case within 4 hours. Amina Farah owns the fact page and Jonas Vikane signs it off, within 24 hours of the report. The data is pupil data of the reading app, where the company is the processor, so every affected school owner is told within 24 hours of the company becoming aware, at the same time and before Datatilsynet is notified, with Ingrid Solheim deciding what the message says, Kari Nordmann writing the part about the data and Silje Haugland sending it. The specification does not say who decides whether this is a real breach while Marius Tangen is away: it gives Amina Farah the fact page and the decision on taking the app offline, and gives Kari Nordmann the decision that a case is not a breach. The gap is not filled here.

## Pass

The report reached Amina Farah by 12:00. A copy of the Nordsky Cloud access logs was secured before the fix went to production, and the exposure was closed by 15:00. If a part of the reading app went offline, Amina Farah took that decision and Jonas Vikane and Silje Haugland were told at that moment. The fact page exists within 24 hours, is owned by Amina Farah and carries Jonas Vikane's sign-off. Every affected school owner received the message within 24 hours of 11:00 on the Wednesday and before any notification to Datatilsynet.
