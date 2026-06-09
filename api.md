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

### Self-service (Dashboard)

Authenticated users can manage their own keys via the session-authenticated key management API:

**List keys**
```http
GET /api/gateway/keys
```
Returns metadata for all your keys (never the raw key value).

**Create a key**
```http
POST /api/gateway/keys
Content-Type: application/json

{ "name": "my-script" }
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

Admins can issue keys on behalf of any user at `/admin/api-keys`. An optional expiry date can be set. The raw key is displayed once in the admin UI after creation.

---

## Proxy Endpoint

```
ANY /api/gateway/{connector_slug}/{path}
```

The gateway authenticates your key, resolves your active connector connection, injects the appropriate upstream credential (OAuth token or API key), and forwards the request to the upstream service.

- `{connector_slug}` — the slug of a connector you have active (e.g. `anthropic`, `microsoft`, `gmail`)
- `{path}` — the upstream API path to call (e.g. `v1/messages`, `me/messages`)
- Any HTTP method is supported (`GET`, `POST`, `PUT`, `DELETE`, etc.)
- Query parameters pass through on `GET` requests; JSON body passes through on all other methods
- `Content-Type` and `Accept` headers are forwarded to the upstream

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
| **API key connector** (e.g. Anthropic, Gemini, SCX AI) | Gateway reads your connector config and injects the key using the connector's configured auth header and prefix |

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
| `502 Bad Gateway` | Connector has no `base_url` configured — contact support |

Upstream errors are passed through with their original HTTP status code.

---

## Usage Logging

Every proxy request is logged to the connector usage log, regardless of success or failure. Admins can review usage at `/admin/token-usage`. Each log entry records:

- User ID
- Connector slug
- Upstream path called
- Status (`ok` or `error`)
- Error message if applicable

---

## Key Security

- Keys are hashed with SHA-256 before storage — ApiSpi cannot retrieve a plain key
- The `key_prefix` field (first 12 characters) lets you identify which key was used without exposing the full value
- `last_used_at` is updated on every request — use it to detect unused keys
- Revoke keys immediately via the dashboard or admin panel if they are compromised
- Use one key per integration or script so individual keys can be revoked without affecting others
