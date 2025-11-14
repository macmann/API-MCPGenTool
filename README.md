# codex-project (Minimal Node.js setup)

This is a **minimal Node.js project** to generate code via the OpenAI API in a **Codex-style workflow**.
> ⚠️ Note: OpenAI's original *Codex* models are retired. This template defaults to a current code-capable model (`gpt-4o-mini`). You can change the model via `OPENAI_MODEL`.

## Folder Structure
```
codex-project/
├─ src/
│  └─ index.js
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## Setup

1) **Install Node 18+**  
2) Copy `.env.example` to `.env` and set your key:
```bash
cp .env.example .env
# edit .env and paste your OpenAI key
```
3) Install dependencies:
```bash
npm install
```
4) Run the script (pass your coding task as an argument or it will use the default):
```bash
npm start -- "Write a function in JavaScript that reverses a string."
```

## Change the Model
In `.env` set:
```
OPENAI_MODEL=gpt-4o-mini
```
You can switch to other current code-capable models you have access to.

## Git: init & push
```bash
git init
git add .
git commit -m "Initial commit: minimal OpenAI code generator"
git branch -M main
git remote add origin https://github.com/<your-username>/codex-project.git
git push -u origin main
```

## Notes
- Do **not** commit `.env`. Your API keys must remain secret.
- The sample uses the **Responses API** to request plain JavaScript code.
- Adjust the `input` instruction in `src/index.js` for different languages or formatting (e.g., Python-only).

## Deploying to Render (Web Service)

This app can run on **Render Free Web Service**. On the free tier:

- The filesystem is **ephemeral** (SQLite data in `mockapis.db` will be lost on redeploy or restart).
- You **cannot attach persistent disks** on free web services.
- For a small personal/mock tool this is usually fine; for persistent data, upgrade to a paid plan later.

### Option A — Deploy via Render Dashboard (Free tier compatible)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Render, click **New → Web Service**, connect your repo.
3. Choose environment: **Node**.
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Under **Environment → Environment Variables**, add:
   - `ADMIN_KEY` = your-secret-admin-key  
   - `NODE_ENV=production`
   - (optional) `DB_FILE=mockapis.db`  # default; kept for clarity
6. Click **Create Web Service** and wait for deploy.

Your URLs will look like:

- Admin UI: `https://<your-service>.onrender.com/admin`
- Admin Login: `https://<your-service>.onrender.com/admin/login`
- Mock API base: `https://<your-service>.onrender.com`

> ℹ️ When the admin key is set, visiting `/admin` without it will redirect to the login screen. Enter the configured key to be redirected back to the dashboard. If you prefer to skip the form you can still append `?key=<ADMIN_KEY>` manually.

> ⚠ On the free tier, any endpoints and variables you create are stored in the local SQLite file. When the service redeploys or restarts, that file can be reset and you will lose data.

### Option B — Deploy Using render.yaml (No disk, free-tier safe)

If you want infrastructure-as-code and your account allows Blueprints, create a file named **render.yaml** at the project root:

```yaml
services:
  - type: web
    name: gui-mock-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: ADMIN_KEY
        generateValue: true
      # Optional: DB_FILE override (still ephemeral on free tier)
      - key: DB_FILE
        value: mockapis.db

# MCP Server (Model Context Protocol)

This project can also run as an **MCP server** that exposes selected mock endpoints as tools to LLM clients (e.g. Claude desktop, OpenAI Apps SDK, custom agents).

## 1. Configure an MCP server in the UI

1. Start the web app as usual:

   ```bash
   npm install
   ADMIN_KEY=my-secret npm run dev
   # open http://localhost:3000/admin?key=my-secret
   ```

2. Go to **MCP Servers** in the admin sidebar (or open `/admin/mcp?key=...`).
3. Click **New MCP Server** and fill in:
   - **Name:** e.g. `Local Mock`
   - **Base URL:** `http://localhost:3000` (or your Render URL)
   - Optional API key header/value if your endpoints require it.
   - Save.
4. Click **Tools** for that MCP server and add tools:
   - Choose an existing endpoint (e.g. `GET /user/:userid`).
   - **Tool name:** `getUserDetails`
   - **Arg schema (JSON):**

     ```json
     {
       "type": "object",
       "properties": {
         "userid": {
           "type": "string",
           "description": "User ID"
         }
       },
       "required": ["userid"]
     }
     ```

## 2. Run the MCP server (stdio)

In a separate terminal:

```bash
MCP_SERVER_ID=<the-id-from-DB> \
MOCK_BASE_URL=http://localhost:3000 \
npm run mcp-server
```

`MCP_SERVER_ID` is the ID of the MCP server row (shown in the MCP Servers list; you can also read it from SQLite).

`MOCK_BASE_URL` is optional; if not set, the MCP server uses the Base URL from the MCP Server config.

The MCP server will:

- Register tools based on your MCP Tools config.
- For each tool call, forward the request to the mapped mock endpoint and return the HTTP response as MCP tool output.

## 3. Using with MCP clients

You can point any MCP-capable client to this server via stdio, for example in a config:

```json
{
  "mcpServers": {
    "mock-api": {
      "command": "node",
      "args": [
        "mcp-server.js"
      ],
      "env": {
        "MCP_SERVER_ID": "<your-mcp-server-id>",
        "MOCK_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

When the client connects, it will discover tools such as `getUserDetails` and can call them with JSON arguments like:

```json
{ "userid": "101" }
```

The MCP server will call your mock API (e.g. `GET /user/101`), and return the result.
