# System Architecture

ApiSpi is a Laravel 11-based SaaS platform for managing AI agents, skills, connectors, and user subscriptions. This document describes the overall system architecture and core domains.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | Laravel | 11 |
| **PHP** | PHP | 8.2+ |
| **Database** | MySQL / MariaDB | 8.0+ / 10.4+ |
| **Frontend** | Vue.js | 3 |
| **Build Tool** | Vite | Latest |
| **Styling** | Tailwind CSS | Latest |
| **Authentication** | Laravel Auth + Custom Admin Flag | — |
| **Session Storage** | Database-backed | — |
| **AI Integration** | Anthropic API | claude-sonnet-4-5 |

## Core Domains & Entities

### 1. Users
- Email-based authentication with password hashing
- Boolean `is_admin` flag for access control
- Relationships: subscriptions, connector connections, activity logs
- Profile management: name, email, password reset

### 2. Agents (AI Agent Products)
- Marketplace products representing autonomous AI agents
- Metadata: slug (URL), name, description, rating, price, category
- Features: featured status, active status, sorting
- Rich JSON content:
  - `features` — array of capability strings
  - `includes` — array of what's included in subscription
  - `use_cases` — array of scenario/industry examples
  - `pricing_plans` — array of plan objects
  - `faqs` — array of FAQ objects
- Marketing CTA fields: `cta_headline`, `cta_sub`, `checkout_name`
- Relationships:
  - Many-to-many with `skills` (via `agent_skill` pivot)
  - Many-to-many with `connectors` (via `agent_connector` pivot)
  - One-to-many with `subscriptions`
- Performance: `users_count` field caches active subscription count

### 3. Skills (Agent Capabilities)
- Named features/capabilities that agents possess
- Metadata: slug, name, description, category, active/inactive status
- Many-to-many with agents via `agent_skill` pivot
- Pivot fields: name, description, category, refreshed_at (for tracking skill relevance)

### 4. Connectors (OAuth & API Integrations)
- Third-party service integrations (Slack, Zapier, Anthropic, Microsoft, Gmail, YouTube, etc.)
- OAuth 2.0 support with metadata: client ID, secret, auth/token URLs, scopes, extra params
- Dynamic configuration: `config_schema` (JSON) allows form generation
- `tool_definitions` (JSON array) — the tool/function schemas (name, description, `input_schema`) a connector exposes for Aria's tool use. Read by `DashboardAriaChatController` to build Claude's tool list, and surfaced read-only in the Admin Catalog's **All Tools** tab (`/admin/agents`)
- Many-to-many with agents via `agent_connector` pivot
- One-to-many with `user_connectors` (user's authenticated connections)
- Encrypted secret storage (OAuth client secrets)

### 5. UserConnectors (User's OAuth Connections)
- Records when a user authenticates with a connector
- Metadata: connection status, connected date, custom config
- Enables per-user credential management without storing raw tokens/secrets in app

### 6. Subscriptions (Agent Ownership)
- Links users to agents with time-bound access
- Fields: user_id, agent_id, status ('active', 'expired', etc.), started_at, expires_at
- Enforces one subscription per user-agent pair
- Drives user dashboard content and agent access control

### 7. ActivityLog (Audit Trail)
- Records user actions: logins, subscriptions, connector connections, admin changes
- Static helper: `ActivityLog::log(action, description, userId?, actorId?, metadata?)`
- `actor_id` set when admin acts on behalf of another user
- Metadata: custom JSON for context (e.g., which agent was subscribed)

### 8. OrgPolicy (Governance)
- Single org-wide row, fetched/created via `OrgPolicy::current()`
- Fields: `content` (free text injected into Aria's system prompt), `connectors_disabled` (global kill switch for user AI connectors), `daily_token_limit`, `blocked_keywords` (array), `blocked_countries` (array — data-sovereignty list, matched against `connectors.country`)
- Enforced inline in chat controllers at message-send time — not a separate middleware. `daily_token_limit` is enforced in `ChatController`, `DashboardAriaChatController`, and `WorkspaceChatController`; `blocked_keywords` and `connectors_disabled` are enforced only in `ChatController` and `DashboardAriaChatController` (not currently checked in workspace chat)
- Keyword/limit hits produce a canned reply to the user and a guardrail entry in `ActivityLog`
- **Where controls are applied** — see the Governance section in [docs/admin.html](docs/admin.html) for a full breakdown of which surfaces enforce which controls
- **Per-user layer:** `users.governance` (JSON) holds optional per-user overrides, editable on the Governance tab of `/dashboard/profile` (`PUT /dashboard/profile/governance`). `App\Support\EffectiveGovernance` combines a user's overrides with the global `OrgPolicy` at request time (`User::governancePolicy()`) — user rules are strictly additive: `connectors_disabled` is OR'd, `daily_token_limit` takes the stricter (lowest) value, and `blocked_keywords`/`blocked_countries` are unioned. A user can never loosen the org-wide policy.
- `blocked_countries` (effective, per-user) is consulted when Aria builds its candidate tool set — see [Tool Selection](docs/aria.html#tool-selection) — to drop connectors based in a blocked country before the model ever sees them as tools

### 9. FirewallRule / FirewallLog (AI Firewall)
- Pattern-based detection only (prompt injection, PII: email/credit card/API key) via `AiFirewallService::inspectRequest()` — **never blocks or alters a request**, logging only
- `FirewallRule`: per-category enable/disable, optionally scoped to a `connector_id` (connector-level rule overrides the global one)
- `FirewallLog`: records user_id, connector_slug, direction, category, and a truncated snippet for each match
- Runs against outbound gateway/connector request bodies, distinct from `OrgPolicy`'s keyword guardrail (which runs on chat messages/replies)

### 10. TokenUsage / ConnectorUsageLog (Telemetry)
- `TokenUsage`: one row per Aria conversation turn — user_id, connector_slug, model, input/output tokens, prompt, reply, system prompt, mode
- `ConnectorUsageLog`: one row per API Gateway proxy call — user_id, connector_slug, tool_name (upstream path), status, result_count, error_message (see [API Gateway → Usage Logging](api.md#usage-logging))
- Both feed the admin `/admin/token-usage` page; `TokenUsage::todayTotalForUser()` also backs `OrgPolicy.daily_token_limit` enforcement

### 11. AffiliateConversion (Referral Program)
- `users.referral_code` (lazily generated) + `users.referred_by` (set at signup if a valid `?ref=` code was captured by `CaptureReferral` middleware)
- `AffiliateConversion` row created when a referred user completes a **paid** action (subscription or token purchase) via Stripe webhook — plain signups do not create a conversion
- Commission = purchase amount × a fixed config rate; status starts `pending`, admin bulk-marks a user's conversions `paid`
- Deduped per Stripe session via `firstOrCreate`

### 12. Workspaces (Shared Team Chat)
- `Workspace`: `name`, unique `slug`, unique `invite_code`, `owner_id` (FK users, cascade delete)
- `WorkspaceMember`: pivot of `workspace_id` + `user_id`, unique composite, `role` (`owner`/`member`, no other tiers), `ai_enabled` (boolean, default false)
- `WorkspaceMessage`: `workspace_id`, nullable `user_id` (nullOnDelete), `user_name`, `role`, `content`, plus `tool_calls`/`active_agents` (JSON, cast to array)
- One shared message stream per workspace — every member reads/writes the same thread; sending is not gated by `ai_enabled`
- `ai_enabled` per member controls only whether *that member's* personal AI/personalisation settings are folded into the assistant's shared reply — not whether they can chat
- Membership check: `abort_unless($workspace->users()->where('users.id', Auth::id())->exists(), 403)` in both `WorkspaceController` and `WorkspaceChatController`
- Only the owner can remove other members (and cannot be removed themselves); any member can invite others or clear the entire shared history
- `WorkspaceChatController` shares the `RunsAgentTools` trait with `DashboardAriaChatController` — same connector/tool pipeline, same `TokenUsage` logging (tagged as a workspace source) — but does **not** enforce `OrgPolicy.blocked_keywords` or `connectors_disabled` (see [OrgPolicy](#8-orgpolicy-governance))

## Request Flow

```
Browser Request
    ↓
Laravel Router (routes/web.php)
    ↓
Middleware Stack (auth, guest, admin, rate-limit)
    ↓
Controller (public or namespaced admin)
    ↓
Model/Service Layer
    ↓
Database
    ↓
View/JSON Response
```

### MVC Pattern
- **Routes** (`routes/web.php`) — define endpoints and middleware
- **Controllers** (`app/Http/Controllers/`) — handle business logic, return Blade views or JSON
- **Models** (`app/Models/`) — database entities with relationships
- **Services** (`app/Services/`) — reusable logic (OAuthService, ChatService)
- **Blade Views** (`resources/views/`) — HTML templates with Vue mounting divs
- **Vue Components** (`resources/js/components/`) — interactive client-side UI

## Frontend Architecture

Each section of the app is powered by a separate Vite entry point, mounted to a Blade `div` via `id` and props passed as `data-*` JSON attributes.

| Entry Point | Mount Div | Purpose | Routing |
|---|---|---|---|
| `admin.js` | `#admin-app` | Admin dashboard (agents, users, settings) | Client-side via `data-page` attr |
| `dashboard.js` | `#dashboard-app` | User dashboard overview | Static |
| `catalog.js` | `#catalog-app` | Browse available agents | Static |
| `agents-list.js` | `#agents-list-app` | User's active subscriptions | Static |
| `agent-detail.js` | `#agent-detail-app` | Individual subscription detail | Static |
| `profile.js` | `#profile-app` | User account settings | Static |
| `app.js` | — | Global CSS and minimal JS | — |

### Props Pattern
Props are passed via `data-*` attributes on the mount div, serialized as JSON from the Blade controller. Components receive them via `defineProps()`.

Example:
```blade
<div id="dashboard-app" 
     data-subscriptions='{{ json_encode($subscriptions) }}'
     data-user='{{ json_encode($user) }}'>
</div>
```

## Admin Panel

- **Route Prefix**: `/admin/*`
- **Middleware**: `auth` + custom `admin` (checks `users.is_admin` boolean)
- **UI Color Scheme**: Red/rose (vs. user dashboard's amber/gold)
- **Pages**: Managed via admin.js with `data-page` attribute for client-side routing
- **Features**:
  - Agent CRUD and management
  - **All Tools** tab (`/admin/agents`): read-only catalog of every connector's `tool_definitions`, with search and a searchable connector-filter dropdown
  - Skill association and bulk operations
  - Connector OAuth setup
  - User management and impersonation (via `actor_id` on ActivityLog)
  - Subscription administration
  - Training course management
  - Activity log viewing
  - Governance (`/admin/policy`) and AI Firewall (`/admin/firewall`) configuration
  - Affiliate/referral commission tracking (`/admin/sales?tab=affiliates`)

## Authentication & Authorization

### User Registration & Login
- Standard email/password flow
- Password auto-hashed via model mutator
- Email uniqueness enforced at database level
- Password reset via time-limited tokens (60-minute expiry)

### Admin Access Control
- Boolean `is_admin` flag on users table
- Middleware `IsAdmin` checks this flag
- Routes under `/admin/*` require both `auth` and `admin` middleware

### Session Management
- Sessions stored in database (configured via `SESSION_DRIVER=database`)
- "Remember me" option extends session to 2 weeks
- Session destruction on logout

## AI Chatbot (Aria)

### Static Chatbot (Public `/contact` page)
- JavaScript file: `public_html/js/chatbot.js` (static, not Vite-compiled)
- On page load, chatbot lazy-loads `public_html/js/nlp.min.js` (node-nlp v3.10.2 browser bundle)
- NLP intent classifier trains in-browser against 16 predefined intents
- User messages classified locally → routed to appropriate intent handler

### API Chatbot (Authenticated Dashboard)
- Endpoint: `POST /dashboard/chat` (requires authentication)
- Proxies messages to Anthropic Claude API via Laravel `Http` facade
- Maintains conversation history (last 10 messages)
- Rate-limited: 30 requests/minute per authenticated user
- Returns JSON responses with assistant reply

### Public Contact Form
- Endpoint: `/contact` (GET) and `POST /contact`
- Proxies to `ChatController` for Anthropic response
- Rate-limited: 30 requests/minute per IP
- No authentication required

## Rate Limiting & Security

- **API Gateway Keys**: Bearer token auth for programmatic access (e.g., `gw_AbCd...`)
- **Chatbot**: 30 requests/min per IP (contact, dashboard chat)
- **Digital Avatars & Partners forms**: 5 requests/10min per IP (prevent abuse)
- **CSRF Protection**: Laravel's CSRF middleware on all form submissions
- **Password Hashing**: bcrypt via `Hash::make()`
- **Encryption**: OAuth secrets encrypted at rest

## Deployment Model

- **Hosting**: SiteGround shared hosting (`~/www/apispi.com`)
- **Web Root**: `public_html/` (non-standard location)
- **Node.js**: NOT available on production server
- **Built Assets**: Must be committed to git, no npm install on server
- **Deployment**: Git pull-to-deploy workflow
- **Migrations**: Manual `php artisan migrate` after git pull (or auto via hooks)

## Key File Structure

```
as-website1-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Admin-only controllers
│   │   │   ├── AuthController.php  # Login, register, dashboard
│   │   │   ├── AgentController.php # Agent catalog
│   │   │   └── ...
│   │   ├── Middleware/
│   │   │   └── IsAdmin.php         # Admin access check
│   │   └── Resources/              # JSON API responses
│   ├── Models/
│   │   ├── User.php
│   │   ├── Agent.php
│   │   ├── Skill.php
│   │   ├── Connector.php
│   │   ├── Subscription.php
│   │   ├── UserConnector.php
│   │   └── ActivityLog.php
│   ├── Services/
│   │   ├── OAuthService.php
│   │   └── ChatService.php
│   └── Providers/
├── resources/
│   ├── js/
│   │   ├── app.js                  # Global entry
│   │   ├── admin.js                # Admin app
│   │   ├── dashboard.js            # User dashboard
│   │   └── components/
│   │       ├── admin/              # Admin Vue components
│   │       └── ...
│   ├── views/
│   │   ├── layouts/master.blade.php
│   │   ├── dashboard.blade.php
│   │   ├── agents/
│   │   │   ├── index.blade.php
│   │   │   └── show.blade.php      # Dynamic agent view
│   │   └── ...
│   └── css/
├── database/
│   ├── migrations/                 # Schema changes
│   ├── seeders/                    # Sample data
│   └── factories/                  # Test data
├── public_html/                    # Web root (production)
│   ├── index.php                   # Laravel entry point
│   ├── build/                      # Vite output (committed to git)
│   ├── js/
│   │   ├── chatbot.js              # Static chatbot (not Vite)
│   │   └── nlp.min.js              # node-nlp browser bundle
│   └── ...
├── routes/
│   └── web.php                     # All routes
├── vite.config.js                  # Vite configuration
├── CLAUDE.md                       # Developer guide
└── SPECS/                          # Architecture specifications
    ├── 01-PROJECT-OVERVIEW.md
    ├── 02-DATABASE-SCHEMA.md
    └── ...
```

## Key Design Principles

1. **Single Responsibility**: Each controller/service has one clear purpose
2. **Lazy Loading**: Vue apps load only when needed (mounted to specific pages)
3. **Database-Backed Sessions**: Enables multi-server deployments
4. **Activity Logging**: All significant user actions recorded for audit trails
5. **Role-Based Access**: Admin flag provides simple but effective access control
6. **Decoupled AI Integration**: ChatService abstracts Anthropic API details
7. **JSON-Driven Rich Content**: Agent metadata stored as JSON, flexible schema
8. **Git-Based Deployment**: Production assets committed to repo, no build step on server

## Environment Configuration

Key `.env` variables:

```ini
# Application
APP_NAME=APISPI
APP_ENV=production
APP_DEBUG=false
APP_URL=https://apispi.com

# Database
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=apispi
DB_USERNAME=apispi_user
DB_PASSWORD=***

# Session (REQUIRED)
SESSION_DRIVER=database

# AI Integration
ANTHROPIC_API_KEY=sk-ant-***
ANTHROPIC_MODEL=claude-sonnet-4-5

# Mail
MAIL_FROM_ADDRESS=noreply@apispi.com
MAIL_MAILER=smtp
```

See [Development Guide](development.md) and [Deployment Guide](deployment.md) for setup and deployment details.
