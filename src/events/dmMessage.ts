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
        let guild = client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);
        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
            return;
        }
        let channel = guild.channels.cache.find((channel) => channel.id === activeTicket.channelId);
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
                        color: 65453,
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
                        color: 65453,
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

        let pingMessage = "";

        for (let ping of activeTicket.activePings) {
            if (ping.type === "ROLE") {
                pingMessage += `<@&${ping.id}> `;
            } else if (ping.type === "USER") {
                pingMessage += `<@${ping.id}> `;
            }
        }

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
        let catagoryOptions: MessageSelectOptionData[] = [];
        let catagories = await db.catagories.findMany(
            {
                select: {
                    name: true,
                    catagoryId: true,
                }
            }
        );
        catagories.forEach((catagory) => {
            catagoryOptions.push(
                {
                    label: catagory.name,
                    value: catagory.catagoryId,
                }
            )
        });
        const menu = new MessageSelectMenu()
            .addOptions(catagoryOptions)
            .setCustomId("catagory-menu");

        const buttonRow = new MessageActionRow().addComponents(menu);

        message.reply({
            content: "Please select a catagory",
            components: [buttonRow],
        });
    }
}