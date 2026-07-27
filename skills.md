# Skills Catalogue

A **Skill** is a distinct first-class model (`app/Models/Skill.php`, `skills` table) — separate from both **Agents** ([the 18 catalogue agents](usage.md#agent-catalog)) and **Connectors** ([connectors.md](connectors.md)). A skill is a packaged capability/persona prompt (e.g. "Contract Review", "Threat Detection") that gets attached to one or more agents; it has no relationship to connectors at all.

The base catalogue is seeded by `database/seeders/SkillSeeder.php` — **46 skills** across 10 categories, auto-run via `DatabaseSeeder`. A further **20 industry skills** (across the **Front Office**, **Commerce & Retail**, **Trades & Field Services**, and **Communications & Front Office** categories) are added by the standalone agent seeders (`ShoppingAgentSeeder`, `DigitalReceptionistAgentSeeder`, `DigitalPlumberAgentSeeder`, `IndustryAgentSkillConnectorSeeder`), bringing the total to **71 skills** across **15 categories** (a further 5 Executive & Operations skills come with the Chief of Staff agent).

Fields on `Skill`: `slug`, `name`, `description`, `category`, `is_active`, `sort_order`. Most skills have a short one-line `description`; a handful (noted below) instead carry a full markdown system-prompt — hundreds of lines covering purpose, capabilities, process, and best practices — because they double as the actual prompt injected when that skill is active for an agent.

---

## Full Skill List

| Slug | Name | Category |
|---|---|---|
| `document-analysis` | Document Analysis | Document Processing |
| `rfq-rft-parsing` | RFQ / RFT Parsing | Document Processing |
| `cv-parsing` | CV Parsing | Document Processing |
| `contract-review` | Contract Review | Document Processing |
| `ocr-extraction` | OCR & Text Extraction | Document Processing |
| `compliance-matrix` | Compliance Matrix Generation | Compliance & Governance |
| `gap-analysis` | Gap Analysis | Compliance & Governance |
| `regulatory-mapping` | Regulatory Mapping | Compliance & Governance |
| `audit-trail-generation` | Audit Trail Generation | Compliance & Governance |
| `policy-drafting` | Policy Drafting | Compliance & Governance |
| `star-response-generation` | STAR Response Generation | Writing & Communication |
| `executive-summary` | Executive Summary Writing | Writing & Communication |
| `capability-statements` | Capability Statement Writing | Writing & Communication |
| `content-generation` | Content Generation | Writing & Communication |
| `report-writing` | Report Writing | Writing & Communication |
| `translation-localisation` | Translation & Localisation | Writing & Communication |
| `data-extraction` | Data Extraction | Data & Analytics |
| `data-analysis` | Data Analysis | Data & Analytics |
| `data-visualisation` | Data Visualisation | Data & Analytics |
| `predictive-modelling` | Predictive Modelling | Data & Analytics |
| `sql-query-generation` | SQL Query Generation | Data & Analytics |
| `threat-detection` | Threat Detection | Security & Cyber |
| `incident-triage` | Incident Triage | Security & Cyber |
| `vulnerability-assessment` | Vulnerability Assessment | Security & Cyber |
| `forensic-analysis` | Forensic Analysis † | Security & Cyber |
| `penetration-test-reporting` | Penetration Test Reporting | Security & Cyber |
| `knowledge-capture` | Knowledge Capture | Knowledge Management |
| `taxonomy-building` | Taxonomy Building | Knowledge Management |
| `semantic-search` | Semantic Search | Knowledge Management |
| `faq-generation` | FAQ Generation | Knowledge Management |
| `knowledge-gap-detection` | Knowledge Gap Detection | Knowledge Management |
| `intent-classification` | Intent Classification | Customer & Support |
| `sentiment-analysis` | Sentiment Analysis | Customer & Support |
| `automated-response` | Automated Response | Customer & Support |
| `ticket-summarisation` | Ticket Summarisation | Customer & Support |
| `escalation-detection` | Escalation Detection | Customer & Support |
| `architecture-review` | Architecture Review † | Architecture & Strategy |
| `technology-roadmapping` | Technology Roadmapping † | Architecture & Strategy |
| `decision-record-drafting` | Decision Record Drafting † | Architecture & Strategy |
| `pattern-matching` | Architecture Pattern Matching † | Architecture & Strategy |
| `avatar-generation` | Avatar Generation † | Avatar & Media |
| `voice-cloning` | Voice Cloning † | Avatar & Media |
| `video-script-generation` | Video Script Generation | Avatar & Media |
| `multilingual-narration` | Multilingual Narration | Avatar & Media |
| `market-mapping` | Market Mapping † | Market & Strategy |
| `pricing-strategy` | Pricing Strategy † | Market & Strategy |
| `appointment-scheduling` | Appointment Scheduling | Front Office |
| `call-message-handling` | Call & Message Handling | Front Office |
| `inquiry-routing` | Inquiry Routing & Triage | Front Office |
| `message-taking` | Message Taking & Relay | Front Office |
| `lead-capture` | Visitor & Lead Capture | Front Office |
| `product-search` | Product Search | Commerce & Retail |
| `price-comparison` | Price Comparison | Commerce & Retail |
| `deal-discovery` | Deal & Promotion Discovery | Commerce & Retail |
| `product-recommendation` | Product Recommendation | Commerce & Retail |
| `shopping-list-management` | Shopping List & Cart Management | Commerce & Retail |
| `order-tracking` | Order & Delivery Tracking | Commerce & Retail |
| `shopping-agent` | Shopping Agent † | Commerce & Retail |
| `job-quoting` | Job Quoting & Estimation | Trades & Field Services |
| `trade-diagnostics` | Trade Diagnostics | Trades & Field Services |
| `materials-estimation` | Materials & Parts Estimation | Trades & Field Services |
| `job-dispatch` | Job Scheduling & Dispatch | Trades & Field Services |
| `plumbing-compliance` | Plumbing Standards & Compliance | Trades & Field Services |
| `invoice-generation` | Invoice Generation | Trades & Field Services |
| `digital-plumber` | Digital Plumber † | Trades & Field Services |
| `digital-receptionist` | Digital Receptionist † | Communications & Front Office |

† Carries a full markdown system-prompt description rather than a one-line blurb. The three persona skills (`shopping-agent`, `digital-plumber`, `digital-receptionist`) are the full system prompts behind the Shopping, Digital Plumber, and Digital Receptionist agents.

---

## Skill ↔ Agent Relationship

Skills attach to [agents](usage.md#agent-catalog) via a many-to-many pivot, `agent_skill` (with a `definition` column), seeded by `database/seeders/AgentSkillSeeder.php` (and, for the industry/standalone agents, by their respective seeders). Each of the **19 agents** is assigned 4–10 skills; some skills are reused across multiple agents (e.g. `document-analysis`, `report-writing`, `compliance-matrix`).

Example mapping — **Bid & Tender Response** agent (`bid-tender`):

| Skill |
|---|
| RFQ / RFT Parsing |
| CV Parsing |
| Document Analysis |
| STAR Response Generation |
| Executive Summary Writing |
| Capability Statement Writing |
| Compliance Matrix Generation |
| Gap Analysis |

The pattern repeats for the other 9 agents — each draws on the skill category most relevant to its domain (Security & Cyber skills for the Cyber Incident agent, Avatar & Media skills for the Digital Avatar agent, Customer & Support skills for the Support Bot agent, and so on).

---

## Skill Entitlement (Subscriptions)

Skills themselves carry **no price** — `Skill` has no pricing field. Instead, entitlement is managed per subscription tier via the `subscription_skill` pivot table, which has an `is_disabled` flag. An admin can disable specific skills for a specific subscription via `app/Http/Controllers/Admin/SubscriptionSkillController.php`, effectively gating which packaged capabilities a subscriber's agents can use without changing the agent's connector access.

This is independent of the `agent_connector` pivot (which connector each agent can call) and `agent_default_connector` (the catalogue-default connector set used to restore an agent's connectors after customization) — skills relate only to agents and subscriptions, never directly to connectors.

---

## Relationship Summary

```
Agent ──< agent_skill >── Skill        (which packaged capabilities an agent has)
Agent ──< agent_connector >── Connector (which tools/integrations an agent can call)
Subscription ──< subscription_skill >── Skill  (which skills a subscriber is entitled to)
```

See [usage.md](usage.md#agent-catalog) for the agent catalogue and [connectors.md](connectors.md) for the full connector list.
