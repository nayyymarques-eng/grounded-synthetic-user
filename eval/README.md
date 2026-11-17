# The eval

The verifier checks the findings of one review. The eval checks the synthetic user itself: that it still catches what it should after someone edits it.

## When to run it

Each time a file of the synthetic user changes (the skill, the map, the report template) or the spec it reads changes (a persona sheet, an official rule, a decision), before the synthetic user reviews anything else.

It is a regression test: it shows the synthetic user still catches known errors, not that it catches every error.

## The cases

`cases.md` holds the test cases. Each gives the synthetic user something to review and says what a good reviewer does with it, citing the rule IDs or traits it rests on:

- **Must flag**: a past error the synthetic user has to find.
- **Must not flag**: a product choice made on purpose that it has to leave alone, so an agent that flags everything does not pass.

The list grows with use. Every error the synthetic user missed becomes a case it must flag. Every finding the verifier dropped becomes a case it must not flag. When a rule changes, search the cases for its ID and update the ones built on the old version.

The synthetic user never reads this folder: the hook blocks it, so it cannot learn the answers. Keep it at the project root, apart from the skill, whose folder the synthetic user reads. The hook refuses any folder named `eval`, wherever it sits, in case one ends up inside an allowed folder.

## How to run it

Ask Claude Code, in your main session:

> Run the synthetic user eval in eval/cases.md.

The main session:

1. Reads `cases.md`.
2. For each case, starts the `synthetic-user` agent with only the case's input, mode and role, and tells it the input is the whole text under review, so it does not open other specs. Never the expected answer. The agent writes no file: it returns its whole report in its reply, and the main session saves it in `eval/runs/`. There the synthetic user cannot read it, and the rules watch does not count it as a review. A model's answer varies from one run to the next, so each case runs more than once (three times, unless you set another number).
3. Starts a second agent, on a different model from the synthetic user, to grade each saved report against the case's "Passes when". A report passes when it flags what the case says it must, citing the rule's ID, or leaves alone what it must not flag.
4. Lists each case as pass or fail, with the reason. A case passes only when every run of it passes.

The eval passes only when every case passes. A failed case is fixed in the file that caused it, and the eval runs again.

## Set for your business

- **The cases.** Start with your own past errors and the choices you made on purpose. The ones in `cases.md` belong to the made-up example product.
- **How many times each case runs.** Three by default.
