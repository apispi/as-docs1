# Aria AI Assistant

Aria is ApiSpi's AI assistant. There are two variants: the **public chatbot** on the marketing site, and the **dashboard Aria** available to authenticated users.

---

## Public Chatbot

**Route:** `POST /chat` (handled by `ChatController`)

The public chatbot is embedded on the website. It answers questions about ApiSpi's services, pricing, and partners.

### Behaviour
- Rate-limited to **30 messages per IP per minute**
- Responses capped at **512 tokens**
- Keeps up to **10 messages of conversation history** per session
- Accepts up to 20 history entries (oldest are trimmed)

### AI Provider
Uses the Anthropic API (`https://api.anthropic.com/v1/messages`) with model configured via `services.anthropic.model` (defaults to `claude-sonnet-4-5`).

If no API key is configured, Aria returns a static fallback message directing users to `sales@apispi.com`.

### System Prompt Topics
Aria is primed with detailed knowledge of:
- All 9 agents with descriptions
- Digital Avatar service
- Training courses and pricing
- Partner program (Referral and Agency tiers)
- Recent news/blog posts
- Contact information and business hours

---

## Dashboard Aria

**Route:** `POST /dashboard/aria/chat` (handled by `DashboardAriaChatController`)

Authenticated users access a full-featured, personalised Aria assistant.

### Provider Resolution

Dashboard Aria supports **three AI providers**, resolved in priority order:

| Priority | Provider | Condition |
|---|---|---|
| 1 | **SCX AI** | User has an active SCX connector and no explicit Anthropic/Gemini model requested |
| 2 | **Google Gemini** | User has an active Gemini connector and no Anthropic API key or explicit Claude model |
| 3 | **Anthropic** | Default. Uses user's Anthropic connector key or the platform's fallback key |

If no provider is configured at all, Aria falls back to a keyword-matching static response and shows a notice to connect a provider.

### Model Selection

The resolved model follows this hierarchy (per provider):
1. Explicit `model` param in the request
2. Mode's configured model override (e.g. Research mode forces `claude-opus-4-8`)
3. Model configured on the user's connector
4. Platform default (`claude-sonnet-4-6` for Anthropic, `gemini-2.0-flash` for Gemini, `default` for SCX)

### Modes

Aria supports five modes that change its behaviour and optionally restrict available tools:

| Mode | Icon | Description | Model Override | Tools Restricted To |
|---|---|---|---|---|
| **General** | ◇ | Default assistant behaviour | None | None (all tools) |
| **Email** | ✉ | Email management, drafting, summarising | None | `graph_get_emails`, `graph_search_emails` |
| **Research** | ◎ | Thorough analytical responses, structured with headings | `claude-opus-4-8` | None |
| **Strategy** | ◈ | Business strategy, frameworks, pros/cons | None | None |
| **Technical** | ⬡ | Precise technical answers, code examples | None | None |

### Personalisation

Aria injects user profile data into the system prompt when available:
- Preferred name, job title, industry, organisation
- Communication style preference
- Preferred response length
- Custom instructions

### Disclosure Handling

Aria intercepts questions about its own configuration and answers directly (bypassing the LLM to avoid deflection):
- "What model are you?" → returns provider, model, and mode
- "What connectors do you have?" → lists the user's active connectors
- "What mode are you in?" → returns current mode
- "Tell me about your configuration" → full summary of all the above

### Agentic Loop

Dashboard Aria runs a **tool-use loop** with up to **5 iterations** per request. When the model returns a `tool_use` stop reason, Aria:
1. Executes each tool call against the appropriate connector
2. Returns tool results back to the model
3. Loops until the model produces a final text response or the iteration limit is reached

### Token Tracking

Input and output tokens are recorded per request in `token_usage` table via `TokenUsage::record()`, attributed to the user, provider, and model. Admins can view usage at `/admin/token-usage`.

---

## Available Tools (via Connectors)

Tools are dynamically assembled from the user's active connectors. Each connector's `tool_definitions` field defines the tools it exposes (in Anthropic tool schema format). The agentic loop strips internal metadata before sending to the LLM.

### Microsoft 365 (slug: `microsoft`)

OAuth-based. Uses Microsoft Graph API.

| Tool | Description |
|---|---|
| `graph_get_emails` | Fetch recent inbox messages (up to 20). Supports `$filter`. |
| `graph_search_emails` | Search emails by keyword query. Returns up to 10 results. |
| `graph_list_calendar` | List upcoming calendar events for a configurable number of days (default 7, up to 20 events). |
| `graph_list_files` | List OneDrive files/folders. Optionally specify a folder path. |
| `graph_search_sharepoint` | Search SharePoint drive items and list items by query string. |

### Gmail (slug: `gmail`)

OAuth-based.

| Tool | Description |
|---|---|
| `gmail_list_messages` | List inbox messages (up to 25). Supports label filter. |
| `gmail_search_messages` | Search messages by Gmail query syntax. |
| `gmail_send_email` | Send an email. Requires `to`, `subject`, and `body`. |

### Bureau of Meteorology (slug: `bom`)

No auth required. Fetches from BOM public data feeds.

| Tool | Description |
|---|---|
| `bom_get_observations` | Current weather observations for a city. Returns temperature, humidity, wind, pressure, and more. |
| `bom_get_forecast` | 7-day forecast for a major city. |

Supported cities for observations: Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Darwin, Canberra, Gold Coast, Sunshine Coast, Townsville, Cairns, Newcastle, Wollongong, Geelong, Ballarat, Bendigo, Albury, Launceston, Alice Springs, Port Hedland, Broome.

Forecast available for capital cities only: Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Darwin, Canberra.

A default city can be configured on the connector.

### Substack (slug: `substack`)

No auth — reads public Substack API.

| Tool | Description |
|---|---|
| `substack_list_posts` | Fetch recent posts from a configured Substack publication (up to 25). |
| `substack_search_posts` | Search posts by title, subtitle, or description text. |

A `publication_url` must be configured on the connector.

### SCX AI (slug: `scx`)

API key auth. OpenAI-compatible endpoint at `https://api.scx.ai`.

| Tool | Description |
|---|---|
| `scx_vector_search` | Semantic search against a configured vector store. Requires `vector_store_id` in connector config. Returns up to 20 results. |

SCX AI also serves as a full chat provider (OpenAI-compatible `/v1/chat/completions`), used instead of Anthropic/Gemini when it is the user's primary connected provider.

---

## Connector Usage Logging

Every tool execution (success or error) is recorded in `connector_usage_logs` via `ConnectorUsageLog::record()`, capturing: user, connector slug, tool name, status (`ok` / `error`), result count, and any error message.
