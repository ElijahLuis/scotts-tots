require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyGitHubSignature } = require('./webhook');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const app = express();

// Parse raw body for GitHub signature verification
app.use('/github-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Rate-limit the webhook endpoint: max 60 requests per minute per IP
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
/**
 * Builds a Discord embed for a GitHub push event.
 */
function buildPushEmbed(payload) {
  const { repository, pusher, commits, ref } = payload;
  const branch = ref ? ref.replace('refs/heads/', '') : 'unknown';
  const commitList = (commits || []).slice(0, 5)
    .map(c => `[\`${c.id.slice(0, 7)}\`](${c.url}) ${c.message.split('\n')[0]} — ${c.author.name}`)
    .join('\n');
  return new EmbedBuilder()
    .setColor(0x24292e)
    .setTitle(`[${repository.full_name}] Push to ${branch}`)
    .setURL(repository.html_url)
    .setDescription(commitList || 'No commits')
    .setFooter({ text: `Pushed by ${pusher ? pusher.name : 'unknown'}` })
    .setTimestamp();
}

/**
 * Builds a Discord embed for a GitHub pull request event.
 */
function buildPullRequestEmbed(payload) {
  const { action, pull_request: pr, repository } = payload;
  return new EmbedBuilder()
    .setColor(0x6f42c1)
    .setTitle(`[${repository.full_name}] PR #${pr.number} ${action}: ${pr.title}`)
    .setURL(pr.html_url)
    .setDescription(pr.body ? pr.body.slice(0, 200) : '')
    .addFields(
      { name: 'Author', value: pr.user.login, inline: true },
      { name: 'Branch', value: `${pr.head.ref} → ${pr.base.ref}`, inline: true }
    )
    .setTimestamp();
}

/**
 * Builds a Discord embed for a GitHub issues event.
 */
function buildIssueEmbed(payload) {
  const { action, issue, repository } = payload;
  return new EmbedBuilder()
    .setColor(0xe4e669)
    .setTitle(`[${repository.full_name}] Issue #${issue.number} ${action}: ${issue.title}`)
    .setURL(issue.html_url)
    .setDescription(issue.body ? issue.body.slice(0, 200) : '')
    .addFields({ name: 'Opened by', value: issue.user.login, inline: true })
    .setTimestamp();
}

/**
 * Builds a Discord embed for a GitHub release event.
 */
function buildReleaseEmbed(payload) {
  const { action, release, repository } = payload;
  return new EmbedBuilder()
    .setColor(0x28a745)
    .setTitle(`[${repository.full_name}] Release ${action}: ${release.tag_name}`)
    .setURL(release.html_url)
    .setDescription(release.body ? release.body.slice(0, 200) : '')
    .addFields({ name: 'Author', value: release.author.login, inline: true })
    .setTimestamp();
}

// GitHub webhook endpoint
app.post('/github-webhook', webhookLimiter, async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyGitHubSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) {
    return res.status(500).send('DISCORD_CHANNEL_ID not configured');
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    return res.status(500).send('Channel not found');
  }

  let embed;
  switch (event) {
    case 'push':
      embed = buildPushEmbed(payload);
      break;
    case 'pull_request':
      embed = buildPullRequestEmbed(payload);
      break;
    case 'issues':
      embed = buildIssueEmbed(payload);
      break;
    case 'release':
      embed = buildReleaseEmbed(payload);
      break;
    default:
      return res.status(200).send('Event not handled');
  }

  try {
    await channel.send({ embeds: [embed] });
    res.status(200).send('OK');
  } catch (err) {
    console.error('Failed to send message to Discord:', err);
    res.status(500).send('Failed to send message');
  }
});

// Health check endpoint
app.get('/health', (_req, res) => res.status(200).send('OK'));

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Webhook server listening on port ${port}`));
});

client.login(process.env.DISCORD_BOT_TOKEN);
