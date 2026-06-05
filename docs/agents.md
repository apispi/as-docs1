# AI Agents Catalogue

ApiSpi offers nine pre-built AI agents. Each is available as a monthly subscription with no lock-in. Pricing is in AUD.

## Agents

### Bid & Tender Response — from $299/mo
Automates government RFQ/RFT responses, CV matching, and compliance matrices. Rated 4.9/5.

**Use cases:** Government procurement, capability statements, selection criteria, proposal writing.

---

### Security & IRAP Readiness — from $499/mo
Guides teams through compliance frameworks: Essential Eight, ISM, PSPF, IRAP, and ISO 27001. Rated 4.95/5.

**Use cases:** Gap analysis, compliance reporting, policy drafting, vulnerability assessment.

---

### Enterprise Architecture — from $349/mo
Generates Architecture Decision Records (ADRs), architecture options, target-state models, and migration roadmaps. Rated 4.85/5.

**Use cases:** Technology roadmapping, solution architecture, architecture reviews, decision records.

---

### Digital Avatar — from $149/mo
AI-powered video personas for professional services. Handles lead response and client education 24/7.

**Target audience:** Tradies, property agents, lawyers, accountants, beauticians, hotel marketers.

---

### Knowledge Management — from $199/mo
Turns scattered organisational knowledge into searchable intelligence and auto-generated SOPs. Rated 4.8/5.

**Use cases:** SOP generation, knowledge base creation, organisational memory capture.

---

### Cyber Incident & Threat Intel — from $399/mo
Handles log summarisation, alert triage, IOC extraction, and runbook generation. Rated 4.9/5.

**Use cases:** Incident response, threat detection, forensic analysis, playbook authoring.

---

### Content Creator — $29/mo
Autonomous content generation across formats: blogs, social media, video scripts, marketing campaigns.

---

### Customer Support Bot — $49/mo
24/7 intelligent support with natural language understanding, ticket handling, escalation, and automated responses.

---

### Data Analyzer Pro — $79/mo
Advanced data extraction, analysis, visualisation, and predictive modelling from any dataset.

---

## Subscription Management

Subscriptions are created via Stripe checkout. After payment, users access their subscribed agents from the dashboard at `/dashboard/subscriptions`.

Each subscription can have:
- **Skills** — specific capabilities attached to an agent subscription (admin-configurable)
- **Connectors** — external service integrations enabled for the subscription

Subscription statuses: `active`, `paused`, `cancelled`.

## Admin Management

Admins can manage subscriptions at `/admin/subscriptions`:
- Assign or revoke agent subscriptions for users
- Add/remove skills from a subscription
- Add/remove connectors from a subscription
- Update subscription status
