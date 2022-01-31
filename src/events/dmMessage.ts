import { Client, MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { ArgsOf } from "discordx";
import db from "../utils/db.js";

export async function handleDm([message]: ArgsOf<"messageCreate">, client: Client) {
    console.log("DM Created", client.user?.username, message.content);

    const activeTicket = await db.ticket.findFirst({
        where: {
            closed: false,
            userId: message.author.id,
        },
        select: {
            closable: true,
            userId: true,
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
        const guild = client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);
        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
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
                        description: `${message.content}`,
                        color: "GOLD",
                        author: {
                            name: `${message.author.tag}`,
                            icon_url: `${message.author.avatarURL()}`,
                        },
                        timestamp: new Date(),
                    }
                ]
            }
        );

        await channel.send(
            {
                embeds: [
                    {
                        description: `${message.content}`,
                        color: "GOLD",
                        author: {
                            name: `${message.author.tag}`,
                            icon_url: `${message.author.avatarURL()}`,
                        },
                        footer: {
                            text: `${message.author.tag} | ${message.author.id}`,
                            iconURL: `${message.author.avatarURL()}`,
                        },
                        timestamp: new Date(),
                    }
                ]
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
                message: message.content,
            }
        });
    } else {
        const catagories = await db.catagory.findMany(
            {
                select: {
                    name: true,
                    catagoryId: true,
                    description: true,
                }
            }
        );
        const catagoryOptions: MessageSelectOptionData[] = catagories.map((catagory) => {
            return {
                label: catagory.name,
                value: catagory.catagoryId,
                description: catagory.description
            };
        });
        const menu = new MessageSelectMenu()
            .addOptions(catagoryOptions)
            .setCustomId("catagory-menu");


        message.channel.send({
            content: "Please select a catagory",
            components: [new MessageActionRow().addComponents(menu)],
        });
    }
}