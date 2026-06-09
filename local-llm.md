# Local LLM Connector

The **Local LLM** connector lets you run Aria entirely on your own machine using a locally hosted language model — no API key required, no data leaving your network. It works with Ollama, LM Studio, or any server that exposes an OpenAI-compatible API.

---

## Supported Servers

| Server | Default URL | Notes |
|---|---|---|
| [Ollama](https://ollama.com) | `http://localhost:11434` | Requires CORS enabled (see below) |
| [LM Studio](https://lmstudio.ai) | `http://localhost:1234` | Enable CORS in Server settings |
| Any OpenAI-compatible server | Custom | Must expose `/v1/models` and `/v1/chat/completions` |

---

## Requirements

### Ollama

1. **Install Ollama** from [ollama.com](https://ollama.com)

2. **Pull a model** — the model name you enter in the connector must match exactly:
   ```bash
   ollama pull llama3.1
   ollama pull mistral-nemo
   ollama pull phi3
   ```

3. **Enable CORS** — Ollama blocks cross-origin requests by default. Set this environment variable before starting Ollama:
   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```
   Or set it permanently in your shell profile:
   ```bash
   export OLLAMA_ORIGINS=*
   ```
   On macOS, if Ollama runs as a menu bar app, set the variable in `~/.zshrc` (or `~/.bash_profile`) and restart Ollama.

4. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/v1/models
   ```
   You should see a JSON list of installed models.

### LM Studio

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a model inside the app
3. Start the local server (left sidebar → **Local Server**)
4. In Server settings, enable the **CORS** toggle
5. Note the port shown — default is `1234`

---

## Connecting in ApiSpi

1. Go to **Dashboard → My Connectors**
2. Find **Local LLM** and click **Configure**
3. Enter:
   - **Server URL** — e.g. `http://localhost:11434` for Ollama, `http://localhost:1234` for LM Studio
   - **Model Name** — exact model ID as listed by the server (e.g. `llama3.1`, `mistral-nemo`, `phi3`)
4. Click **Test Connection** — ApiSpi will call `/v1/models` on your server and confirm whether the model is available
5. Save

Once connected, **Local LLM** appears as a model option in the Aria model selector.

---

## How it Works

The Local LLM connector uses a browser-side integration — Aria's tool call loop runs client-side and sends requests directly from your browser to the local server. This means:

- **Your data never leaves your machine** — the LLM runs entirely locally
- **The server URL must be reachable from your browser**, not just the ApiSpi server
- **CORS must be enabled** on the local server, because the request originates from a different origin (`apispi.com` → `localhost`)
- Tool calls from connected connectors (e.g. Microsoft 365, Gmail) are still executed server-side via ApiSpi; only the LLM inference itself is local

### Request format

ApiSpi sends requests to your server in OpenAI-compatible format:

```
POST {base_url}/v1/chat/completions
Content-Type: application/json

{
  "model": "<your-model-name>",
  "messages": [...],
  "tools": [...],       // if connected tools are available
  "max_tokens": 1024
}
```

Tool definitions are converted from Anthropic format to OpenAI function-calling format automatically.

---

## Modes

All five Aria modes (General, Email, Research, Strategy, Technical) work with Local LLM. However:

- **Research mode** normally requests a more capable model (Opus) — when using Local LLM, your configured local model is used regardless of the mode's model preference
- Response quality depends on the capability of the local model you choose

---

## Connection Test

ApiSpi tests the connection by calling `GET {base_url}/v1/models` and checking whether your configured model name appears in the response. Possible outcomes:

| Result | Meaning |
|---|---|
| "Connected — model is available" | Server is running, CORS is enabled, model is loaded |
| "Server reachable but model not found" | Server is up but the model name doesn't match — check spelling and case |
| "Could not reach {url}" | Server is not running, wrong port, or CORS is blocking the request |
| "Server returned HTTP 4xx/5xx" | Server error — check Ollama/LM Studio logs |

---

## Troubleshooting

**Aria falls back to basic mode after connecting**

The browser cannot reach your local server. Confirm:
- Ollama/LM Studio is running
- CORS is enabled (`OLLAMA_ORIGINS=*` for Ollama, CORS toggle in LM Studio)
- The URL in the connector matches the actual server address and port

**Model not found error**

Run `ollama list` (or check LM Studio's model list) and copy the exact model ID — including any tag suffix (e.g. `llama3.1:8b` vs `llama3.1`).

**Slow responses**

Local LLM performance depends on your hardware. Smaller models (3B–8B parameters) run faster on CPU; larger models benefit from a GPU. LM Studio shows GPU/CPU usage in its server panel.

**CORS error in browser console**

Ollama: ensure `OLLAMA_ORIGINS=*` is set in the environment where `ollama serve` runs — not just your terminal session. On macOS menu bar apps, set it in your shell profile and restart.

LM Studio: open the local server panel, scroll to **Server Settings**, and enable the CORS toggle.
