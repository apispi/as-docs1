# Authentication

## Login Methods

ApiSpi supports three authentication methods:

| Method | Route | Notes |
|---|---|---|
| Email & password | `POST /login` | Standard Laravel session auth |
| Google OAuth | `GET /auth/google/redirect` | Redirects to Google consent; callback at `/auth/google/callback` |
| Microsoft Azure (Entra) SSO | `GET /auth/azure/redirect` | Redirects to Microsoft Entra; callback at `/auth/azure/callback` |

## Registration

Users can self-register at `/register` or register via Google/Azure OAuth. Email verification is not enforced by default.

## Password Reset

Standard Laravel password reset flow:
1. `GET /forgot-password` — request reset link
2. `POST /forgot-password` — send reset email
3. `GET /reset-password/{token}` — reset form
4. `POST /reset-password` — apply new password

## Azure SSO & Role Mapping

When a user authenticates via Microsoft Entra (Azure AD), the platform fetches their group memberships and maps them to ApiSpi roles using the `config/azure.php` role map.

```php
// config/azure.php
'role_map' => [
    env('AZURE_ADMIN_GROUP', '') => 'admin',
    env('AZURE_AGENT_GROUP', '') => 'agent_user',
],
```

Groups are matched by **display name or object ID**. The `AZURE_ADMIN_GROUP` env var maps to the `admin` role, which also sets `is_admin = true` on the user.

If `AZURE_SYNC_ADMIN=true`, the admin flag is also **removed** when the user is no longer in the admin group. When false (default), admin can also be granted manually and Azure only adds the flag.

## Roles & Permissions

| Role | Access |
|---|---|
| Regular user | Dashboard, subscribed agents, connectors, Aria, profile |
| `is_admin` | All of the above + `/admin/*` panel |

The admin panel is protected by the `admin` middleware.

## Session Management

- Auth routes (login, register) are wrapped in `guest` middleware
- OAuth callbacks are outside the `guest` middleware to allow re-auth on token refresh
- Logout: `POST /logout`

## User Profile & Personalisation

Authenticated users can update their profile at `/dashboard/profile`:

- Name, email, password
- Billing details
- **Personalisation** — preferred name, job title, industry, organisation, communication style, response length preference, about you, custom instructions

The `personalisation` field (stored as JSON on the user) is injected into Aria's system prompt to personalise responses.
