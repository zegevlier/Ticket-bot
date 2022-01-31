import { SelectMenuInteraction } from "discord.js";
import { Discord, On, Client, SelectMenuComponent } from "discordx";
import type { ArgsOf } from "discordx";

import db from "../utils/db.js";
import { handleDm } from "./dmMessage.js";
import { handleGuild } from "./guildMessage.js";
import { openTicket } from "../utils/ticketOpen.js";
import { Ticket } from "@prisma/client";

@Discord()
export abstract class AppDiscord {
    @On("messageCreate")
    async onMessage([message]: ArgsOf<"messageCreate">, client: Client) {
        if (message.author.id !== client.user?.id) {
            if (message.inGuild()) {
                await handleGuild([message], client);
            } else {
                await handleDm([message], client);
            }
        }
    }

    @SelectMenuComponent("catagory-menu")
    async catagoryMenu(interaction: SelectMenuInteraction) {
        const catagory = await db.catagory.findUnique({
            where: {
                catagoryId: interaction.values?.[0],
            }
        });

        if (!catagory) {
            console.log("Could not find catagory", interaction.values?.[0]);
            return;
        }

        await interaction.update({
            content: `Creating ticket in ${catagory.name}. Please wait...`,
            components: [],
        });

        const guild = interaction.client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);

        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
            return;
        }

        const ticket: Ticket = await openTicket(guild, interaction.user, catagory);

        await interaction.followUp({
            embeds: [
                {
                    title: "Ticket created!",
                    description: catagory.openMessage,
                    color: "DARK_AQUA",
                    fields: [
                        // Only add note if `process.env.NOTE` is set
                        ...(process.env.NOTE ?
                            [{
                                name: "NOTE:",
                                value: process.env.NOTE,
                            }] : []),
                    ],
                    footer: {
                        text: `Ticket ID: ${ticket.ticketId}`,
                    }
                }
            ]
        });
    }

}
