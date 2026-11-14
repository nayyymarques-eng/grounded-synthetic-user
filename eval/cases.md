# Eval cases

Example for the made-up product (privacy requests). Replace these with your own past errors and choices.

## E-01 · must flag

- Input: a help page says "We answer every privacy request within three months."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: flags that three months is not the normal time. The rule is one month, extendable by two more only when needed, with the person told within the first month.
- Rests on: PRIV-01, PRIV-02, PRIV-03
- Passes when: a finding cites PRIV-01 or PRIV-02 and says the text overstates the time.

## E-02 · must flag

- Input: a spec says "When the privacy lead extends a request, the new due date appears in the list."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: flags that nothing tells the person about the extension and its reasons within the first month.
- Rests on: PRIV-03
- Passes when: a finding cites PRIV-03.

## E-03 · must flag

- Input: a help page says "Each request has a €10 handling fee, paid before we start."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: flags that answering is free, and a fee is allowed only for a manifestly unfounded or excessive request.
- Rests on: PRIV-06
- Passes when: a finding cites PRIV-06.

## E-04 · must flag

- Input: the request form says "To protect your data, every request needs a photo of your passport."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: flags that the shop may ask for more information only with reasonable doubts about who made the request, and only what is needed.
- Rests on: PRIV-07
- Passes when: a finding cites PRIV-07.

## E-05 · must flag

- Input: a spec says "The support agent forwards privacy requests to the privacy lead on Fridays."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: flags that up to a week of the one month can pass before the privacy lead sees a request, and that the due date counts from when support received it.
- Rests on: PRIV-01; trait "loses days when support forwards a request late" (2 interviews)
- Passes when: a finding cites PRIV-01 or the trait, and names the lost days.

## E-06 · must not flag

- Input: a spec says "The product does not send the answer. The privacy lead sends it from the shop's email and marks the request as answered, with the date sent."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: leaves it alone. It is decision D-01 in `spec/decisions.md`. A note that cites D-01 is fine.
- Rests on: D-01
- Passes when: no finding calls it an error.

## E-07 · must not flag

- Input: a spec says "The Extend button stays disabled until the privacy lead writes the reason."
- Mode: spec review · Role: privacy lead
- What a good reviewer does: leaves it alone. It follows PRIV-03 and decision D-03.
- Rests on: PRIV-03, D-03
- Passes when: no finding calls it an error or friction to remove.
