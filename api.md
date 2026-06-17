# ApiSpi API Gateway

The ApiSpi API Gateway lets you call your connected third-party services (connectors) programmatically — from your own code, scripts, or external tools — using a single authenticated endpoint. Your API key carries your identity and connector credentials, so you never need to manage upstream OAuth tokens or API keys yourself.

---

## Base URL

```
https://apispi.com/api
```

---

## Authentication

All gateway requests are authenticated with a **Bearer API key** in the `Authorization` header:

```http
Authorization: Bearer gw_<your-key>
```

Keys are prefixed with `gw_` and are 51 characters long. The raw key is shown **once** when generated — store it immediately in a secrets manager or `.env` file. ApiSpi stores only a SHA-256 hash; the plain key cannot be recovered.

Keys do not expire by default. Admins may set an explicit expiry date when issuing a key.

---

## Issuing API Keys

There are three places keys can be managed, all session-authenticated (not Bearer) — the Bearer key itself is only used against the proxy endpoint below.

### Self-service (Dashboard UI)

The primary way users manage their own keys: the **API Keys** panel on `/dashboard/profile` (`#api-keys`), backed by `/dashboard/api-keys` routes. Supports setting an optional `expires_at` at creation time.

### Self-service (JSON API)

A JSON equivalent of the same self-service flow, useful for scripting key management itself:

**List keys**
```http
GET /api/gateway/keys
```
Returns metadata for all your keys — never the raw key value. Each entry includes `id`, `name`, `key_prefix`, `last_used_at`, `expires_at`, `created_at`.

**Create a key**
```http
POST /api/gateway/keys
Content-Type: application/json

{ "name": "my-script", "expires_at": "2027-01-01" }
```
Response (201):
```json
{
  "id": 12,
  "name": "my-script",
  "key": "gw_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789012345678901",
  "key_prefix": "gw_AbCdEfGh"
}
```
Copy the `key` value now — it will not be shown again.

**Revoke a key**
```http
DELETE /api/gateway/keys/{id}
```

### Admin-issued keys

Admins can issue keys on behalf of any user at `/admin/api-keys` (pick the user from a dropdown). An optional expiry date can be set. The raw key is displayed once in the admin UI after creation.

### Key scope

A key is **not** restricted to specific connectors — it inherits whichever connectors the owning user has actively connected. There is currently no way to scope a key to a subset of connectors, nor to attach a custom rate limit to an individual key.

---

## Proxy Endpoint

```
ANY /api/gateway/{connector_slug}/{path?}
```

The gateway authenticates your key, resolves your active connector connection, runs the request through the AI firewall policy check, injects the appropriate upstream credential (OAuth token or API key), and forwards the request to the upstream service.

- `{connector_slug}` — the slug of a connector you have active (e.g. `anthropic`, `microsoft`, `gmail`)
- `{path}` — the upstream API path to call (e.g. `v1/messages`, `me/messages`). Optional — connectors that don't need a sub-path (e.g. a single fixed endpoint) can be called without one
- Any HTTP method is supported (`GET`, `POST`, `PUT`, `DELETE`, etc.)
- Query parameters pass through on `GET` requests; JSON body passes through on all other methods
- `Content-Type` and `Accept` headers are forwarded to the upstream
- No rate limiting is currently applied to gateway/proxy requests (unlike the chatbot and lead-gen forms — see [Rate Limiting & Security](architecture.md#rate-limiting--security))

### Example: call Anthropic through the gateway

```bash
curl -X POST https://apispi.com/api/gateway/anthropic/v1/messages \
  -H "Authorization: Bearer gw_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

The gateway injects your Anthropic API key automatically — you send only your ApiSpi gateway key.

### Example: list Microsoft 365 emails

```bash
curl "https://apispi.com/api/gateway/microsoft/me/messages?\$top=10&\$select=subject,from,receivedDateTime" \
  -H "Authorization: Bearer gw_<your-key>"
```

The gateway injects a valid OAuth access token for Microsoft Graph, refreshing it if needed.

---

## How Auth is Resolved

The gateway determines upstream authentication based on the connector type:

| Connector type | How upstream auth works |
|---|---|
| **OAuth connector** (e.g. Microsoft, Gmail, OneDrive) | Gateway fetches your stored OAuth token, refreshes it if expired, and injects it as `Authorization: Bearer <token>` |
| **API key connector** (e.g. Anthropic, Gemini, SCX AI) | Gateway reads the connector's configured `auth_header`, `auth_prefix`, and `auth_config_field` and injects the key from your connector config accordingly. Some connectors mark auth as optional (`auth_optional`) |
| **Bring-your-own-backend** | If the connector has no `base_url` configured, the gateway falls back to a user-supplied `endpoint_url` from your connector config instead of returning `502` |

If your connector is not active or has no credentials configured, the gateway returns `403 Forbidden` with an explanatory message.

---

## Error Responses

All errors are returned as JSON.

| Status | Meaning |
|---|---|
| `401 Missing API key` | No `Authorization` header supplied |
| `401 Invalid API key` | Key not found (wrong value or already revoked) |
| `401 API key expired` | Key has passed its expiry date |
| `403 Forbidden` | You do not have an active connection to the requested connector, or the connector's upstream credentials are missing |
| `404 Not found` | Connector slug does not exist or is inactive |
| `502 Bad Gateway` | Connector has no `base_url` configured and no user-supplied `endpoint_url` is set |

Upstream errors are passed through with their original HTTP status code.

---

## Usage Logging

Every proxy request is logged to the `connector_usage_log` table, regardless of success or failure. Admins can review usage at `/admin/token-usage`. Each log entry records:

- `user_id`
- `connector_slug`
- `tool_name` — the upstream path/tool called
- `status` (`ok` or `error`)
- `result_count` — set when applicable (e.g. number of items returned), otherwise null
- `error_message` if applicable
- `created_at`

There is no per-request HTTP status code, method, or response-time field recorded.

---

## Key Security

- Keys are hashed with SHA-256 before storage — ApiSpi cannot retrieve a plain key
- The `key_prefix` field (first 12 characters) lets you identify which key was used without exposing the full value
- `last_used_at` is updated on every request — use it to detect unused keys
- Revoke keys immediately via the dashboard or admin panel if they are compromised
- Use one key per integration or script so individual keys can be revoked without affecting others
