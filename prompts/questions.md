# Prompt: draft the questions

Run it after the knowledge base and the persona sheets exist. An agent drafts the questions every review must answer. A person reads and edits the draft before the first review, then pastes the questions into the table in `.claude/skills/synthetic-user/report-template.md`.

Fill in `<number>`: how many interviews make a trait strong. Each business sets it.

```text
Read the persona sheets in .claude/skills/synthetic-user/persona-sheets/ and the knowledge base in knowledge-base/.
Write the questions every review of our product must answer.

1. From the knowledge base, write the questions an expert in these rules would
   ask about any feature, screen or text, such as whether it is correct, safe
   and honest under these rules. Write a few that apply to everything, not one
   per rule or per topic: each review answers them against every rule on the
   pages that apply. Each one is a single sentence that can be answered with
   yes or no and a reason.
2. From the persona sheets, write the questions a user in each role would ask:
   one per need, not one per screen. Each question names the traits it comes
   from and their strength. A question that rests only on weak traits (fewer
   than <number> interviews, heard second-hand, or a hypothesis) is marked
   low evidence.
3. Every review answers every question, so merge any two questions that check
   the same thing.
4. Do not write a question that no rule or trait supports. List the ones you
   wanted to write but could not support, as gaps for the next interview or for
   an expert.
5. Return a table: question, asked as (expert or user), source, strength.
```
