import type { ArgsOf } from "discordx";
import { Discord, On, Client } from "discordx";

import db from "../utils/db.js";

// import { PrismaClient } from "@prisma/client";

// const db = new PrismaClient();

@Discord()
export abstract class AppDiscord {
    @On("messageCreate")
    async onMessage([message]: ArgsOf<"messageCreate">, client: Client) {
        if (message.author !== client.user) {
            if (message.inGuild()) {
                this.handleGuild([message], client);
            } else {
                this.handleDm([message], client);
            }
        }
    }

    async handleDm([message]: ArgsOf<"messageCreate">, client: Client) {
        console.log("DM Created", client.user?.username, message.content);
        let guild = client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);
        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
            return;
        }
        let catagory = guild.channels.cache.find((channel) => channel.id === process.env.CATAGORY_ID);
        if (!catagory || catagory.type !== "GUILD_CATEGORY") {
            console.log("Could not find catagory", process.env.CATAGORY_ID);
            return;
        }

    }

    async handleGuild([message]: ArgsOf<"messageCreate">, client: Client) {
        console.log("Message Created", client.user?.username, message.content);
        message.reply("Hello World");
    }
}
