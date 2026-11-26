# Case 34: The on-call developer does not answer and nobody in support answers either

Kind: Person away

## Situation

On Saturday 28 November 2026 at 19:30 an employee telephones the on-call number: a report she exported from the reading app, with the names, classes and reading levels of pupils at several schools, is reachable on a public web address. Erik Moen holds the on-call telephone that week and does not answer; it rings out three times. The employee looks up the rota in the staff handbook, which names Lise Berntsen as the stand-in for that week, and telephones her at 19:45. Marius Tangen answers his mobile. When Lise Berntsen telephones Silje Haugland and Petter Dahl at home, neither of them answers.

## Who acts

On-call developer, Lise Berntsen, the stand-in named on the weekly rota for the week beginning 23 November 2026.

## What the person knows

She knows what the employee told her and that she is the stand-in named on the rota for that week. She knows that the role takes the report outside working hours, that she can revoke an access token and lock an account in Nordsky Cloud and restart and roll back the reading app, and that Marius Tangen can be reached on his mobile around the clock. She knows that Saturday is not one of Kari Nordmann's three working days. She does not know how many pupils are in the report, which school owners they belong to or whether anyone outside the company fetched it; the Nordsky Cloud access logs have to be read for that.

## What should happen

Every time of the process runs around the clock, so the Saturday evening is no different from a Tuesday morning, and the clock starts at 19:30, when the report reached the company. Where a role is away, the person who steps in is the one the organisation names, and for the on-call developer that is the stand-in on the weekly rota, so Lise Berntsen takes the report and the case is not left because Erik Moen did not answer. She reaches Marius Tangen, who takes the case within 1 hour of the report. She does at once, without waiting for a decision, every one of closing the access, revoking the token and locking the account that the role can do in Nordsky Cloud, and then tells Marius Tangen what was done and when; Marius Tangen decides about anything the role cannot do, and what was done, what was not done and why goes into the record. The logs are secured before anything is fixed in production and the breach is stopped within 4 hours of 19:30. She starts the fact page with what is known in the first hours, and Marius Tangen or Amina Farah takes it over. She asks the people responsible for the affected systems for him. Kari Nordmann and Ingrid Solheim have the case within 4 hours; because Saturday is not one of Kari Nordmann's working days it is Henrik Aas of Aas & Wold on the firm's emergency number, and Ingrid Solheim is reached on her mobile. Pupils and school owners are affected, so she switches on the standing configuration and puts the standing holding message into the support desk and writes down when, and she telephones Silje Haugland and Petter Dahl at home at once; where neither answers she telephones Ingrid Solheim and tells her that support has nobody. Every affected school owner is told within 24 hours of 19:30 and before any notification to Datatilsynet.

## Pass

The record names 19:30 on the Saturday as the time of the report and the employee as the one who reported it, and shows that Lise Berntsen took it as the stand-in named on the rota after Erik Moen did not answer. Marius Tangen had the case by 20:30. The record says which of closing the access, revoking the token and locking the account were done, which were not and why, when each was done and by whom, and that Lise Berntsen told Marius Tangen what she had done and when. A copy of the Nordsky Cloud access logs was secured before any fix went to production, and the public address was closed by 23:30. A fact page exists, started by Lise Berntsen with what was known in the first hours. Henrik Aas and Ingrid Solheim had the case by 23:30. The record says when the standing configuration was switched on and the standing holding message put in, and names Lise Berntsen as the one who did it. The record shows that she telephoned Silje Haugland and Petter Dahl at home, that neither answered, and that she then telephoned Ingrid Solheim and told her that support has nobody.
