# grounded-synthetic-user

A framework for building a synthetic user that checks a regulated product's rules and logic: templates, prompts, a black-box hook, a verifier agent and an eval suite. Grounded in the written rules and real user interviews.

The full write-up, with a worked example: [How to build a synthetic user for a regulated business](https://nayaramarques.com/synthetic-users).

## The problem

In a regulated product, a wrong rule costs more than a bad screen: a missed legal deadline, a fee charged under the wrong rule, a form that asks for less than the regulator requires. The rules are many, and they change. The people who build the product are rarely experts in those rules, and the experts do not have time to review every feature, or to follow every change.

## What this kit does

It sets up an AI agent in Claude Code that reviews a feature, a spec, a screen or a public text as one of your users would, a user who also knows the rules. It answers a fixed list of questions, one row each, from two sources:

- **The knowledge base**: the written rules your product depends on, each with an ID, its official source and the date a person checked it.
- **Persona sheets**: what real users said in interviews, each trait with its source and how many interviews say it.

It never reads the code. A second agent tries to prove each finding wrong before it reaches you. An eval checks that the agent still catches known errors after anyone edits it. A third agent watches the official sources for changes.

## What is in it

| File | What it is |
|---|---|
| `skill/SKILL.md` | The steps the synthetic user follows, and its limits |
| `skill/map.md` | Where each review starts: for each kind of work, the pages, decisions, roles and questions |
| `skill/persona-sheets/` | One sheet per role, from interviews |
| `skill/report-template.md` | The questions, one row each, then every rule checked, by ID |
| `knowledge-base/` | One page per topic, one row per rule |
| `decisions/` | Product decisions, one file per feature, so a choice made on purpose is not flagged as an error |
| `specs/` | What is under review, in the user's terms |
| `eval/` | Test cases the synthetic user must pass. It never reads them |
| `agents/synthetic-user.md` | Reviews a spec, or walks the product as one role |
| `agents/verifier.md` | Tries to prove each finding wrong, and compares roles at each handoff |
| `agents/rules-watch.md` | Reads the official sources for changes. Not tested yet |
| `hooks/black-box.mjs` | Lets the agents read the spec and the knowledge base, and refuses the code |
| `hooks/settings.json` | Runs the hook before every tool call an agent makes, from the project's settings |
| `prompts/` | The prompts that draft the knowledge base and the questions |

Everything in `knowledge-base/`, `skill/persona-sheets/`, `decisions/` and `eval/` is an example for a made-up product: an inbox where a shop's privacy lead answers people's requests about their personal data, under the GDPR. Replace it with your own.

## Install in Claude Code

From your project's root, with this kit cloned next to it:

```sh
KIT=../grounded-synthetic-user
mkdir -p .claude/skills .claude/agents .claude/hooks
cp -r $KIT/skill .claude/skills/synthetic-user
cp $KIT/agents/*.md .claude/agents/
cp $KIT/hooks/black-box.mjs .claude/hooks/
cp -n $KIT/hooks/settings.json .claude/settings.json   # if you already have one, add its hook block by hand
cp -r $KIT/knowledge-base $KIT/decisions $KIT/specs $KIT/eval $KIT/reviews .
```

Then:

1. Open `.claude/hooks/black-box.mjs` and check the folder names at the top match your project.
2. Run the hook's tests from the kit: `node --test hooks/black-box.test.mjs`.
3. Open Claude Code in your project and accept the workspace trust dialog, so the project's hooks run. The hook lives in `.claude/settings.json`, not in the agent files: Claude Code skips an agent's own hooks in any `claude -p` run, and the agent would run with no guard. It knows each agent by its name, so keep the names `synthetic-user`, `verifier` and `rules-watch`, or rename the profiles at the top of the hook.
4. For a product walk, give `agents/synthetic-user.md` a browser tool (see the note at the end of that file).

The hook needs Node.js 18 or later.

## First run

1. **Knowledge base.** Run `prompts/knowledge-base.md` with your PRD and your official sources. Have a person read each official text before marking a rule `checked`.
2. **Persona sheets.** Interview real users first. Write one sheet per role, each trait with its source and strength (`skill/persona-sheets/README.md`).
3. **Questions.** Run `prompts/questions.md`. Read and edit the draft, then paste it into `report-template.md`.
4. **Map.** Add one row per kind of work in `skill/map.md`.
5. **Decisions.** Write down the choices you made on purpose, one file per feature, in `decisions/`.
6. **Eval.** Write a few cases from your own past errors and choices in `eval/cases.md`.
7. **Review.** Ask Claude Code: "Use the synthetic-user agent to review specs/<file> as <role>, in a spec review." Then: "Use the verifier on that report."

The smallest start: one knowledge base page, one role, one spec review.

To try it before writing your own, install the kit as it is and ask: "Use the synthetic-user agent to review specs/request-intake.md as privacy lead, in a spec review." The example spec has errors on purpose.

## What you can change

A few choices change from one business to the next. The rest is the framework.

| Part | What each business sets | Where | What stays the same |
|---|---|---|---|
| Evidence | How many interviews a trait needs to be strong | `prompts/questions.md`, `skill/persona-sheets/README.md` | Anything weaker is marked low evidence, never dropped |
| Official sources | Which sources the agents may open | `knowledge-base/README.md` | Every rule cites its official text; a source an agent cannot open stays a gap until a person reads it |
| Rules watch | How often the sources are read, and how long a checked rule lasts | your scheduler, `knowledge-base/README.md` | A changed rule goes back to "to confirm", and every review that cited it is listed to run again |
| Roles | Which roles run | `skill/persona-sheets/`, `skill/map.md` | Each role runs as its own agent; a role without interviews runs as low evidence |
| Human expert | Who answers the open questions | `skill/SKILL.md` | No finding reaches a person before the verifier; a finding that rests on a rule "to confirm" goes to the expert |
| Eval | The cases, and how many times each one runs | `eval/` | The synthetic user never reads the cases; every case passes before the next review |

Fixed in every setup: every question is answered in every review, every rule has an ID and a source, only a person marks a rule `checked`, and the code stays out of the agents' reach.

## Limits

- A synthetic user does not replace real users, least of all for product strategy. It cannot tell you what to build or discover new needs. It checks each feature against the rules and against what real users said.
- It is not professional advice. It checks against the rules as written in your knowledge base, and sends what needs an expert to a list for one.
- It checks a rule as written, not how a court or a regulator applies it in practice.
- It does not test usability. The user questions check each feature against what people said they need, not whether they can use it.
- In a product walk, it meets only the situations the demo copy holds.
- The verifier tests the findings it is given; it does not look for what the synthetic user missed. The eval is a regression test: it shows known errors are still caught, not that every error is.
- On the rules, it is as reliable as the knowledge base. A rule marked `checked` by mistake reaches every review.
- The hook checks paths, not intent. It stops the agents from reading the code by accident; it is not a sandbox. The agent files say the same in words.
- The rules watch is designed but not tested yet.

## License

MIT
