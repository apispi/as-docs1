# Connectors

Connectors are integrations with external services that extend Aria's capabilities and power agent functionality. Each connector is defined in the `connectors` table and can be linked to users via `user_connectors`.

---

## Connector Types

### API Key Connectors

The user provides an API key (and optionally other config values). The key is stored in `user_connectors.config` and used directly in tool calls.

Examples: Anthropic, Google Gemini, SCX AI, Substack.

### OAuth Connectors

The user completes an OAuth flow. Tokens are stored in `connector_tokens` and automatically refreshed via `OAuthService::getValidToken()`.

Examples: Microsoft 365, Gmail.

OAuth flows are handled by `ConnectorOAuthController`:
- `GET /connectors/{slug}/authorize` — starts the OAuth redirect
- `GET /connectors/{slug}/callback` — receives the token after consent
- `POST /connectors/{slug}/disconnect` — revokes the user's token

---

## Connector Data Model

### `connectors` table

| Field | Type | Description |
|---|---|---|
| `slug` | string | Unique identifier (e.g. `anthropic`, `microsoft`) |
| `name` | string | Display name |
| `description` | string | Short description shown in the UI |
| `category` | string | Grouping label |
| `is_active` | boolean | Whether the connector appears in the catalogue |
| `is_oauth` | boolean | Whether the connector uses OAuth instead of API key |
| `oauth_*` | various | OAuth client credentials, endpoints, scopes, extra params |
| `config_schema` | JSON array | Field definitions for the user-facing configuration form |
| `tool_definitions` | JSON array | Anthropic-format tool schemas exposed to Aria |

### `user_connectors` table

Each row represents a user's connection to a specific connector.

| Field | Description |
|---|---|
| `user_id` | Owning user |
| `connector_id` | The connector being used |
| `status` | `active` or `inactive` |
| `config` | JSON object — stores API keys, model overrides, and connector-specific options |

---

## AI Provider Connectors

These connectors configure which LLM Aria uses on the dashboard.

| Connector | Slug | Config Keys |
|---|---|---|
| Anthropic | `anthropic` | `api_key`, `model` |
| Google Gemini | `gemini` | `api_key`, `model` |
| SCX AI | `scx` | `api_key`, `model`, `vector_store_id` |

If a user connects Anthropic, their key takes precedence over the platform's fallback key. The model configured on the connector is used unless overridden by the mode or the request.

---

## Managing Connectors

### User self-service (dashboard)

Users manage their connectors at `/dashboard/connectors`:

| Action | Route |
|---|---|
| View all connectors | `GET /dashboard/connectors` |
| Connect an API-key connector | `POST /dashboard/connectors/{connector}/connect` |
| Configure connector settings | `POST /dashboard/connectors/{connector}/configure` |
| Edit an existing connection | `GET /dashboard/connectors/{userConnector}/edit` |
| Update connection config | `PUT /dashboard/connectors/{userConnector}` |
| Disconnect | `DELETE /dashboard/connectors/{userConnector}` |

### Admin management

Admins can manage the connector catalogue at `/admin/connectors` and assign connectors to users directly at `/admin/users/{user}/connectors`.

---

## Tool Definitions

A connector's `tool_definitions` field is a JSON array of tool schemas in Anthropic's tool format:

```json
[
  {
    "name": "tool_name",
    "description": "What this tool does.",
    "input_schema": {
      "type": "object",
      "properties": {
        "param": { "type": "string", "description": "..." }
      },
      "required": ["param"]
    }
  }
]
```

When Aria builds its tool list, it merges definitions from all of the user's active connectors. If a mode restricts tools (e.g. Email mode only allows `graph_get_emails` and `graph_search_emails`), only matching tools are passed to the LLM.

The internal metadata fields `_connector_slug` and `_connector_config` are stripped before the tool list is sent to any LLM.
