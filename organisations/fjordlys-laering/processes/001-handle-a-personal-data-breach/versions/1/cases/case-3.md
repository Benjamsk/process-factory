# Case 3: A support case was reclassified as a normal bug five days ago

Kind: Late or wrong notice

## Situation

On a Monday at 14:00 Petter Dahl is going through the support queue and finds a case from the Wednesday before. It arrived at 08:30 that day. A teacher had written that when she opened a pupil's reading history she saw a pupil from another school, and she named that pupil. The case was tagged as a display bug and put in the queue for the development teams, and nobody telephoned the head of IT. Five days have passed and the data is still exposed.

## Who acts

Support lead, Petter Dahl.

## What the person knows

He knows the text of the case, the time it arrived in the support desk and that it was tagged as a bug instead of being telephoned through. He knows the support service levels and that the case was never escalated as a breach. He does not know what the Nordsky Cloud access logs show, how many pupils are affected or which school owners they belong to.

## What should happen

The support person who saw the case should have telephoned Marius Tangen the same hour, and reclassifying such a case as a normal bug is the known weak point of the trigger. Petter Dahl telephones Marius Tangen now, and Marius Tangen has the case within 1 hour. The clock of the process starts when the report reached the company, which is 08:30 on the Wednesday before, not when Petter Dahl read it. Marius Tangen secures the Nordsky Cloud access logs before the bug is fixed in production and stops the breach, writes down the time of the report and who reported it, and Kari Nordmann and Ingrid Solheim have the case within 4 hours. Kari Nordmann keeps one list of duties for the case, and the deadline that binds the case is the earliest one on it. The specification does not say what is done when the deadlines ran out before anyone noticed the report: it says only that the clock starts at the moment the report arrives, and that the 24 hours to the school owners and the 72 hours to Datatilsynet run from the company becoming aware. The gap is not filled here, and what is still required is that the logs are secured, the breach is stopped, the school owners are told and the record carries the real times.

## Pass

Marius Tangen had the case by 15:00 on the Monday, after a telephone call from Petter Dahl and not only a tag in the support desk. The record of the case names 08:30 on the Wednesday before as the time of the report and names the teacher who reported it, and the timeline shows the five days with real timestamps. A copy of the Nordsky Cloud access logs was secured before any fix went to production. Kari Nordmann and Ingrid Solheim had the case within 4 hours of Petter Dahl's call. Kari Nordmann's list of duties for the case exists and says which deadline binds the case.
