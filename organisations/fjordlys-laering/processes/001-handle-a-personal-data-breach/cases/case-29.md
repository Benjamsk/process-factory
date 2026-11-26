# Case 29: A step the on-call developer cannot take in Nordsky Cloud

Kind: Outside working hours

## Situation

On Saturday 28 November 2026 at 22:10 an employee in finance telephones the on-call number. He clicked a link in an email on the Friday evening, typed his password into the page, and his office suite account has been sending mail since. His mailbox holds payroll correspondence about all 48 employees. He also has an account in Nordsky Cloud. Erik Moen is on call that week.

## Who acts

On-call developer, Erik Moen.

## What the person knows

He has the report on the on-call telephone. He knows that he can revoke an access token and lock an account in Nordsky Cloud, restart and roll back the reading app, and that he cannot lock the account in the office suite, where Marius Tangen is the tenant administrator. He knows that Marius Tangen can be reached on his mobile around the clock and that Saturday is not one of Kari Nordmann's working days. He does not know what was sent from the mailbox or who read it; the logs have to be read for that.

## What should happen

The times of the process run around the clock, so the Saturday evening is not different from a Tuesday morning. The clock starts at 22:10, when the report reached the company. Outside working hours Erik Moen does at once, without waiting for a decision, every one of closing the access, revoking the token and locking the account that the role can do in Nordsky Cloud, so he revokes the employee's token and locks his Nordsky Cloud account, and then tells Marius Tangen what was done and when. Locking the account in the office suite is not something the role can do in Nordsky Cloud, so Marius Tangen decides it, and he is reached on his mobile. Erik Moen secures the logs for the case before anything in production is changed, and the logs are secured and the breach stopped within 4 hours of 22:10. He starts the fact page with what is known in the first hours, and Marius Tangen or Amina Farah takes it over. Kari Nordmann and Ingrid Solheim have the case within 4 hours: because Saturday is not one of Kari Nordmann's three working days the case goes to Henrik Aas on the firm's emergency number and does not wait for Tuesday, and Ingrid Solheim is reached on her mobile. At the same time Marius Tangen tells Nora Lind, because the breach touches employee data in the office suite, so that she starts her part. Whether this is a real personal data breach is Marius Tangen's judgement, or Amina Farah's when he is away, and not Erik Moen's, and the case may not be closed by Marius Tangen even where it looks obvious to him.

## Pass

The record names 22:10 on the Saturday as the time of the report and the employee as the one who reported it. The employee's access token was revoked and his Nordsky Cloud account locked by Erik Moen before any decision was waited for, and the record says which of closing the access, revoking the token and locking the account were done, which were not and why, when each was done and by whom. The record shows that Erik Moen told Marius Tangen what he had done and when, and that Marius Tangen, not Erik Moen, decided about locking the account in the office suite. The logs were secured and the breach stopped by 02:10 on the Sunday. A fact page exists, started by Erik Moen with what was known in the first hours. Henrik Aas and Ingrid Solheim had the case by 02:10 on the Sunday, and Nora Lind was told in the same step.
