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

<details>
<summary>curl</summary>

```bash
curl -X POST https://apispi.com/api/gateway/keys \
  -H "Cookie: <your-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "my-script", "expires_at": "2027-01-01" }'
```
</details>

<details>
<summary>Python</summary>

```python
import requests

resp = requests.post(
    "https://apispi.com/api/gateway/keys",
    json={"name": "my-script", "expires_at": "2027-01-01"},
    cookies={"apispi_session": "<your-session-cookie>"},
)
key = resp.json()["key"]
print(key)  # store this now — it is never returned again
```
</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const resp = await fetch("https://apispi.com/api/gateway/keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // sends your session cookie
  body: JSON.stringify({ name: "my-script", expires_at: "2027-01-01" }),
});
const { key } = await resp.json();
console.log(key); // store this now — it is never returned again
```
</details>

**Revoke a key**
```http
DELETE /api/gateway/keys/{id}
```

### Admin-issued keys

Admins can issue keys on behalf of any user at `/admin/api-keys` (pick the user from a dropdown). An optional expiry date can be set. The raw key is displayed once in the admin UI after creation.

### Key scope

A key is **not** restricted to specific connectors — it inherits whichever connectors the owning user has actively connected. There is currently no way to scope a key to a subset of connectors, nor to attach a custom rate limit to an individual key.

---

## Unified API Gateway

The unified gateway exposes all your connected tools through a single, normalized interface. Instead of constructing raw HTTP requests for each upstream service, you discover tools via a manifest and invoke them by name. The gateway handles routing and credential injection automatically.

**Discover available tools**
```http
GET /api/gateway/tools
```
Returns a manifest of every tool available to you, grouped by connector, including the JSON-schema for expected inputs.

<details>
<summary>curl</summary>

```bash
curl https://apispi.com/api/gateway/tools \
  -H "Authorization: Bearer gw_<your-key>"
```
</details>

<details>
<summary>Python</summary>

```python
import requests

resp = requests.get(
    "https://apispi.com/api/gateway/tools",
    headers={"Authorization": "Bearer gw_<your-key>"},
)
for tool in resp.json()["tools"]:
    print(tool["name"], "—", tool["description"])
```
</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const resp = await fetch("https://apispi.com/api/gateway/tools", {
  headers: { Authorization: "Bearer gw_<your-key>" },
});
const { tools } = await resp.json();
console.log(tools.map(t => t.name));
```
</details>

**Invoke a tool**
```http
POST /api/gateway/invoke
Content-Type: application/json

{
  "tool": "tool_name",
  "input": { "param": "value" }
}
```
The gateway resolves which connector owns the tool, injects your credentials, and returns the result as JSON.

<details>
<summary>curl</summary>

```bash
curl -X POST https://apispi.com/api/gateway/invoke \
  -H "Authorization: Bearer gw_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{ "tool": "gmail_search_messages", "input": { "query": "from:someone subject:meeting" } }'
```
</details>

<details>
<summary>Python</summary>

```python
import requests

resp = requests.post(
    "https://apispi.com/api/gateway/invoke",
    headers={"Authorization": "Bearer gw_<your-key>"},
    json={
        "tool": "gmail_search_messages",
        "input": {"query": "from:someone subject:meeting"},
    },
)
print(resp.json())
```
</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const resp = await fetch("https://apispi.com/api/gateway/invoke", {
  method: "POST",
  headers: {
    Authorization: "Bearer gw_<your-key>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    tool: "gmail_search_messages",
    input: { query: "from:someone subject:meeting" },
  }),
});
console.log(await resp.json());
```
</details>

---

## OpenAI-Compatible Gateway Endpoints

```
GET   https://apispi.com/api/gateway/v1/models
POST  https://apispi.com/api/gateway/v1/chat/completions
```

You can point any OpenAI-compatible client at the base URL `https://apispi.com/api/gateway/v1` using your gateway key (`gw_xxxxx`):

<details>
<summary>Python (openai SDK)</summary>

```python
from openai import OpenAI

client = OpenAI(base_url="https://apispi.com/api/gateway/v1", api_key="gw_xxxxx")
resp = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Search my connectors and summarize"}],
)
print(resp.choices[0].message.content)
```
</details>

<details>
<summary>JavaScript (openai SDK)</summary>

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://apispi.com/api/gateway/v1",
  apiKey: "gw_xxxxx",
});
const resp = await client.chat.completions.create({
  model: "claude-sonnet-4-6",
  messages: [{ role: "user", content: "Search my connectors and summarize" }],
});
console.log(resp.choices[0].message.content);
```
</details>

<details>
<summary>curl</summary>

```bash
curl https://apispi.com/api/gateway/v1/chat/completions \
  -H "Authorization: Bearer gw_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Search my connectors and summarize"}]
  }'
```
</details>

**How it works:** 
The request runs through the same agentic engine Aria uses (`runAgentLoop`) — the caller's active connectors are auto-injected as tools and executed server-side — and the final message comes back in OpenAI's `chat.completion` shape (`id`, `object`, `choices[].message`, `usage`). It also adds a non-standard `apispi.tool_calls` field so you can see which connector tools ran.

**v1 scope / limitations (worth knowing):**
- **Non-streaming only.** `stream:true` is rejected — SSE is the planned follow-up.
- **Model maps to Anthropic.** A `claude-*` model passes through; anything else (e.g. `gpt-4o`) falls back to the platform default. `/v1/models` advertises the Claude models.
- **Client-supplied tools are ignored** — the gateway uses your connectors as the tool set and runs them itself (its value-add), rather than returning `tool_calls` for client-side execution.
- `max_tokens` from the request isn't honored yet (fixed 1024 in the loop).
- Validation/auth/throttle errors now render as JSON (forced `Accept: application/json` in GatewayAuth, so clients without that header still get OpenAI-style error objects).

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

The gateway injects your Anthropic API key automatically — you send only your ApiSpi gateway key.

<details>
<summary>curl</summary>

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
</details>

<details>
<summary>Python</summary>

```python
import requests

resp = requests.post(
    "https://apispi.com/api/gateway/anthropic/v1/messages",
    headers={"Authorization": "Bearer gw_<your-key>"},
    json={
        "model": "claude-sonnet-4-6",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "Hello"}],
    },
)
print(resp.json())
```
</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const resp = await fetch("https://apispi.com/api/gateway/anthropic/v1/messages", {
  method: "POST",
  headers: {
    Authorization: "Bearer gw_<your-key>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello" }],
  }),
});
console.log(await resp.json());
```
</details>

<details>
<summary>PHP</summary>

```php
<?php
$ch = curl_init("https://apispi.com/api/gateway/anthropic/v1/messages");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer gw_<your-key>",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "model" => "claude-sonnet-4-6",
        "max_tokens" => 1024,
        "messages" => [["role" => "user", "content" => "Hello"]],
    ]),
]);
echo curl_exec($ch);
```
</details>

### Example: list Microsoft 365 emails

The gateway injects a valid OAuth access token for Microsoft Graph, refreshing it if needed.

<details>
<summary>curl</summary>

```bash
curl "https://apispi.com/api/gateway/microsoft/me/messages?\$top=10&\$select=subject,from,receivedDateTime" \
  -H "Authorization: Bearer gw_<your-key>"
```
</details>

<details>
<summary>Python</summary>

```python
import requests

resp = requests.get(
    "https://apispi.com/api/gateway/microsoft/me/messages",
    headers={"Authorization": "Bearer gw_<your-key>"},
    params={"$top": 10, "$select": "subject,from,receivedDateTime"},
)
for msg in resp.json()["value"]:
    print(msg["subject"])
```
</details>

<details>
<summary>JavaScript (fetch)</summary>

```javascript
const url = new URL("https://apispi.com/api/gateway/microsoft/me/messages");
url.searchParams.set("$top", "10");
url.searchParams.set("$select", "subject,from,receivedDateTime");

const resp = await fetch(url, {
  headers: { Authorization: "Bearer gw_<your-key>" },
});
const { value } = await resp.json();
console.log(value.map(m => m.subject));
```
</details>

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
