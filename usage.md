# ApiSpi Usage Guide

ApiSpi is an AI agents SaaS platform that builds and deploys enterprise-grade autonomous AI agents, digital avatars, and training services for Australian businesses.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Agent Catalog](#agent-catalog)
3. [Dashboard](#dashboard)
4. [Subscriptions](#subscriptions)
5. [Connectors](#connectors)
6. [Training](#training)
7. [Digital Avatars](#digital-avatars)
8. [Aria — AI Assistant](#aria--ai-assistant)
9. [Workspaces](#workspaces)
10. [Account & Profile](#account--profile)
11. [Admin Panel](#admin-panel)

---

## Getting Started

### Register

1. Visit `/register`
2. Enter your name, email address, and a password (minimum 8 characters)
3. Confirm your password and submit
4. You are automatically logged in and redirected to the dashboard

### Log In

1. Visit `/login`
2. Enter your email and password
3. Check **Remember me** to stay logged in for two weeks
4. On success you are redirected to `/dashboard` (or whatever page you were trying to reach)

### Forgot Password

1. Visit `/forgot-password`
2. Submit your email address
3. Follow the reset link emailed to you — it expires after 60 minutes and is single-use
4. Enter and confirm your new password; you are then redirected to login

### Log Out

Click **Log out** from the dashboard or submit `POST /logout`. Your session is destroyed and you are redirected to the home page.

---

## Agent Catalog

Browse available AI agents at `/agents`. Each agent card shows its name, category, rating, price, and a short description.

### View an Agent

Click any agent to open its detail page at `/agents/{slug}`. The page displays:

- **Features** — what the agent can do
- **Includes** — what is bundled with a subscription
- **Use Cases** — industry or scenario examples
- **Pricing Plans** — available tiers
- **FAQs** — common questions

### Subscribe to an Agent

From the agent detail page, click the **Get Started** (or equivalent CTA) button. You are taken to `/checkout` where you select a plan and complete payment via Stripe. After a successful payment you are redirected to `/checkout/success` and your subscription is activated.

> Authenticated users can also browse and subscribe directly from the dashboard catalog at `/dashboard/catalog`.

---

## Dashboard

After logging in you land on `/dashboard`. The dashboard is split into several sections accessible from the sidebar:

| Section | URL | Description |
|---|---|---|
| Overview | `/dashboard` | Summary of your active agents and recent activity |
| Subscriptions | `/dashboard/subscriptions` | Agents you are subscribed to |
| Catalog | `/dashboard/catalog` | Full agent and connector catalog |
| Connectors | `/dashboard/connectors` | OAuth integrations linked to your agents |
| Training | `/dashboard/training` | Training courses available to you |
| Aria | `/dashboard/aria` | Chat with the ApiSpi AI assistant |
| Profile | `/dashboard/profile` | Account settings |

---

## Subscriptions

### View Your Subscriptions

Visit `/dashboard/subscriptions` to see a list of all agents you have subscribed to, including each subscription's status and expiry date.

### View a Subscription Detail

Click a subscription to open `/dashboard/subscriptions/{id}`. Here you can:

- See the agent details, included skills, and available connectors
- Review subscription status and dates

### Pause or Reactivate a Subscription

From the subscription detail page, use the **Update Status** control. This sends `PUT /dashboard/subscriptions/{id}/status` with the new status value.

### Cancel a Subscription

From the subscription detail page, click **Cancel** (or equivalent). This sends `DELETE /dashboard/subscriptions/{id}` and removes the subscription from your account.

---

## Connectors

Connectors are third-party integrations (e.g. Slack, Zapier) that extend what your agents can do. You must connect a service before an agent can use it.

### View Available Connectors

Visit `/dashboard/connectors` to see all connectors assigned to your subscriptions.

### Connect via OAuth

1. Find the connector you want and click **Connect**
2. You are redirected to the provider's authorization page (`/connectors/{slug}/authorize`)
3. Approve the requested permissions on the provider's site
4. You are returned to ApiSpi via `/connectors/{slug}/callback`
5. The connector now shows as **Connected**

### Configure a Connector

Some connectors require additional settings beyond OAuth (e.g. a channel name or webhook URL). Click **Configure** on a connected connector to open the configuration form at `/dashboard/connectors/{id}/edit`, then save with `PUT /dashboard/connectors/{id}`.

### Disconnect a Connector

Click **Disconnect** on the connector. This sends `POST /connectors/{slug}/disconnect` and revokes your OAuth tokens.

---

## Training

Visit `/training` (public) or `/dashboard/training` (authenticated) to browse ApiSpi's training courses.

Each course covers topics related to AI agent deployment, integration, and management. Training content is curated by the ApiSpi team and published through the admin panel.

---

## Digital Avatars

ApiSpi's Digital Avatar service creates AI-powered video personas for professional services businesses — tailored for tradies, property agents, lawyers, accountants, beauticians, and hotel marketers. Avatars handle lead response, client education, and outreach at scale, 24/7.

### Request a Demo

1. Visit `/digital-avatars`
2. Fill in your name, email, phone, company, and a message describing your use case
3. Submit the form — an ApiSpi team member will follow up

> The demo request form is rate-limited to 5 submissions per 10 minutes per IP.

---

## Aria — AI Assistant

Aria is ApiSpi's AI assistant. There are two versions: a public widget on the contact page, and a full agentic assistant inside the dashboard. They share the same friendly persona but differ significantly in capability.

---

### Public Chat (Contact Page)

The chat widget at `/contact` is available without logging in. Use it to ask about ApiSpi's agents, pricing, training, or the partner program.

**Limits**

| Limit | Value |
|---|---|
| Rate limit | 30 messages per minute per IP |
| Message length | 1,000 characters |
| Conversation memory | Last 10 turns |
| Max response length | ~120 words |

**What Aria knows**

Aria has detailed knowledge of all ApiSpi products and can answer questions about:

- All 9 AI agents and their pricing
- Training courses and formats
- Digital Avatar service and how to book a demo
- Partner program (Referral and Agency tiers)
- Recent blog posts and company news
- Contact details and business hours

When no AI provider is configured on the backend, Aria falls back to a built-in intent classifier that recognises common questions about agents, pricing, training, and more — so basic questions are always answered even during service interruptions.

---

### Dashboard Aria (Authenticated)

The full Aria assistant is at `/dashboard/aria`. This is a substantially more capable experience: it uses your connected AI provider, operates in specialised modes, can call tools against your connected services, and personalises responses to your profile.

**Limits**

| Limit | Value |
|---|---|
| Rate limit | 30 messages per minute per account |
| Message length | 32,000 characters |
| Conversation memory | Last 10 turns |
| Max response length | ~1,024 tokens |
| Max tool call iterations | 5 per response |

---

### Modes

Switch modes from the chat interface to change how Aria reasons and responds. Each mode shapes the tone, structure, and tools available.

| Mode | Icon | Description |
|---|---|---|
| **General** | ◇ | Balanced, everyday assistant. All connected tools available. |
| **Email** | ✉ | Focused on email management. Restricted to email tools (`graph_get_emails`, `graph_search_emails`). Fetches real data before answering. |
| **Research** | ◎ | Deep, analytical responses with headings and evidence. Uses a more capable model (Opus). Considers multiple angles before concluding. |
| **Strategy** | ◈ | Business planning and decision-making. Structured frameworks, pros/cons, and concrete recommendations. |
| **Technical** | ⬡ | Precise technical responses with correct terminology and code examples. |

---

### AI Providers

Aria uses the AI provider connected via **My Connectors**. The priority order is:

1. **SCX AI** — Used when an SCX connector is active and no other provider is explicitly selected
2. **Google Gemini** — Used when a Gemini connector is active (select a `gemini-*` model to force this)
3. **Anthropic** — Default fallback; also used when a `claude-*` model is explicitly selected

If no provider is connected, Aria runs in basic mode using the built-in keyword classifier and shows a notice explaining how to enable full AI responses.

**Transparency:** Aria will honestly answer questions about which provider, model, and mode she is currently running — ask "What model are you using?" or "What's your current configuration?" at any time.

---

### Personalisation

Aria reads your profile settings to tailor responses. Set these under `/dashboard/profile` → **Personalisation**:

| Setting | Effect |
|---|---|
| Preferred name | Aria addresses you by this name |
| Job title | Context for role-relevant answers |
| Industry | Context for industry-specific framing |
| Organisation | Context Aria can reference |
| Communication style | Adjusts tone (formal, casual, etc.) |
| Response length | Controls verbosity (concise, detailed, etc.) |
| About you | Free-text background Aria uses as context |
| Custom instructions | Additional instructions Aria always follows |

---

### Connected Tools (Agentic Actions)

When you have active connectors, Aria can call them directly — fetching live data instead of relying on training knowledge. Aria will always use a connected tool before answering a question the tool can address.

Aria runs up to **5 tool calls per response** and reports what it did and what the result was.

#### Microsoft 365

Connect the **Microsoft** connector to give Aria access to your Outlook and SharePoint.

| Tool | What it does |
|---|---|
| `graph_get_emails` | Fetches recent emails from your inbox with subject, sender, date, and preview |
| `graph_search_emails` | Searches your mailbox by keyword |
| `graph_list_calendar` | Lists your upcoming calendar events for a given number of days |
| `graph_list_files` | Lists files and folders in your OneDrive or a specific folder |
| `graph_search_sharepoint` | Searches SharePoint for documents and list items |

#### OneDrive

Connect the **OneDrive** connector for full file management.

| Tool | What it does |
|---|---|
| `onedrive_list_files` | Lists files in a folder (or root) |
| `onedrive_search_files` | Searches your OneDrive by filename or keyword |
| `onedrive_get_file_metadata` | Returns metadata for a file (size, dates, URL) |
| `onedrive_read_file` | Reads the text content of a file (txt, md, csv, JSON, etc.) up to 1 MB |
| `onedrive_upload_file` | Uploads or overwrites a text file at a given path |
| `onedrive_create_folder` | Creates a new folder |
| `onedrive_move_item` | Moves or renames a file or folder |
| `onedrive_create_share_link` | Creates a shareable link (view or edit, anonymous or organisation) |
| `onedrive_delete_item` | Permanently deletes a file or folder |

#### Gmail

Connect the **Gmail** connector to let Aria work with your Google inbox.

| Tool | What it does |
|---|---|
| `gmail_list_messages` | Lists recent messages from a label (default: INBOX) with subject, sender, date, and snippet |
| `gmail_search_messages` | Searches Gmail using standard Gmail query syntax (e.g. `from:someone subject:meeting`) |
| `gmail_send_email` | Sends a plain-text email on your behalf |

#### YouTube

Connect the **YouTube** connector (Google OAuth, read-only) to let Aria browse YouTube on your behalf.

| Tool | What it does |
|---|---|
| `youtube_search_videos` | Searches YouTube for videos matching a query |
| `youtube_get_video_details` | Returns details (title, description, stats) for a video |
| `youtube_get_my_channel` | Returns details for your authenticated channel |
| `youtube_list_channel_videos` | Lists videos uploaded by a channel |
| `youtube_list_my_playlists` | Lists playlists on your channel |
| `youtube_get_playlist_items` | Lists the videos in a playlist |

> The YouTube connector and its tool definitions are seeded, but the Aria tool-execution handler for `youtube_*` tools is not yet implemented — connecting and viewing the connector works, but tool calls will currently fail.

#### Substack

Connect the **Substack** connector to manage your publication.

| Tool | What it does |
|---|---|
| `substack_list_posts` | Lists published posts with title, date, and URL |
| `substack_search_posts` | Searches posts by keyword in title, subtitle, or description |
| `substack_create_draft` | Creates a new draft with a title, subtitle, and body |
| `substack_publish_draft` | Publishes an existing draft by ID |
| `substack_list_drafts` | Lists your current unpublished drafts |

> Write tools (create/publish/list drafts) require your Substack email and password to be configured in the connector settings.

#### Bureau of Meteorology (BOM)

Connect the **BOM** connector to query live Australian weather data.

| Tool | What it does |
|---|---|
| `bom_get_observations` | Current conditions: temperature, feels-like, humidity, wind, pressure, rainfall, cloud cover |
| `bom_get_forecast` | 7-day forecast: min/max temperature, precipitation probability, and conditions summary |

Supported cities: Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Darwin, Canberra, Gold Coast, Sunshine Coast, Townsville, Cairns, Newcastle, Wollongong, Geelong, Ballarat, Bendigo, Albury, Launceston, Alice Springs, Port Hedland, Broome.

#### USASpending

Connect the **USASpending** connector to query US federal procurement data.

| Tool | What it does |
|---|---|
| `usaspending_search_awards` | Searches federal awards by keyword, date range, and award type (contract, grant, loan, IDV). Returns top results sorted by value. |
| `usaspending_top_recipients` | Lists the top award recipients by total amount for a given filter |
| `usaspending_agency_spending` | Breaks down total award spending by awarding agency |

#### SCX AI (Vector Search)

Connect the **SCX AI** connector and configure a vector store ID to give Aria semantic search over your own document collection.

| Tool | What it does |
|---|---|
| `scx_vector_search` | Searches your SCX AI vector store by natural language query and returns the most relevant document chunks |

---

### Document Upload

In the dashboard Aria chat, you can upload a document and ask Aria questions about it.

**Supported formats:** `.txt`, `.md`, `.csv`, `.pdf`  
**Max file size:** 5 MB  
**Max text extracted:** 30,000 characters (content beyond this is truncated)

PDF text is extracted automatically. Upload the file, then type your question — Aria will reason over the document content in that conversation turn.

---

### Token Usage

All Aria dashboard conversations are tracked. Admins can view token consumption at `/admin/token-usage`: a 30-day daily input/output chart, totals grouped by connector and model, and a filterable, paginated log of individual conversation turns (connector, user, date range) showing the prompt, reply, system prompt, and mode used. Connector tool-call activity (from the [API Gateway](api.md)) is tracked separately on the same page.

You can see your own usage on the **Usage**/**Token** tabs of `/dashboard/profile` — remaining, lifetime, and consumed token counts per AI provider, plus your recent usage history.

If an org-wide **daily token limit** is set (see [Governance](#governance--ai-firewall) below) and you exceed it, Aria responds with a fixed "you've reached your daily AI usage limit" message instead of calling the model for the rest of that day.

---

## Workspaces

A workspace is a **shared team chat space** — one Aria conversation thread visible to every member, not a private project container. Any authenticated user can create one.

### Create or Join a Workspace

- Go to `/dashboard/workspaces` to see workspaces you belong to and create a new one (gets a unique `slug` and `invite_code`)
- Join an existing workspace via its invite link: `/dashboard/workspaces/join/{inviteCode}`

### Invite & Manage Members

From a workspace's **Members** tab:

- Any member can invite others (by sharing the invite link, or by email)
- Each member has a `role` of **owner** or **member**. The owner cannot be removed and is the only one who can remove other members
- There is no admin/moderator tier beyond owner — any member can chat, invite others, or clear the shared history

### Workspace Chat

The **Chat** tab is a single shared thread — every member sees the same messages and AI replies, refreshed automatically (polled every few seconds). You can attach files and see which connector tools the AI used on a reply (tool-call badges).

> Sending a message is **not** gated by anything member-specific — any member can post at any time.

### Per-Member AI Toggle

Each member has an **AI enabled** switch on the Members tab (off by default). This does **not** control whether you can send messages — it controls whether *your* personal AI connector/personalisation settings are folded into the assistant's shared reply when it responds in the thread.

### Token Usage & Limits

Workspace chat reuses the same connector/tool pipeline as the regular dashboard Aria chat and is tracked in token usage (tagged as a workspace conversation). The org-wide **daily token limit** (see [Governance](#governance--ai-firewall)) still applies per user. Note that the org-wide **keyword guardrail** and **connectors-disabled kill switch** are dashboard-chat-only and are not currently enforced inside workspace chat.

### Clearing History

Any member can clear the entire shared message history for a workspace — this removes it for everyone, not just yourself.

---

## Account & Profile

All profile settings live under `/dashboard/profile`.

### Update Your Name or Email

Fill in the **Personal Details** section and save to send `PUT /dashboard/profile`.

### Change Your Password

Use the **Password** section — enter your current password and then your new password (confirmed). Saves via `PUT /dashboard/profile/password`.

### Personalisation

Adjust display preferences (e.g. theme or notification options) in the **Personalisation** section. Saves via `PUT /dashboard/profile/personalisation`.

### Billing Details

Update your billing name or address in the **Billing** section. Saves via `PUT /dashboard/profile/billing`.

### Account Settings

Manage other preferences in the **Settings** section. Saves via `PUT /dashboard/profile/settings`.

### Delete Your Account

At the bottom of the profile page, use the **Delete Account** control. This action is permanent — your account, subscriptions, and connector connections are removed. Submits `DELETE /dashboard/profile`.

### API Keys

Manage your own API Gateway keys from the **API Keys** section of your profile (`/dashboard/profile#api-keys`) — create, name, set an optional expiry, and revoke keys for programmatic access. See [API Gateway](api.md) for full details on using a key.

### Affiliate Program

Every user gets a referral code, visible in the **Affiliate** tab of `/dashboard/profile` along with a ready-to-share link (`https://apispi.com/register?ref=<your-code>`) and a **copy link** button.

- **Referral History** sub-tab lists everyone who signed up using your link
- A **conversion** is recorded — and earns you a commission — when a referred user makes a paid subscription or token purchase (signing up alone does not generate a commission)
- The commission rate is a fixed percentage of the purchase amount, shown on the Affiliate tab
- Commissions start as **pending** and are marked **paid** by an admin; the tab shows your pending and paid totals

---

## Admin Panel

> The admin panel is only accessible to users with the `is_admin` flag set. Admins are identified by the **red/rose** color scheme in the UI.

The admin panel is available at `/admin` and covers:

| Section | URL | Description |
|---|---|---|
| Dashboard | `/admin` | Overview and key metrics |
| Agents | `/admin/agents` | Create, edit, and delete agents; includes an **All Tools** tab (see below) |
| Skills | `/admin/skills` | Manage agent skills and categories |
| Connectors | `/admin/connectors` | Manage OAuth connectors |
| Subscriptions | `/admin/subscriptions` | View and manage all user subscriptions |
| Users | `/admin/users` | View users, toggle admin status |
| Trainings | `/admin/trainings` | Publish and manage training courses |
| Leads | `/admin/leads` | View and manage digital avatar demo requests |
| Activity Log | `/admin/activity` | Audit log of all admin and user actions |
| Token Usage | `/admin/token-usage` | AI API token consumption tracking |
| Sales | `/admin/sales` | Revenue overview; **Affiliates** tab for referral/commission tracking |
| Governance | `/admin/policy` | Org-wide AI policy: blocked keywords, daily token limit, connector kill switch |
| AI Firewall | `/admin/firewall` | PII/prompt-injection detection rules and activity log |
| Azure Policies | `/admin/azure/policies` | Azure AD policy configuration |

### All Tools (Admin Catalog)

The **All Tools** tab on `/admin/agents` lists every tool definition exposed by every connector — a read-only inspector over the same `tool_definitions` JSON that Aria's chat backend uses to build its tool list.

For each tool it shows the tool name, owning connector (with icon and link to `/admin/connectors/{id}/edit`), description, and parameter count. Click a row to expand its `input_schema` and see each parameter's name, type, required flag, and description.

- **Search**: filters by tool name, description, or connector name
- **Connector filter**: a searchable dropdown for narrowing the list to a single connector
- Results are paginated (20 per page)

This tab is useful for auditing what capabilities Aria has access to and verifying a connector's tool schema after editing it.

### Assigning Agents to Users

1. Go to `/admin/users/{id}` and open the user's agent list
2. Click **Assign Agent** and select an agent and plan
3. The subscription is created immediately

### Managing Subscriptions

From `/admin/subscriptions`, click any subscription to view or edit its status, start date, expiry date, skills, and connectors.

Skills and connectors on a subscription can be added, toggled (enabled/disabled), or removed individually.

### Activity Log

Every admin action — creating agents, toggling admin status, assigning subscriptions — is recorded in the activity log at `/admin/activity`. Each entry captures the action, description, the user affected, the admin who performed it, and any relevant metadata.

### Governance & AI Firewall

Two related but distinct controls live under admin:

**Governance** (`/admin/policy`) — a single org-wide policy record:
- **Policy content** — free text injected directly into Aria's system prompt on every conversation, instructing the model to follow it
- **Blocked keywords** — if a user message or AI reply matches a blocked keyword, the reply is replaced with a guardrail message and the block is logged to the Activity Log (`aria.guardrail.blocked`)
- **Daily token limit** — once a user's token usage for the day reaches this limit, further Aria requests get a fixed "limit reached" reply instead of calling the model (see [Token Usage](#token-usage))
- **Connectors disabled** — a kill switch that makes the system ignore everyone's saved AI connector config org-wide and fall back to the global Anthropic key, without changing any individual user's connector settings

**AI Firewall** (`/admin/firewall`) — pattern-based detection (prompt injection, emails, credit card numbers, API keys) that scans outbound gateway and connector requests. It is **detection/logging only** — it never blocks or modifies a request. Toggle categories globally or override them per connector, and review matches (user, connector, direction, category, a 200-character snippet) in the filterable activity log on the same page.

### Affiliates

The **Affiliates** tab of `/admin/sales` (`/admin/sales?tab=affiliates`) lists every affiliate (name, email, referral code, number of referred signups, pending/paid commission) and a table of recent conversions (affiliate, referred user, type — subscription or token purchase, amount, commission, status).

Use **Mark Paid** to bulk-settle all of a user's pending commissions at once, recording a paid timestamp. There is no partial-payout option — it's all-or-nothing per affiliate.

---

## Contact & Support

| Purpose | Contact |
|---|---|
| Sales & General Enquiries | sales@apispi.com |
| Payments | payment@apispi.com |
| Contact Form | `/contact` |

Business hours: Monday–Friday, 9 AM–6 PM AEST.
