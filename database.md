# Database Schema

Complete reference of all database tables, columns, relationships, and model specifications.

## Overview

The database uses MySQL 8.0+ or MariaDB 10.4+ with the following core entities:
- `users` — Platform users with authentication
- `agents` — AI agent products
- `skills` — Agent capabilities
- `connectors` — OAuth and API integrations
- `subscriptions` — User → Agent relationships
- `user_connectors` — User → Connector OAuth connections
- `agent_skill` — Agent → Skill pivot
- `agent_connector` — Agent → Connector pivot
- `activity_logs` — Audit trail of user actions

---

## users

User accounts with authentication and admin privileges.

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `name` | varchar(255) | ✗ | | User's full name |
| `email` | varchar(255) | ✗ | ✓ | Login email address |
| `email_verified_at` | timestamp | ✓ | | Email verification timestamp |
| `password` | varchar(255) | ✗ | | Bcrypt-hashed password |
| `remember_token` | varchar(100) | ✓ | | "Remember me" token |
| `is_admin` | boolean | ✗ | | Admin flag for `/admin/*` access |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Model**: `App\Models\User` (extends `Authenticatable`)

**Fillable**: `name`, `email`, `password`, `is_admin`

**Casts**:
```php
'email_verified_at' => 'datetime',
'password'          => 'hashed',   // Auto-hashes on assignment
'is_admin'          => 'boolean',
```

**Relationships**:
- `hasMany(Subscription)` — all agent subscriptions
- `hasMany(UserConnector)` — all OAuth connections

**Key Features**:
- Email-unique constraint enforces one account per email
- Password automatically hashed via mutator
- `is_admin` boolean controls access to `/admin/*` routes via middleware

---

## agents

AI agent products in the marketplace.

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `slug` | varchar(255) | ✗ | ✓ | URL-friendly identifier (e.g., `bid-tender`) |
| `name` | varchar(255) | ✗ | | Display name |
| `description` | longtext | ✓ | | Long-form description |
| `badge` | varchar(255) | ✓ | | e.g., "popular", "recommended", "new" |
| `rating` | decimal(3,2) | ✗ | | 0.00 to 5.00 scale |
| `users_count` | int | ✗ | | Cached active subscription count |
| `price` | decimal(10,2) | ✓ | | Base price (may vary by plan) |
| `category` | varchar(255) | ✓ | | e.g., "productivity", "compliance", "sales" |
| `is_featured` | boolean | ✗ | | Highlighted in catalog |
| `is_active` | boolean | ✗ | | Visible in public catalog |
| `sort_order` | int | ✗ | | Ordering in lists (lower = earlier) |
| `target_audience` | varchar(255) | ✓ | | e.g., "Finance Managers", "Legal Teams" |
| `tagline` | varchar(255) | ✓ | | Short one-liner for marketing |
| `cta_headline` | varchar(255) | ✓ | | Primary call-to-action headline |
| `cta_sub` | varchar(255) | ✓ | | CTA subheading |
| `checkout_name` | varchar(255) | ✓ | | Display name on checkout |
| `features` | json | ✓ | | Array of feature strings |
| `includes` | json | ✓ | | Array of what's included with subscription |
| `use_cases` | json | ✓ | | Array of use case objects `{title, description}` |
| `pricing_plans` | json | ✓ | | Array of plan objects `{name, price, features}` |
| `faqs` | json | ✓ | | Array of FAQ objects `{question, answer}` |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Model**: `App\Models\Agent`

**Fillable**: All columns listed above

**Casts**:
```php
'rating'        => 'decimal:2',
'is_featured'   => 'boolean',
'is_active'     => 'boolean',
'features'      => 'array',        // JSON ↔ PHP array
'includes'      => 'array',
'use_cases'     => 'array',
'pricing_plans' => 'array',
'faqs'          => 'array',
```

**Relationships**:
- `belongsToMany(Skill)` via `agent_skill` pivot
  - With pivot fields: `name`, `description`, `category`, `refreshed_at`
  - Ordered by `sort_order`
- `belongsToMany(Connector)` via `agent_connector` pivot
  - Ordered by `sort_order`, then `name`
- `hasMany(Subscription)` — user subscriptions to this agent

**Scopes**:
```php
->active()  // WHERE is_active=true ORDER BY sort_order, name
```

**Key Features**:
- `slug` used for URL routing (e.g., `/agents/bid-tender`)
- JSON columns store rich content with flexible schema
- `users_count` cached for performance (updated via observer on Subscription creation/deletion)

---

## skills

Agent capabilities and features.

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `slug` | varchar(255) | ✗ | ✓ | URL-friendly identifier |
| `name` | varchar(255) | ✗ | | Display name |
| `description` | longtext | ✓ | | Detailed description |
| `category` | varchar(255) | ✓ | | e.g., "integration", "automation", "analytics" |
| `is_active` | boolean | ✗ | | Active/inactive status |
| `sort_order` | int | ✗ | | Ordering in lists |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Model**: `App\Models\Skill`

**Fillable**: `slug`, `name`, `description`, `category`, `is_active`, `sort_order`

**Casts**:
```php
'is_active' => 'boolean',
```

**Relationships**:
- `belongsToMany(Agent)` via `agent_skill` pivot
  - With pivot fields: `name`, `description`, `category`, `refreshed_at`
  - Ordered by `sort_order`

**Scopes**:
```php
->active()  // WHERE is_active=true ORDER BY sort_order, name
```

---

## connectors

OAuth 2.0 and API integrations that agents can use.

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `slug` | varchar(255) | ✗ | ✓ | URL-friendly identifier (e.g., `slack`) |
| `name` | varchar(255) | ✗ | | Display name (e.g., "Slack") |
| `description` | longtext | ✓ | | Integration description |
| `category` | varchar(255) | ✓ | | e.g., "communication", "cloud", "analytics" |
| `icon` | varchar(255) | ✓ | | URL to icon image |
| `website_url` | varchar(255) | ✓ | | Link to service website |
| `is_oauth` | boolean | ✗ | | OAuth 2.0 integration flag |
| `oauth_client_id` | varchar(255) | ✓ | | OAuth client ID (encrypted at rest) |
| `oauth_client_secret` | text | ✓ | | OAuth client secret (encrypted at rest) |
| `oauth_auth_url` | varchar(255) | ✓ | | OAuth authorization endpoint URL |
| `oauth_token_url` | varchar(255) | ✓ | | OAuth token endpoint URL |
| `oauth_scopes` | varchar(255) | ✓ | | Space-separated OAuth scopes |
| `oauth_extra_params` | json | ✓ | | Additional OAuth parameters (provider-specific) |
| `config_schema` | json | ✓ | | JSON schema for dynamic config form generation |
| `is_active` | boolean | ✗ | | Active/inactive status |
| `sort_order` | int | ✗ | | Ordering in lists |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Model**: `App\Models\Connector`

**Fillable**: All columns listed above

**Casts**:
```php
'is_oauth'           => 'boolean',
'is_active'          => 'boolean',
'oauth_extra_params' => 'array',
'config_schema'      => 'array',
```

**Relationships**:
- `belongsToMany(Agent)` via `agent_connector` pivot
  - Ordered by `sort_order`, then `name`
- `hasMany(UserConnector)` — user OAuth connections

**Scopes**:
```php
->active()  // WHERE is_active=true ORDER BY sort_order, name
```

**Key Features**:
- OAuth credentials encrypted at rest
- `config_schema` (JSON) allows frontend form generation for custom connector config
- `oauth_extra_params` supports provider-specific OAuth parameters (PKCE, custom claims, etc.)

---

## subscriptions

User subscriptions to agents (time-bound access).

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `user_id` | bigint | ✗ | | Foreign key → `users.id` |
| `agent_id` | bigint | ✗ | | Foreign key → `agents.id` |
| `status` | varchar(255) | ✗ | | e.g., "active", "expired", "paused", "cancelled" |
| `started_at` | timestamp | ✗ | | Subscription start date |
| `expires_at` | timestamp | ✓ | | Subscription expiry date (null = no expiry) |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Unique Constraint**: `(user_id, agent_id)` — one subscription per user-agent pair

**Model**: `App\Models\Subscription`

**Fillable**: `user_id`, `agent_id`, `status`, `started_at`, `expires_at`

**Casts**:
```php
'started_at'  => 'datetime',
'expires_at'  => 'datetime',
```

**Relationships**:
- `belongsTo(User)` — subscription owner
- `belongsTo(Agent)` — subscribed agent

**Key Features**:
- Composite unique key prevents duplicate subscriptions
- Status field tracks subscription lifecycle
- Expiry date enables time-limited subscriptions (null = permanent)

---

## user_connectors

User's OAuth connections to external services.

| Column | Type | Nullable | Unique | Notes |
|--------|------|----------|--------|-------|
| `id` | bigint | ✗ | ✓ | Primary key |
| `user_id` | bigint | ✗ | | Foreign key → `users.id` |
| `connector_id` | bigint | ✗ | | Foreign key → `connectors.id` |
| `is_connected` | boolean | ✗ | | Connection status |
| `connected_at` | timestamp | ✓ | | When user authenticated |
| `config` | json | ✓ | | User-specific connector configuration |
| `created_at` | timestamp | ✗ | | Created timestamp |
| `updated_at` | timestamp | ✗ | | Last updated timestamp |

**Model**: `App\Models\UserConnector`

**Fillable**: `user_id`, `connector_id`, `is_connected`, `connected_at`, `config`

**Casts**:
```php
'is_connected' => 'boolean',
'connected_at' => 'datetime',
'config'       => 'array',
```

**Relationships**:
- `belongsTo(User)`
- `belongsTo(Connector)`

**Key Features**:
- `config` stores user-specific settings (e.g., selected Slack channel)
- OAuth tokens typically NOT stored (use secure token store or OAuth refresh flow)

---

## agent_skill (Pivot Table)

Links agents to skills with additional metadata.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | bigint | ✗ | Primary key |
| `agent_id` | bigint | ✗ | Foreign key → `agents.id` |
| `skill_id` | bigint | ✗ | Foreign key → `skills.id` |
| `name` | varchar(255) | ✓ | Override agent-specific skill name |
| `description` | text | ✓ | Override agent-specific skill description |
| `category` | varchar(255) | ✓ | Override agent-specific category |
| `sort_order` | int | ✗ | Ordering for this agent |
| `refreshed_at` | timestamp | ✓ | When skill was last verified for this agent |
| `created_at` | timestamp | ✗ | Created timestamp |

**Unique Constraint**: `(agent_id, skill_id)` — one skill per agent

**Indexed**: `(agent_id, sort_order)`

**Key Features**:
- Override fields allow agent-specific skill naming
- `refreshed_at` tracks skill relevance (when it was last updated for this agent)
- Ordered by `sort_order` for consistent display

---

## agent_connector (Pivot Table)

Links agents to connectors with ordering.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | bigint | ✗ | Primary key |
| `agent_id` | bigint | ✗ | Foreign key → `agents.id` |
| `connector_id` | bigint | ✗ | Foreign key → `connectors.id` |
| `sort_order` | int | ✗ | Ordering for this agent |
| `created_at` | timestamp | ✗ | Created timestamp |

**Unique Constraint**: `(agent_id, connector_id)` — one connector per agent

**Indexed**: `(agent_id, sort_order)`

---

## activity_logs

Audit trail of user actions for compliance and debugging.

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | bigint | ✗ | Primary key |
| `user_id` | bigint | ✓ | Foreign key → `users.id` (null for guest actions) |
| `actor_id` | bigint | ✓ | Foreign key → `users.id` (admin acting on behalf of user) |
| `action` | varchar(255) | ✗ | Action type (e.g., "subscription_created", "login") |
| `description` | text | ✗ | Human-readable action description |
| `metadata` | json | ✓ | Additional context (e.g., agent_id, plan_selected) |
| `created_at` | timestamp | ✗ | Timestamp |

**Model**: `App\Models\ActivityLog`

**Indexed**: `(user_id, created_at)` for efficient user history queries

**Usage Pattern**:
```php
ActivityLog::log('subscription_created', 
    "User subscribed to agent: $agentName",
    $userId,
    $actorId,  // null if user self-acted
    ['agent_id' => $agentId, 'plan' => $plan]
);
```

**Key Features**:
- `actor_id` set when admin acts on behalf of user
- `metadata` JSON stores arbitrary context for debugging
- No authentication enforcement (actions by any user/guest can be logged)

---

## Key Relationships

### User Relationships
```
User (1) ←→ (Many) Subscription
User (1) ←→ (Many) UserConnector
User (1) ←→ (Many) ActivityLog
```

### Agent Relationships
```
Agent (1) ←→ (Many) Subscription
Agent (Many) ←→ (Many) Skill (via agent_skill pivot)
Agent (Many) ←→ (Many) Connector (via agent_connector pivot)
```

### Connector Relationships
```
Connector (1) ←→ (Many) UserConnector
Connector (Many) ←→ (Many) Agent (via agent_connector pivot)
```

---

## Indexing Strategy

Key indexes for performance:

```sql
-- users
UNIQUE INDEX uq_users_email ON users(email)
INDEX idx_users_is_admin ON users(is_admin)

-- agents
UNIQUE INDEX uq_agents_slug ON agents(slug)
INDEX idx_agents_is_active_sort ON agents(is_active, sort_order)

-- subscriptions
UNIQUE INDEX uq_subscriptions_user_agent ON subscriptions(user_id, agent_id)
INDEX idx_subscriptions_user_id ON subscriptions(user_id)
INDEX idx_subscriptions_agent_id ON subscriptions(agent_id)
INDEX idx_subscriptions_status ON subscriptions(status)

-- user_connectors
UNIQUE INDEX uq_user_connectors_user_connector ON user_connectors(user_id, connector_id)

-- activity_logs
INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at)
```

---

## Migrations

All schema changes are managed via Laravel migrations in `database/migrations/`. Run migrations with:

```bash
php artisan migrate              # Run pending migrations
php artisan migrate:fresh        # Reset + migrate (dev only)
php artisan migrate:refresh      # Rollback all + migrate (dev only)
```

See [Development Guide](development.md) for more.
