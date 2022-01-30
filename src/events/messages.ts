import { SelectMenuInteraction } from "discord.js";
import { Discord, On, Client, SelectMenuComponent } from "discordx";
import type { ArgsOf } from "discordx";

import db from "../utils/db.js";
import { handleDm } from "./dmMessage.js";
import { handleGuild } from "./guildMessage.js";

@Discord()
export abstract class AppDiscord {
    @On("messageCreate")
    async onMessage([message]: ArgsOf<"messageCreate">, client: Client) {
        if (message.author.id !== client.user?.id) {
            if (message.inGuild()) {
                handleGuild([message], client);
            } else {
                handleDm([message], client);
            }
        }
    }

    @SelectMenuComponent("catagory-menu")
    async catagoryMenu(interaction: SelectMenuInteraction) {
        let guild = interaction.client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);

        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
            return;
        }

        let catagory = await db.catagories.findUnique({
            where: {
                catagoryId: interaction.values?.[0],
            },
            select: {
                disCatagoryId: true,
                name: true,
                openMessage: true,
                pingingRoles: true,
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

        let channel = await guild.channels.create(
            `${interaction.user.username.replace(/[^a-zA-Z0-9]/g, "") ?? interaction.user.id}-${interaction.user.discriminator}`,
            {
                type: "GUILD_TEXT",
                parent: catagory.disCatagoryId,
            }
        );

        channel.send(
            {
                embeds: [
                    {
                        title: "New ticket",
                        description: `Type a message here to send it to the user, messages starting with \`${process.env.PREFIX}\` will not be sent to the user.`,
                        color: 5814783,
                        fields: [
                            {
                                name: "User",
                                value: `<@${interaction.user.id}> (${interaction.user.id})`,
                                inline: true
                            },
                            {
                                name: "Roles",
                                value: guild.members.cache.find((member) => member.id === interaction.user.id)
                                    ?.roles.cache
                                    .filter((role) => role.name !== "@everyone")
                                    .map((role) => `<@&${role.id}>`)
                                    .join(" ") || "None",
                                inline: true
                            }
                        ],
                        footer: {
                            text: `${interaction.user.tag} | ${interaction.user.id}`,
                            icon_url: interaction.user.avatarURL() || interaction.user.defaultAvatarURL,
                        },
                        timestamp: new Date(),
                    }
                ]
            }
        );

        for (let role of catagory.pingingRoles) {
            let message = await channel.send(`<@&${role}>`);
            await message.delete();
        }

        let ticket = await db.ticket.create({
            data: {
                channelId: channel.id,
                userId: interaction.user.id,
                catagoryId: catagory.disCatagoryId,
            },
        });

        await interaction.followUp({
            embeds: [
                {
                    title: "Ticket created!",
                    description: catagory.openMessage,
                    color: 5814783,
                    fields: [
                        {
                            name: "NOTE:",
                            value: "**YOUR FIRST MESSAGE WAS NOT SENT, YOU NEED TO SEND IT AGAIN FOR STAFF TO RECEIVE IT!**"
                        }
                    ],
                    footer: {
                        text: `Ticket ID: ${ticket.ticketId}`,
                    }
                }
            ]
        });
    }

}
