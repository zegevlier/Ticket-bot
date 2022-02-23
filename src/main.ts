import { Intents, Interaction } from "discord.js";
import { Client } from "discordx";
import { dirname, importx } from "@discordx/importer";
import * as Sentry from '@sentry/node';
import configYaml from "config-yaml";

import 'dotenv/config';

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
  ],
  partials: [
    "CHANNEL"
  ],
  // If you only want to use global commands only, comment this line
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
});

client.once("ready", async () => {
  console.log("Initializing...");
  // make sure all guilds are in cache
  await client.guilds.fetch();

  // init all application commands
  await client.initApplicationCommands({
    guild: {
      log: true
    },
    global: {
      log: true,
    },
  });

  // init permissions; enabled log to see changes
  await client.initApplicationPermissions(true);

  console.log("Bot started");
});

client.on("interactionCreate", (interaction: Interaction) => {
  client.executeInteraction(interaction);
});

async function run() {
  global.config = configYaml(`./config.yaml`);
  await importx(
    dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}"
  );

  // let's start the bot
  if (!process.env.BOT_TOKEN) {
    throw Error("Could not find BOT_TOKEN in your environment");
  }
  await client.login(process.env.BOT_TOKEN); // provide your bot token
}

Sentry.init({
  dsn: process.env.SENTRY_DNS || "",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "errors",
  name: "Error transaction",
});


Sentry.configureScope(scope => {
  scope.setSpan(transaction);
});

async function senrun() {
  await run();
}

setTimeout(() => {
  try {
    senrun();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);

