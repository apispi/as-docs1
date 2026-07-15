# Connector Catalogue

A full reference of every connector defined in the `connectors` table, how each one authenticates, and which tools it exposes to Aria's tool-use loop. For the conceptual model (data model, OAuth vs API-key, management routes), see [usage.md](usage.md#connectors) and [docs/connectors.html](docs/connectors.html).

Connectors are seeded by `database/seeders/ConnectorSeeder.php` (47 connectors, auto-run) plus ~43 standalone seeder classes (e.g. `php artisan db:seed --class=XeroConnectorSeeder`) that add full `tool_definitions` for specific integrations — some of these override a stub already present in `ConnectorSeeder.php` (matched by `slug` via `updateOrCreate`).

---

## Auth Types

| Type | How it works |
|---|---|
| **OAuth** | `is_oauth: true`. User completes an OAuth flow (`/connectors/{slug}/authorize` → `/connectors/{slug}/callback`); tokens stored in `user_connector_tokens`, refreshed automatically. |
| **API key** | User supplies a key (and sometimes other fields) via `config_schema`; stored in `user_connectors.config`. Upstream auth header/prefix/field default to `Authorization` / `Bearer ` / `api_key` unless overridden in the connector's `environment` JSON. |
| **None required** | Public APIs (BOM, Data.gov.au, USASpending.gov) — no credentials needed at all. |
| **Bring-your-own-backend** | No `base_url` configured; the gateway falls back to a user-supplied `endpoint_url` (`aria`, `custom-chat-api`, `local-llm`). |

---

## Full Connector List

| Slug | Name | Category | Auth | Description |
|---|---|---|---|---|
| `slack` | Slack | Communication | API key (stub) | Send messages, post to channels, manage notifications |
| `microsoft-teams` | Microsoft Teams | Communication | OAuth (Azure AD/Graph) | List teams/channels, read & post channel messages |
| `gmail` | Gmail | Communication | OAuth (Google) | Read, search, send email |
| `outlook` | Outlook | Communication | OAuth (Microsoft) | Manage email & calendar |
| `microsoft` | Microsoft (generic) | Productivity | OAuth (Azure AD) | Consolidated mail/calendar/file tools, legacy alternative to `outlook` |
| `salesforce` | Salesforce | CRM | OAuth (login URL + consumer key/secret) | Query/manage leads, contacts, accounts, opportunities, cases via SOQL/SOSL/REST |
| `hubspot` | HubSpot | CRM | API key (stub) | Manage contacts, deals, campaigns |
| `zoho-crm` | Zoho CRM | CRM | API key (stub) | Sync leads/contacts/pipeline |
| `pega` | Pega | CRM | API key/basic | Create/query/progress cases & assignments via Case Management (DX) API |
| `google-calendar` | Google Calendar | Productivity | API key (stub) | Create/read/update events |
| `notion` | Notion | Productivity | API key (stub) | Read/write pages, databases, blocks |
| `google-drive` | Google Drive | Productivity | API key (stub) | Upload/download/manage files |
| `onedrive` | OneDrive | Storage | OAuth | List/search/read/upload/move/delete files, sharing links |
| `sharepoint` | SharePoint | Productivity | OAuth (Azure AD) | Search/read/manage sites, document libraries, lists |
| `copilot` | Microsoft 365 Copilot | Productivity | OAuth (Azure AD/Graph) | Semantic search over SharePoint/OneDrive via Copilot retrieval API |
| `jira` | Jira | Productivity | API key (stub) | Create/update issues, sprints, boards |
| `google-sheets` | Google Sheets | Data | API key (stub) | Read/write spreadsheets |
| `airtable` | Airtable | Data | API key (stub) | Query/update bases & tables |
| `snowflake` | Snowflake | Data | API key (stub) | Run queries against warehouses |
| `powerbi` | Power BI | Data | OAuth | Workspaces, reports, datasets, DAX queries, refresh |
| `github` | GitHub | Development | API key (stub) | Manage repos, issues, PRs, actions |
| `gitlab` | GitLab | Development | API key (stub) | Projects, merge requests, CI/CD |
| `jenkins` | Jenkins | Development | API key (stub) | Trigger builds, query job status |
| `twilio` | Twilio | Communications | API key (account SID + auth token) | Send SMS/WhatsApp, lookup numbers, message/call history |
| `shopify` | Shopify | E-commerce | API key (stub) | Manage products/orders/customers |
| `woolworths` | Woolworths | E-commerce | (custom) | Search products, manage trolley, track orders |
| `amazon-product-search` | Amazon Product Search | E-commerce | API key (PA-API) | Search products, compare prices, view bestsellers, find deals via the Amazon Product Advertising API |
| `stripe` | Stripe | Finance | API key | Retrieve payments/subscriptions/customers |
| `quickbooks` | QuickBooks | Finance | API key (stub) | Sync invoices/expenses |
| `xero` | Xero | Finance | OAuth | Contacts, invoices, org details, create draft invoices |
| `workday` | Workday | HR | API key/basic (hostname + tenant_id) | Workers, orgs, positions, time-off via Workday REST API |
| `sap-successfactors` | SAP SuccessFactors | HR | API key | Employees, positions, departments, requisitions via OData |
| `sap-s4hana` | SAP S/4HANA | ERP | API key | Business partners, sales/purchase orders, materials, GL accounts via OData |
| `servicenow` | ServiceNow | ITSM | API key | Incidents, change requests, CMDB, knowledge base via Table API |
| `microsoft-defender` | Microsoft Defender | Security | OAuth (Azure AD/Graph Security API) | Query alerts/incidents from Defender/Sentinel |
| `virustotal` | VirusTotal | Security | API key | IP/URL/hash lookups against threat intel database |
| `abuseipdb` | AbuseIPDB | Security | API key | Check IP abuse confidence scores |
| `sam-gov` | SAM.gov | Government | API key (stub) | Search federal contracts/awards/entity registrations |
| `usaspending` | USASpending.gov | Government | None required | Query federal spending/contracts/grants |
| `datagovau` | Data.gov.au | Government | None required | Search the Australian Government open-data portal |
| `bom` | BOM Weather | Weather | None required | Australian Bureau of Meteorology observations & forecasts |
| `open-meteo` | Open-Meteo | Weather | None required | Free global current conditions & multi-day forecasts for any location |
| `accuweather` | AccuWeather | Weather | API key (free dev key) | Global current conditions & multi-day forecasts for any city |
| `world-time` | World Time API | Utilities | None required | Accurate current time for any timezone/city, DST-aware |
| `whatsapp` | WhatsApp | Messaging | API key (Twilio credentials) | Send/receive WhatsApp messages via Twilio, history, templated messages |
| `generic-website` | Generic Website | Information | None required | Fetch any webpage by URL; keyword search within a site |
| `neo4j` | Neo4j | Database | Basic/API key | Cypher queries and schema inspection over Neo4j graph data |
| `ground-news` | Ground News | News & Media | API key (official) | Multi-perspective news with political-bias & factuality ratings |
| `substack` | Substack | Content | Optional email/password (unofficial API) | Read/search/draft/publish Substack posts |
| `facebook` | Facebook | Content | OAuth (Facebook Graph) | View/manage Pages, publish posts |
| `linkedin` | LinkedIn | Content | OAuth | View profile, share posts |
| `youtube` | YouTube | Content | OAuth (Google) | Search videos, channel/video stats, playlists |
| `aws` | Amazon Web Services | Cloud | API key (IAM access key) | Read-only: month-to-date costs, EC2 instances, S3 buckets, account identity, CloudWatch alarms |
| `abc-australia` | ABC News (Australia) | News & Media | None required | Latest ABC News (Australia) headlines & summaries by section, live from public RSS feeds |
| `channel-news-asia` | Channel News Asia | News & Media | None required | Latest CNA headlines & summaries by section (best for Singapore/Asia news), live from RSS feeds |
| `japan-times` | The Japan Times | News & Media | None required | Latest Japan Times headlines & summaries, live from the public RSS feed |
| `jerusalem-post` | The Jerusalem Post | News & Media | None required | Latest JPost headlines & summaries by section, live from public RSS feeds |
| `new-york-times` | The New York Times | News & Media | None required | Latest NYT headlines & summaries by section, live from public RSS feeds |
| `washington-post` | The Washington Post | News & Media | None required | Latest Washington Post headlines & summaries by section, live from public RSS feeds |
| `xinhua` | Xinhua News | News & Media | None required | Latest Xinhua (English) headlines by section (best for China-perspective news), live from english.news.cn |
| `scx` | SCX AI | AI provider | API key | Powers Aria with SCX models + vector store search |
| `argyll` | Argyll Data | AI provider | API key | Powers Aria with Argyll models + vector store search |
| `mistral` | Mistral AI | AI provider | API key | Powers Aria with Mistral Large/Small |
| `openai` | OpenAI | AI provider | API key | GPT-4o/o1 family; also exposes chat/vision/embeddings/transcription tools |
| `deepseek` | DeepSeek | AI provider (China) | API key | DeepSeek-V3 chat and DeepSeek-R1 reasoner |
| `groq` | Groq | AI provider | API key | LPU-accelerated inference (Llama, Kimi, and more) |
| `grok` | Grok (xAI) | AI provider | API key | Powers Aria with Grok models |
| `zai` | Z.ai (GLM) | AI provider (China) | API key | Zhipu GLM models |
| `qwen` | Qwen (Alibaba Cloud) | AI provider (China) | API key | Qwen models via Alibaba Cloud DashScope |
| `moonshot` | Moonshot AI (Kimi) | AI provider (China) | API key | Kimi models, incl. Kimi K2 |
| `aws-bedrock` | AWS Bedrock | AI provider | API key (Bedrock) | Bedrock-hosted models in your own AWS account & region (Sydney data residency) |
| `gemini` | Google Gemini | AI provider | API key | Powers Aria with Gemini Flash/Pro |
| `anthropic` | Anthropic | AI provider | API key | Bring-your-own Anthropic API key for Aria |
| `local-llm` | Local LLM | AI provider | None (base_url + model) | Connects Aria to a local Ollama/LM Studio/OpenAI-compatible server |
| `custom-chat-api` | Custom Chat API | AI provider | Optional bearer | Bring your own chat API for the dashboard assistant |
| `aria` | Aria | AI provider / gateway | Optional (`auth_optional: true`) | Branded gateway URL forwarding `/api/gateway/aria/{path}` to your own backend |

> **76 connector slugs** are defined across the seeders. Model-provider connectors carry a `country` field (DeepSeek, Qwen, Z.ai, Moonshot are labelled China) so governance sovereignty rules can allow/block them, and production seeding gives model providers no `tool_definitions`. The connectors with "(stub)" next to their auth type have a `config_schema` but no `tool_definitions` yet — they appear in the catalogue but expose no callable tools until implemented.

---

## Tools Exposed Per Connector

Only connectors with non-empty `tool_definitions` expose callable tools to Aria's tool-use loop. AI-provider connectors (Anthropic, Gemini, Mistral, SCX, Argyll, Local LLM, Custom Chat API, Aria) configure *which model answers*, not callable tools, so they have none.

| Connector | Tools |
|---|---|
| Amazon Web Services | `aws_get_costs`, `aws_list_ec2_instances`, `aws_list_s3_buckets`, `aws_whoami`, `aws_list_cloudwatch_alarms` |
| Amazon Product Search | `amazon_search_products`, `amazon_get_product`, `amazon_get_deals`, `amazon_get_bestsellers` |
| ABC News (Australia) | `abc_latest_news`, `abc_search_news` |
| Channel News Asia | `cna_latest_news`, `cna_search_news` |
| The Japan Times | `japantimes_latest_news`, `japantimes_search_news` |
| The Jerusalem Post | `jpost_latest_news`, `jpost_search_news` |
| The New York Times | `nyt_latest_news`, `nyt_search_news` |
| The Washington Post | `washingtonpost_latest_news`, `washingtonpost_search_news` |
| Xinhua News | `xinhua_latest_news`, `xinhua_search_news` |
| Gmail | `gmail_list_messages`, `gmail_search_messages`, `gmail_read_message`, `gmail_send_email`, `gmail_create_draft` |
| WhatsApp | `whatsapp_send_message`, `whatsapp_list_messages`, `whatsapp_send_template` |
| Generic Website | `generic_website_get_page`, `generic_website_search` |
| World Time API | `worldtime_get_time`, `worldtime_list_timezones` |
| Open-Meteo | `open_meteo_current_weather`, `open_meteo_forecast` |
| AccuWeather | `accuweather_current_conditions`, `accuweather_forecast` |
| Neo4j | `neo4j_query`, `neo4j_schema` |
| Ground News | `ground_news_search`, `ground_news_top`, `ground_news_blindspot` |
| OpenAI | `openai_chat`, `openai_vision`, `openai_embeddings`, `openai_audio_transcribe` |
| Substack | `substack_get_posts`, `substack_search_posts`, `substack_create_draft`, `substack_publish_draft`, `substack_list_drafts` |
| BOM Weather | `bom_get_observations`, `bom_get_forecast` |
| SCX AI | `scx_vector_search` |
| Argyll Data | `argyll_vector_search` |
| Microsoft 365 Copilot | `copilot_retrieve_content` |
| Data.gov.au | `datagovau_search_datasets`, `datagovau_get_dataset`, `datagovau_query_resource` |
| Facebook | `facebook_get_pages`, `facebook_create_post` |
| LinkedIn | `linkedin_get_profile`, `linkedin_create_post` |
| Microsoft Defender | `defender_list_alerts`, `defender_get_alert` |
| Microsoft Teams | `teams_list_teams`, `teams_list_channels`, `teams_list_messages`, `teams_send_message` |
| OneDrive | `onedrive_list_files`, `onedrive_search`, `onedrive_get_metadata`, `onedrive_read_file`, `onedrive_upload`, `onedrive_create_folder`, `onedrive_move`, `onedrive_create_sharing_link`, `onedrive_delete` |
| Pega | `pega_list_case_types`, `pega_create_case`, `pega_get_case`, `pega_search_cases`, `pega_get_case_assignments`, `pega_perform_flow_action` |
| Power BI | `powerbi_list_workspaces`, `powerbi_list_reports`, `powerbi_list_datasets`, `powerbi_get_report`, `powerbi_run_dax_query`, `powerbi_refresh_dataset`, `powerbi_get_refresh_history` |
| Salesforce | `salesforce_query`, `salesforce_get_record`, `salesforce_create_record`, `salesforce_update_record`, `salesforce_search` |
| SAP S/4HANA | `sap_s4hana_list_business_partners`, `sap_s4hana_list_sales_orders`, `sap_s4hana_list_purchase_orders`, `sap_s4hana_get_material`, `sap_s4hana_list_gl_accounts` |
| SAP SuccessFactors | `sap_successfactors_list_employees`, `sap_successfactors_get_employee`, `sap_successfactors_list_positions`, `sap_successfactors_list_departments`, `sap_successfactors_list_job_requisitions` |
| ServiceNow | `servicenow_list_incidents`, `servicenow_get_record`, `servicenow_create_incident`, `servicenow_list_change_requests`, `servicenow_list_cmdb_cis`, `servicenow_search_kb` |
| SharePoint | `sharepoint_list_sites`, `sharepoint_search_sites`, `sharepoint_list_document_libraries`, `sharepoint_list_files`, `sharepoint_search_documents`, `sharepoint_get_file_metadata`, `sharepoint_read_file`, `sharepoint_list_items` |
| Stripe | `stripe_list_charges`, `stripe_list_customers`, `stripe_list_subscriptions`, `stripe_get_balance` |
| Twilio | `twilio_send_sms`, `twilio_list_messages`, `twilio_get_message`, `twilio_list_calls`, `twilio_list_phone_numbers` |
| USASpending.gov | `usaspending_search_awards`, `usaspending_top_recipients`, `usaspending_agency_spending_breakdown` |
| VirusTotal | `virustotal_lookup_ip`, `virustotal_lookup_url`, `virustotal_lookup_hash` |
| Woolworths | `woolworths_search_products`, `woolworths_get_product`, `woolworths_get_trolley`, `woolworths_add_to_trolley`, `woolworths_remove_from_trolley`, `woolworths_list_orders`, `woolworths_find_stores` |
| Workday | `workday_list_workers`, `workday_get_worker`, `workday_list_organisations`, `workday_list_positions`, `workday_list_time_off` |
| Xero | `xero_list_contacts`, `xero_get_contact`, `xero_list_invoices`, `xero_create_invoice`, `xero_get_organisation` |
| YouTube | `youtube_search_videos`, `youtube_get_video_details`, `youtube_get_my_channel`, `youtube_list_channel_videos`, `youtube_list_my_playlists`, `youtube_get_playlist_items` |
| AbuseIPDB | `abuseipdb_check_ip` |
| Microsoft (generic) | mail list/search, calendar list, file browse, file search |

All other connectors listed in the [Full Connector List](#full-connector-list) above (Slack, HubSpot, Zoho CRM, Google Calendar, Notion, Google Drive, Jira, Google Sheets, Airtable, Snowflake, GitHub, GitLab, Jenkins, Shopify, QuickBooks, SAM.gov, Outlook) are catalogue stubs — connectable, but without `tool_definitions` yet, so Aria cannot call any tool against them.

---

## Per-User Connection & Tool Overrides

- `user_connectors` (model `UserConnector`) holds per-user config/credentials (encrypted) and a `status` (`active`/`inactive`)
- `user_connector_tokens` (model `ConnectorToken`) holds OAuth access/refresh tokens for OAuth connectors
- A `disabled_tools` column on `user_connectors` lets a user turn off individual tool names from a connector's `tool_definitions` without disconnecting the whole connector

See [API Gateway](api.md) for how these tools are invoked programmatically (`GET /api/gateway/tools`, `POST /api/gateway/invoke`) and how upstream credentials are resolved per connector type.
