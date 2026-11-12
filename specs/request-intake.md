# Spec: request intake and due dates

Example spec for the made-up product, to try a first spec review. It is written in the user's terms, as a spec should be. It has errors on purpose; do not fix them here.

Kind of work (map row): Intake, from the support inbox to the privacy lead.

## What it does

People send requests about their personal data to the shop's support inbox. The support agent sends each one to the privacy lead, who tracks it in the inbox until it is answered.

## The flow

1. A request arrives in the support inbox. The support agent reads it and clicks **Send to privacy lead**.
2. The request appears in the privacy lead's list the next time the lead opens it, with the status "New".
3. When the lead opens the request, the product starts the clock: the due date is 30 days from that moment, and the list shows it as "Due on dd/mm".
4. If the email the person wrote from does not match an order, the request form asks for the order number before the request reaches the lead.
5. A request past its due date stays at the top of the list, marked "overdue", until someone closes it.
6. The person's first copy of their data is free. Each further copy costs €5.

## Screens

- **Support inbox**: the request, with the button Send to privacy lead.
- **Privacy lead's list**: one row per request, with status, due date and the role that sent it.
- **Request**: the person's message, the order it matches and the due date.
