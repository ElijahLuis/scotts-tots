# scotts-tots

A Discord bot that links a GitHub repository to your Discord server, posting real-time notifications for pushes, pull requests, issues, and releases into a Discord channel.

## Features

- **Push notifications** — shows the branch, commit messages, and authors
- **Pull request events** — opened, closed, merged, etc.
- **Issue events** — opened, closed, labeled, etc.
- **Release events** — published, pre-released, etc.
- **Secure webhooks** — verifies GitHub's HMAC-SHA256 signature before processing

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Discord bot token](https://discord.com/developers/applications)
- A publicly reachable URL for the webhook endpoint (e.g. a VPS, Railway, Render, or an ngrok tunnel for local testing)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_CHANNEL_ID` | ✅ | ID of the channel to post GitHub events |
| `GITHUB_WEBHOOK_SECRET` | Recommended | Secret used to verify GitHub payloads |
| `PORT` | Optional | HTTP port for the webhook server (default: `3000`) |

#### How to get your Discord Channel ID

1. Open Discord Settings → **Advanced** → enable **Developer Mode**
2. Right-click the target channel → **Copy Channel ID**

### 3. Invite the bot to your server

In the [Discord Developer Portal](https://discord.com/developers/applications):

1. Open your application → **OAuth2 → URL Generator**
2. Select scopes: `bot`
3. Select bot permissions: `Send Messages`, `Embed Links`, `View Channels`
4. Copy the generated URL, open it in your browser, and invite the bot

### 4. Start the bot

```bash
npm start
```

### 5. Add the GitHub webhook

1. Go to your GitHub repository → **Settings → Webhooks → Add webhook**
2. Set **Payload URL** to `https://<your-domain>/github-webhook`
3. Set **Content type** to `application/json`
4. Set **Secret** to the same value as `GITHUB_WEBHOOK_SECRET` in your `.env`
5. Choose the events to send (or select **Send me everything**)
6. Click **Add webhook**

GitHub will send a ping event to confirm the connection.

## Running tests

```bash
npm test
```

