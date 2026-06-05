# Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Laravel (PHP) |
| Frontend | Blade templates, Vite |
| Database | MySQL (Eloquent ORM) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| AI | Anthropic API, Google Gemini API, SCX AI API |
| OAuth | Microsoft Graph API, Google OAuth 2.0 |
| External data | Bureau of Meteorology (BOM) public feeds, Substack API |

## Key Models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Platform users; includes `personalisation` JSON, `is_admin`, `azure_roles` |
| `Agent` | `agents` | AI agent definitions with pricing, features, and Stripe links |
| `Subscription` | `subscriptions` | User–Agent subscription records |
| `Skill` | `skills` | Capabilities attached to agents/subscriptions |
| `Connector` | `connectors` | Integration definitions including OAuth config and tool schemas |
| `UserConnector` | `user_connectors` | Per-user connector configuration and API key storage |
| `ConnectorToken` | `connector_tokens` | OAuth access/refresh tokens, indexed by connector slug and user |
| `TokenUsage` | `token_usage` | Per-request LLM token consumption (input + output) |
| `ConnectorUsageLog` | `connector_usage_logs` | Per-tool-call log with status and result count |
| `Training` | `trainings` | Training course catalogue |
| `AvatarLead` | `avatar_leads` | Digital avatar enquiry/demo leads |
| `ActivityLog` | `activity_logs` | Admin audit log |

## Key Controllers

| Controller | Responsibility |
|---|---|
| `ChatController` | Public Aria chatbot (`POST /chat`) |
| `DashboardAriaChatController` | Dashboard Aria with multi-provider agentic loop (`POST /dashboard/aria/chat`) |
| `DashboardChatController` | Simplified dashboard chat (agent-specific context) |
| `AuthController` | Auth, dashboard pages, connector management, profile |
| `ConnectorOAuthController` | OAuth flows for Microsoft and Gmail |
| `AgentController` | Public agent catalogue |
| `CheckoutController` | Stripe checkout session creation |
| `StripeWebhookController` | Stripe webhook handling (subscription lifecycle) |
| `AvatarController` | Digital avatar enquiry and lead capture |
| `SubscribeController` | Email subscription capture |
| Admin controllers | `/admin/*` — users, subscriptions, agents, connectors, skills, training, leads |

## Agentic Loop Architecture

```
User message
    │
    ▼
DashboardAriaChatController::process()
    │
    ├── Resolve provider (SCX → Gemini → Anthropic)
    ├── Resolve model (request → mode → connector → default)
    ├── Build system prompt (base + personalisation + mode overlay + config disclosure)
    ├── Build tools (from active connectors, filtered by mode)
    │
    ▼
runAgentLoop() / runGeminiLoop() / runScxLoop()
    │
    ├── POST to provider API
    │
    ├── stop_reason == tool_use?
    │   ├── YES → executeTool() → append results → loop (max 5 iterations)
    │   └── NO  → return text response
    │
    ▼
TokenUsage::record()  +  return { reply, tool_calls }
```

## Multi-Provider Tool Format Translation

Tool schemas are stored in **Anthropic format** (`input_schema`) and translated at runtime:

| Target Provider | Translation |
|---|---|
| Anthropic | Used as-is |
| Gemini | Wrapped in `functionDeclarations`; `input_schema` → `parameters` |
| SCX AI | Wrapped in OpenAI `function` format; `input_schema` → `parameters` |

Tool results are similarly translated for each provider's message format:
- Anthropic: `{ type: "tool_result", tool_use_id, content }`
- Gemini: `{ functionResponse: { name, response } }`
- SCX / OpenAI: `{ role: "tool", tool_call_id, content }`

## Rate Limiting

| Endpoint | Limit |
|---|---|
| `POST /chat` (public Aria) | 30 requests per IP per minute |
| `POST /dashboard/aria/chat` | 30 requests per user ID per minute |
| `POST /dashboard/chat` | 30 requests per user ID per minute |
| `POST /partners` | 5 per 10 minutes per IP |
| `POST /digital-avatars` | 5 per 10 minutes per IP |

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Platform-level Anthropic API key (fallback when user has no connector) |
| `ANTHROPIC_MODEL` | Default model (e.g. `claude-sonnet-4-6`) |
| `STRIPE_KEY` / `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` | Stripe integration |
| `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID` | Entra SSO |
| `AZURE_ADMIN_GROUP` / `AZURE_AGENT_GROUP` | Entra group names for role mapping |
| `AZURE_SYNC_ADMIN` | Whether to revoke admin flag when not in admin group |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
