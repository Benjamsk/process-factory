# Case 12: The only way to stop it is to take the reading app offline

Kind: Conflicting rules

## Situation

On a Tuesday at 10:15, in the middle of the school day, a developer reports that any logged-in teacher can call an address in the reading app that returns the read-aloud recordings of any pupil at any school. Amina Farah reads the code and says a narrow fix has to be written and tested and cannot be in production for another day. The only thing that stops the exposure now is to take the part of the reading app that serves the recordings offline, which stops that part of teaching in 310 schools.

## Who acts

Head of IT, Marius Tangen.

## What the person knows

He knows what the developer reported and what Amina Farah says about how long a narrow fix takes. He knows that the recordings are pupil data of the reading app, so the company is the processor and the school owners are the controllers, and he knows that taking the part offline stops teaching in 310 schools. He does not know how many recordings were fetched, by whom, or which school owners the pupils belong to; the Nordsky Cloud access logs have to be read for that.

## What should happen

Two rules of the specification pull in different directions. The logs must be secured and the breach stopped within 4 hours of the report, and the reading app or a part of it goes offline only when there is no narrower way to stop the breach, because that stops teaching in 310 schools. The specification settles it on the second rule read together with the first: when no narrower way exists inside the time the breach has to be stopped, as here, Marius Tangen is the one who decides to take the part offline, and Amina Farah decides when he is away. Before anything is deleted or fixed in production he exports and copies the Nordsky Cloud access logs out of the normal 90-day retention. The moment the part of the app goes offline he tells Jonas Vikane and Silje Haugland, because teaching stops. He writes in the record the time of the report and who reported it, and Kari Nordmann and Ingrid Solheim have the case within 4 hours. Pupils and school owners are affected, so support is closed on the subject of the breach: Petter Dahl switches the AI support assistant into hand-over for breach cases and puts the standing holding message into the support desk and writes down when, and the sentences support may use stand in the support desk within 4 hours of the report, decided by Ingrid Solheim and checked by Kari Nordmann. Marius Tangen owns and signs off the fact page within 24 hours, with Amina Farah doing the work in the systems. Every affected school owner is told within 24 hours of the company becoming aware. The specification does not say for how long the app stays offline or who decides to put it back; it says only when it goes offline and who decides that. The gap is not filled here.

## Pass

A copy of the Nordsky Cloud access logs was secured before the part of the app went offline and before any fix went to production. The exposure was stopped by 14:15 on the Tuesday. The record names Marius Tangen as the one who decided to take the part of the reading app offline, and shows that Jonas Vikane and Silje Haugland were told at the moment it happened and not later. The record names 10:15 as the time of the report and names the developer who reported it. Kari Nordmann and Ingrid Solheim had the case by 14:15, sentences support may use stood in the support desk by 14:15, and the record says when the AI support assistant was switched into hand-over and who did it. Every affected school owner received its own message within 24 hours of 10:15.
