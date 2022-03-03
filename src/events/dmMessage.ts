import { Client, MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { ArgsOf } from "discordx";
import db from "../utils/db.js";

export async function handleDm([message]: ArgsOf<"messageCreate">, client: Client) {
    const activeTicket = await db.ticket.findFirst({
        where: {
            closed: false,
            userId: message.author.id,
        },
        select: {
            channelId: true,
            ticketId: true,
            activePings: {
                select: {
                    pingId: true,
                    id: true,
                    type: true,
                }
            }
        },
    });

    if (activeTicket) {
        const guild = client.guilds.cache.find((guild) => guild.id === global.config.guild_id);
        if (!guild) {
            console.log("Could not find guild", global.config.guild_id);
            return;
        }
        const channel = guild.channels.cache.find((channel) => channel.id === activeTicket.channelId);
        if (!channel || !channel.isText()) {
            console.log("Invalid channel ID in database!", activeTicket.channelId);
            message.reply("An unknown error occurred! Please contact a staff member.");
            return;
        }

        await message.channel.send(
            {
                embeds: [
                    {
                        description: message.content,
                        color: "GOLD",
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                        },
                        timestamp: new Date(),
                    }
                ],
                files: message.attachments.map((attachment) => (attachment)),
            }
        );

        await channel.send(
            {
                embeds: [
                    {
                        description: `${message.content}`,
                        color: "GOLD",
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                        },
                        footer: {
                            text: `${message.author.tag} | ${message.author.id}`,
                            iconURL: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                        },
                        timestamp: new Date(),
                    }
                ],
                files: message.attachments.map((attachment) => (attachment))
            }
        );

        const pingMessage = activeTicket.activePings.reduce((acc, ping) => {
            if (ping.type === "ROLE") {
                return acc + `<@&${ping.id}> `;
            } else if (ping.type === "USER") {
                return acc + `<@${ping.id}> `;
            } else {
                return acc;
            }
        }, "");

        if (pingMessage !== "") {
            await (await channel.send(pingMessage)).delete();
        }

        await db.ticket.update({
            where: {
                ticketId: activeTicket.ticketId,
            },
            data: {
                activePings: {
                    deleteMany: {
                        ticketId: activeTicket.ticketId,
                    }
                }
            }
        });

        await db.logs.create({
            data: {
                type: "MESSAGE",
                ticketId: activeTicket.ticketId,
                userId: message.author.id,
                userTag: message.author.tag,
                message: message.content,
                extra: JSON.stringify({
                    ...(message.attachments.size > 0 && { attachments: message.attachments.map((attachment) => (attachment)) }),
                })
            }
        });
    } else {
        const categories = config.categories;
        const categoryOptions: MessageSelectOptionData[] = categories.map((category) => {
            return {
                label: category.name,
                value: category.id,
                description: category.description
            };
        });
        const menu = new MessageSelectMenu()
            .addOptions(categoryOptions)
            .setCustomId("category-menu");


        message.channel.send({
            content: "Please select a category",
            components: [new MessageActionRow().addComponents(menu)],
        });
    }
}