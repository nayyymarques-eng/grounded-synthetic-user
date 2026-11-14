# grounded-synthetic-user

A framework for building a synthetic user that helps define and check a regulated product: a skill, agents, a black-box hook, a verifier and an eval suite. It reads everything it knows from the product spec: the official rules and what real users said.

The full write-up, with a worked example: [How to build a synthetic user for a regulated business](https://nayaramarques.com/synthetic-users).

## The problem

In a regulated product, a wrong rule costs more than a bad screen: a missed legal deadline, a fee charged under the wrong rule, a form that asks for less than the regulator requires. The rules are many, and they change. The people who build the product are rarely experts in those rules, and the experts do not have time to review every feature, or to follow every change.

## What this kit does

It sets up an AI agent in Claude Code that reviews a feature as one of your users would, a user who also knows the rules. It works in two modes:

- **Spec review**, to help define a feature: before it is built, it reads the feature's flow, screens and cases in the spec.
- **Product walk**, to validate it: once it is built, it walks a demo copy of the product in a browser.

It answers a fixed list of questions, one row each, from two sources. Both live in the product spec, from [product-spec](https://github.com/nayyymarques-eng/product-spec), not in this kit:

- **The official rules** (`spec/sources/`): laws, regulator guidance and contracts, each rule with an ID, its official text and the date a person checked it.
- **The persona sheets** (`spec/personas/`): what real users said in interviews, each trait with its source and how many interviews say it.

It also reads the product decisions (`spec/decisions.md`), so it does not flag a choice made on purpose. It never reads the code. A second agent tries to prove each finding wrong before it reaches you. An eval checks that the agent still catches known errors after anyone edits it. A third agent watches the official sources for changes.

## What is in it

| File | What it is |
|---|---|
| `skill/SKILL.md` | The steps the synthetic user follows, and its limits |
| `skill/map.md` | Where each review starts: for each kind of work, the official rules, roles and questions |
| `skill/report-template.md` | The questions, one row each, then every rule checked, by ID |
| `eval/` | Test cases the synthetic user must pass. It never reads them |
| `agents/synthetic-user.md` | Reviews a feature in the spec, or walks the product as one role |
| `agents/verifier.md` | Tries to prove each finding wrong, and compares roles at each handoff |
| `agents/rules-watch.md` | Reads the official sources for changes |
| `hooks/black-box.mjs` | Lets the agents read the spec, and refuses the code |
| `hooks/settings.json` | Runs the hook before every tool call an agent makes, from the project's settings |
| `prompts/` | The prompts that draft the official rules and the questions |
| `reviews/` | Where the reports go |

The examples in `skill/map.md` and `eval/` are for a made-up product: an inbox where a shop's privacy lead answers people's requests about their personal data, under the GDPR. Its spec is the example in product-spec. Replace both with your own.

## Install in Claude Code

From your project's root, with this kit cloned next to it:

```sh
KIT=../grounded-synthetic-user
mkdir -p .claude/skills .claude/agents .claude/hooks
cp -r $KIT/skill .claude/skills/synthetic-user
cp $KIT/agents/*.md .claude/agents/
cp $KIT/hooks/black-box.mjs .claude/hooks/
cp -n $KIT/hooks/settings.json .claude/settings.json   # if you already have one, add its hook block by hand
cp -r $KIT/eval $KIT/reviews .
# the spec: install product-spec first, so spec/ is at your project's root
```

Then:

1. Open `.claude/hooks/black-box.mjs` and check the folder names at the top match your project.
2. Run the hook's tests from the kit: `node --test hooks/black-box.test.mjs`.
3. Open Claude Code in your project and accept the workspace trust dialog, so the project's hooks run. The hook lives in `.claude/settings.json`, not in the agent files: Claude Code skips an agent's own hooks in any `claude -p` run, and the agent would run with no guard. It knows each agent by its name, so keep the names `synthetic-user`, `verifier` and `rules-watch`, or rename the profiles at the top of the hook.
4. For a product walk, give `agents/synthetic-user.md` a browser tool (see the note at the end of that file). Serve the demo copy as you ship it, with no folder listings and no source maps: the hook checks the address the agent asks for, not where a click lands, so a link to a code file is a way in.

The hook runs on Node.js 18 or later, and was tested on 18, 22, 24 and 26. Use a version that still gets security updates: the current LTS release.

## First run

1. **Product spec.** Install [product-spec](https://github.com/nayyymarques-eng/product-spec) and write the product level of your spec: roles, goals, decisions.
2. **Official rules.** Run `prompts/official-rules.md` with your PRD and your official sources. It writes them in `spec/sources/`. Have a person read each official text before marking a rule `checked`.
3. **Persona sheets.** Interview real users first. Write one sheet per role in `spec/personas/`, each trait with its source and strength.
4. **Questions.** Run `prompts/questions.md`. Read and edit the draft, then paste it into `report-template.md`.
5. **Map.** Add one row per kind of work in `skill/map.md`.
6. **Eval.** Write a few cases from your own past errors and decisions in `eval/cases.md`.
7. **Review.** Ask Claude Code: "Use the synthetic-user agent to review spec/flows/<flow>.md as <role>, in a spec review." Then: "Use the verifier on that report."

The smallest start: one feature, its official rules, one role and one spec review.

To try it on the example, install product-spec and this kit as they are, and ask: "Use the synthetic-user agent to review spec/flows/answer-a-request.md as privacy lead, in a spec review."

## What you can change

A few choices change from one business to the next. The rest is the framework.

| Part | What each business sets | Where | What stays the same |
|---|---|---|---|
| Evidence | How many interviews a trait needs to be strong | `prompts/questions.md`, `spec/personas/README.md` | Anything weaker is marked low evidence, never dropped |
| Official sources | Which sources the agents may open | `spec/sources/README.md` | Every official rule cites its official text; a source an agent cannot open stays a gap until a person reads it |
| Rules watch | How often the sources are read, and how long a checked rule lasts | your scheduler, `spec/sources/README.md` | A changed rule goes back to "to confirm", and every review that cited it is listed to run again |
| Roles | Which roles run | `spec/personas/`, `skill/map.md` | Each role runs as its own agent; a role without interviews runs as low evidence |
| Human expert | Who answers the open questions | `skill/SKILL.md` | No finding reaches a person before the verifier; a finding that rests on a rule "to confirm" goes to the expert |
| Eval | The cases, and how many times each one runs | `eval/` | The synthetic user never reads the cases; every case passes before the next review |

Fixed in every setup: every question is answered in every review, every rule has an ID and a source, only a person marks a rule `checked`, and the code stays out of the agents' reach.

## Limits

- A synthetic user does not replace real users, least of all for product strategy. It cannot tell you what to build or discover new needs. It checks each feature against the rules and against what real users said.
- It is not professional advice. It checks against the official rules as written in your spec, and sends what needs an expert to a list for one.
- It checks a rule as written, not how a court or a regulator applies it in practice.
- It does not test usability. The user questions check each feature against what people said they need, not whether they can use it.
- In a product walk, it meets only the situations the demo copy holds.
- The verifier tests the findings it is given; it does not look for what the synthetic user missed. The eval is a regression test: it shows known errors are still caught, not that every error is.
- On the rules, it is as reliable as the official rules in the spec. A rule marked `checked` by mistake reaches every review.
- The hook checks paths, not intent. It stops the agents from reading the code by accident; it is not a sandbox. The agent files say the same in words.
- The rules watch reads each source with WebFetch, which returns a summary with short quotes, not the full text. It finds a changed deadline or amount; a person still reads the full text before marking a rule `checked`.

## Versions

- **v2, 14 November 2026.** The synthetic user keeps nothing of its own. The official rules, the persona sheets and the product decisions moved to the product spec, where the whole product reads them, and the synthetic user reads them there. Its two modes are named for what they do: the spec review helps define a feature, the product walk validates it.
- **v1, 12 November 2026.** The synthetic user kept its own knowledge base of rules, its persona sheets and one decision file per feature.

## License

MIT
