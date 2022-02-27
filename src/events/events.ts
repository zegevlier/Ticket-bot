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
        if (message.author.bot) {
            return;
        }
        if (message.author.id !== client.user?.id) {
            if (message.inGuild()) {
                await handleGuild([message], client);
            } else {
                await handleDm([message], client);
            }
        }
    }

    @SelectMenuComponent("category-menu")
    async categoryMenu(interaction: SelectMenuInteraction) {
        const category = config.categories.find((category) => category.id === interaction.values?.[0]);

        if (!category) {
            console.log("Could not find category", interaction.values?.[0]);
            return;
        }

        await interaction.update({
            content: `Creating ticket in ${category.name}. Please wait...`,
            components: [],
        });

        const guild = interaction.client.guilds.cache.find((guild) => guild.id === global.config.guild_id);

        if (!guild) {
            console.log("Could not find guild", global.config.guild_id);
            return;
        }

        const openTickets = await db.ticket.findMany({
            where: {
                closed: false,
                userId: interaction.user.id,
            }
        });

        if (openTickets.length > 0) {
            await interaction.followUp({
                embeds: [
                    {
                        title: "You already have an open ticket!",
                        description: "Please close it before creating a new one.",
                        color: "RED",
                    }
                ]
            });
            return;
        }

        const user = await db.user.findUnique({
            where: {
                id: interaction.user.id,
            }
        });

        if (user) {
            if (user.blacklisted) {
                await interaction.followUp({
                    embeds: [
                        {
                            title: "You are blacklisted!",
                            description: "Please contact a staff member if you think this is wrong. Blacklist reason: ```" + user.blacklistReason + "```",
                            color: "RED",
                        }
                    ]
                });
                return;
            }
        }

        const ticket: Ticket = await openTicket(guild, interaction.user, category);

        await interaction.followUp({
            embeds: [
                {
                    title: "Ticket created!",
                    description: category.openMessage,
                    color: "DARK_AQUA",
                    fields: [
                        // Only add note if `config.general_note` is set
                        ...(config.general_note ?
                            [{
                                name: "NOTE:",
                                value: config.general_note,
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
