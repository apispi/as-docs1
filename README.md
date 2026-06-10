# ApiSpi Documentation

ApiSpi is an AI agents SaaS platform that builds and deploys enterprise-grade autonomous AI agents, digital avatars, and training services for Australian businesses.

## Developer Documentation

### Core Guides
- **[System Architecture](architecture.md)** — Technical overview, domains, request flow, key design principles
- **[Database Schema](database.md)** — Complete database reference, tables, relationships, migrations
- **[Frontend Architecture](frontend.md)** — Vue.js, Vite, component patterns, admin routing, static chatbot
- **[Development Guide](development.md)** — Setup, local development, testing, debugging, common tasks
- **[Deployment Guide](deployment.md)** — Production deployment on SiteGround, monitoring, rollback procedures

### User & Feature Documentation
- **[Usage Guide](usage.md)** — User features, dashboard, subscriptions, connectors, training
- **[API Gateway](api.md)** — Authentication, endpoints, connector proxy

### Reference
- [Platform Overview](docs/overview.md) — Core offerings
- [AI Agents Catalogue](docs/agents.md)
- [Aria AI Assistant](docs/aria.md)
- [Connectors](docs/connectors.md)
- [Training Courses](docs/training.md)
- [Partner Program](docs/partners.md)

## Quick Links

**Getting Started:**
- New to the project? Start with [System Architecture](architecture.md)
- Setting up locally? Follow [Development Guide](development.md)
- Deploying? See [Deployment Guide](deployment.md)

**Building Features:**
- Creating a new admin page? See [Frontend Architecture → Adding a New Admin Page](frontend.md#adding-a-new-admin-page-5-steps)
- Adding a database table? See [Development Guide → Creating a New Model](development.md#creating-a-new-model)
- Writing tests? See [Development Guide → Testing](development.md#testing)

**Understanding the Codebase:**
- How do users subscribe to agents? See [Architecture → Core Domains](architecture.md#core-domains--entities)
- How are OAuth connectors managed? See [Database Schema → Connectors](database.md#connectors)
- How does frontend data flow from Blade to Vue? See [Frontend → Props Pattern](frontend.md#props-pattern-blade--vue)
