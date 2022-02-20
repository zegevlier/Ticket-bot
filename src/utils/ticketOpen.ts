import { Ticket, Catagory } from "@prisma/client";
import { Guild, User } from "discord.js";
import db from "./db.js";
import { isPaid } from "./isPaid.js";

export async function openTicket(guild: Guild, user: User, catagory: Catagory): Promise<Ticket> {
    let channelName = `${user.username.replace(/[^a-zA-Z0-9]/g, "").substring(0, 21) ?? user.id}-${user.discriminator}`;
    const member = await guild.members.fetch(user.id);
    if (await isPaid(member)) {
        channelName += "-paid";
    }
    const channel = await guild.channels.create(
        channelName,
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
                    description: `Type a message here to send it to the user, messages starting with \`${process.env.PREFIX}\` will not be sent to the user and messages starting with \`${process.env.ANON_PREFIX}\` will be sent anonymously.`,
                    color: "DARK_AQUA",
                    fields: [
                        {
                            name: "User",
                            value: `<@${user.id}> (${user.id})`,
                            inline: true
                        },
                        {
                            name: "Roles",
                            value: guild.members.cache.find((member) => member.id === user.id)
                                ?.roles.cache
                                .filter((role) => role.name !== "@everyone")
                                .map((role) => `<@&${role.id}>`)
                                .join(" ") || "None",
                            inline: true
                        }
                    ],
                    footer: {
                        text: `${user.tag} | ${user.id}`,
                        icon_url: user.avatarURL() || user.defaultAvatarURL,
                    },
                    timestamp: new Date(),
                }
            ]
        }
    );
    const pingMessage = catagory.pingingRoles.reduce((acc, ping) => {
        return acc + `<@&${ping}> `;
    }, "");

    if (pingMessage !== "") {
        await (await channel.send(pingMessage)).delete();
    }

    const ticket = await db.ticket.create({
        data: {
            channelId: channel.id,
            userId: user.id,
            catagoryId: catagory.disCatagoryId,
        },
    });

    await db.logs.create({
        data: {
            type: "CREATETICKET",
            ticketId: ticket.ticketId,
            userId: user.id,
        }
    });

    const logsChannel = guild.channels.cache.find(channel => channel.id === process.env.LOG_CHANNEL_ID);
    if (logsChannel === undefined || logsChannel.type !== "GUILD_TEXT") {
        console.log("Could not log ticket! Log channel not found");
        return ticket;
    }

    logsChannel.send(
        {
            embeds: [
                {
                    title: "Ticket opened",
                    author: {
                        name: user.tag,
                        icon_url: user.avatarURL() ?? user.defaultAvatarURL,
                    },
                    footer: {
                        text: `${user.tag} | ${user.id}`,
                        iconURL: user.avatarURL() ?? undefined,
                    },
                    timestamp: new Date(),
                    color: "GREEN"
                }
            ]
        }
    );

    return ticket;
}