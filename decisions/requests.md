# Product decisions: requests

Example for the made-up product. One file per feature, so the agents read only the choices that touch what is under review. A finding that contradicts a decision must say so; the synthetic user does not overrule one.

| ID | Decision | Why | Date |
|---|---|---|---|
| D-01 | The product does not send answers to the person. The privacy lead sends them from the shop's own email and marks the request as answered, with the date sent. | The person wrote to that address, and the shop keeps one channel. Known effect: the product records the date the lead enters, not proof of delivery. | 2026-10-01 |
| D-02 | A request past its due date stays at the top of the list, marked "overdue", until someone closes it. It never leaves the list on its own. | A request nobody closed is still open. | 2026-10-01 |
| D-03 | The Extend button stays disabled until the lead writes the reason, which goes into the letter to the person. | The person must be told the reasons (PRIV-03). | 2026-10-08 |
