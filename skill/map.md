# The map

Where each review starts. One row per kind of work under review. Each row names the official rules to read in `spec/sources/`, the roles to run, and the questions that weigh most. The decisions to respect are the rows of `spec/decisions.md` whose "Applies to" names the flow or screen under review. Add a row when a new kind of work appears.

Example for the made-up product (privacy requests):

| Kind of work | Official rules | Roles | Questions that weigh most |
|---|---|---|---|
| Deadline, extension or reminder | PRIV-01 to PRIV-03 | privacy lead | E2, E3, U1 |
| Identity check | PRIV-07 | privacy lead, support agent | E4, U2 |
| Fee, refusal or copy of the data | PRIV-05, PRIV-06, PRIV-08 | privacy lead | E1, E4 |
| Intake, from the support inbox to the privacy lead | PRIV-01, PRIV-07 | support agent, privacy lead | E2, U2 |
| Answer, refusal or closing a request | PRIV-01, PRIV-04, PRIV-05 | privacy lead | E1, U3 |
| Help text or email that states a rule | the rules it states | privacy lead | E1, E3 |

Every review still answers every question. The last column says which ones to read most closely.
