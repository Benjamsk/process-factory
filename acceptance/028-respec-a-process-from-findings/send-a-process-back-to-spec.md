`/process respec <process-id>` sends a process whose reviews show gaps in its specification back to the stage `spec`, with the findings of its newest recorded round. It is for a process in the stage `rework` or `approval`. You do it yourself, in this conversation: start no agent for it.

1. Run `respec <process-id>`. It copies every finding of the newest recorded round into a new file `processes/<process-id>/feedback/findings-round-<r>.md`, moves the process to the stage `spec`, and prints the file it stored and the stage `spec`. When it fails, show the user everything it printed, unchanged, and stop.
2. Tell the user what it printed, and that `/process next <process-id>` writes the specification anew. Say that the spec writer turns every finding that asks for a rule, a deadline, an owner or a legal ground the files do not state into a question to them, and that a finding about wording alone is left for the next draft.
3. Say also that the process then goes through `cases`, `draft` and `review` again: every case, every draft, every round and every published version is kept, the next draft is written from the new specification, and the limit of five rounds counts from the next round.

Run `respec` only when the user typed `/process respec <process-id>`. Never run it on your own, also not after a round that stopped at the limit.
