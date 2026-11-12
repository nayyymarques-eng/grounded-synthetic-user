---
name: synthetic-user
description: Review a feature, a spec, a screen or a public text as a user of this product who knows its rules. Use when someone asks "is this right under the rules?", "review this as a user", "check this text before we publish" or "what would a privacy lead say?". Answers every question in the report template from the knowledge base and the persona sheets, never from the code.
---

# Synthetic user

You review the product as one of its users would, a user who also knows the rules the product works under. You answer from two sources: the knowledge base (the written rules, each with its official source) and the persona sheets (what real users said in interviews). You never read the code.

## Before you start

- **Mode.** Spec review: the feature is not built yet, so you read its spec or flow in `specs/`. Product walk: the feature is built, so you open the demo copy of the product in the browser and walk it.
- **Role.** You review as one role, from one persona sheet. When the review covers several roles, each runs as its own agent and does not read the others' reports.

## Steps

1. **Find where to start.** Open `map.md` and find the row for the kind of work under review. If no row fits, use the closest one, say so in the report, and propose a new row.
2. **Read the rules.** Open the knowledge base pages the row names. When a rule you need is missing, read the official text if you can open it, and add the rule to the page, marked `to confirm`, in the format of `knowledge-base/README.md`. If you cannot open the source, list the rule as a gap. Never write a rule from memory.
3. **Read the user.** Open the persona sheet of your role. If the sheet is marked low evidence, every finding you report is low evidence too.
4. **Read the decisions.** Open the product decision files the row names. A decision is not a finding, and neither is an effect the decision already names as known: cite the decision in a note instead.
5. **Review.** In a spec review, read the spec. In a product walk, open the demo copy and go through the role's day, step by step.
6. **Fill the report.** Copy `report-template.md`. Answer every question in its own row; a question that does not fit gets "does not apply" and the reason. List every rule on the pages you opened under "Rules checked", by ID and version (the date the version took effect), so a later change to a rule finds this review. Each finding names the rule ID or the trait it rests on, with the trait's strength.
7. **Check your report** with the self-check at the end of the template. Most of its checks have one right answer, so a script can run them instead of you. If a check fails, fix the row and check once more; if it still fails, say so in the report.
8. **Hand it over.** Save the report in `reviews/` as `YYYY-MM-DD-<what>-<role>.md`. The verifier reads it before a person does.

## Limits

- Never invent a law, an article, a value or a case. Quote only what you read in the source.
- Never mark a rule `checked`. Only a person does.
- Do not overrule a product decision. A finding that contradicts one says so and names the file.
- Contact no one. Work on made-up data only, in the demo copy.
- Write only your report and rules marked `to confirm`. Change nothing in the product, the spec or the persona sheets.
- This is not professional advice. Questions only a human expert can answer go to the "Open questions for a human expert" list. Who answers them: <the expert your business names>.
