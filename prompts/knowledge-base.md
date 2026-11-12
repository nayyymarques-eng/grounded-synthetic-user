# Prompt: draft the knowledge base

Run it in Claude Code, in your project. An agent drafts the knowledge base from your PRD (the product requirements document: what the product does and for whom) and the official texts you point it to. Every rule comes back marked "to confirm". A person reads each official text before marking a rule "checked".

Fill in the parts in angle brackets. `<interval>` is how long a checked rule lasts before it is read again; each business sets it.

```text
Read the PRD at <path or link> to learn what the product does and for whom.
The rules it works under come from these official sources: <list of laws,
regulations, regulator norms and official guidance, with their addresses>.

Build a knowledge base for this product.

1. Keep only the rules the product in the PRD depends on: what users must do,
   by when, with which values, and what happens if they do not. Leave out the
   rest.
2. One page per topic. Each rule is one line with: an ID; the rule in plain
   words; the source, with the article or section and its address; the
   jurisdiction and the date the rule takes effect; the date you read it; the
   mark "to confirm"; and the date it must be read again, either when the
   authority publishes a new value or <interval> from today.
3. Quote nothing you did not read in the source. If a source cannot be
   opened, list the rule as a gap with the reason, and do not fill it from
   memory.
4. Where two sources disagree, keep both lines and say so.
5. At the end, list the questions a human expert must answer before any rule
   is marked "checked".
```

Then: read `knowledge-base/README.md` for the format, and have a person check each rule.
