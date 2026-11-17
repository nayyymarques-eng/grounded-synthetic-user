# Prompt: draft the official rules

Run it in Claude Code, in your project. An agent drafts the official rules, in the product spec's `spec/sources/`, from your PRD (the product requirements document: what the product does and for whom) and the official texts you point it to. Every rule comes back marked "to confirm". A person reads each official text before marking a rule "checked".

Fill in the parts in angle brackets. `<interval>` is how long a checked rule lasts before it is read again; each business sets it.

```text
Read the PRD at <path or link> to learn what the product does and for whom.
The rules it works under come from these official sources: <list of laws,
regulations, regulator norms and official guidance, with their addresses>.

Write down the official rules this product works under, in spec/sources/.

1. Keep only the rules the product in the PRD depends on: what users must do,
   by when, with which values, and what happens if they do not. Leave out the
   rest.
2. One table, with the columns of spec/sources/README.md (one file per topic
   if the list is long). Each
   rule is one line with: an ID; the rule in plain words; the source, with the
   article or section and its address; the jurisdiction and the date the rule
   takes effect; "Checked on" left empty, for the person who reads the
   official text; the mark "to confirm"; and the date it must be read again,
   either when the authority publishes a new value or <interval> from today.
3. Quote nothing you did not read in the source. If a source cannot be
   opened, list the rule as a gap with the reason, and do not fill it from
   memory.
4. Where two sources disagree, keep both lines and say so.
5. At the end, list the questions a human expert must answer before any rule
   is marked "checked".
```

Then: have a person read each official text and mark each rule they checked, as `spec/sources/README.md` says.
