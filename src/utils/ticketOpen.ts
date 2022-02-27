import { Ticket } from "@prisma/client";
import { Guild, User } from "discord.js";
import { category } from "../global.js";
import db from "./db.js";
import { isPaid } from "./hasRoles.js";

export async function openTicket(guild: Guild, user: User, category: category): Promise<Ticket> {
    let channelName = `${user.username.replace(/[^a-zA-Z0-9]/g, "").substring(0, 21) ?? user.id}-${user.discriminator}`;
    const member = await guild.members.fetch(user.id);
    const isPaidUser = await isPaid(member);
    if (isPaidUser) {
        channelName += "-paid";
    }
    const channel = await guild.channels.create(
        channelName,
        {
            type: "GUILD_TEXT",
            parent: category.disCategoryId,
        }
    );

    const oldTickets = await db.ticket.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        where: {
            userId: user.id,
        },
        select: {
            ticketId: true,
            updatedAt: true,
        }
    });

    const oldTicketsMessage = oldTickets.map(ticket => {
        return `[<t:${Math.round(ticket.updatedAt.getTime() / 1000)}:D>](${config.storage_url_prefix}${ticket.ticketId}.html)\n`;
    }).reduce((acc, cur) => acc + cur, "");

    channel.send(
        {
            embeds: [
                {
                    title: "New ticket",
                    description: `Type a message here to send it to the user, messages starting with \`${config.silent_prefix}\` will not be sent to the user and messages starting with \`${config.anon.prefix}\` will be sent anonymously.`,
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
                        },
                        {
                            name: "Paid",
                            value: isPaidUser ? "Yes" : "No",
                            inline: true
                        },
                        oldTicketsMessage ? {
                            name: "Old tickets",
                            value: oldTicketsMessage,
                        } : {
                            name: "Old tickets",
                            value: "None",
                        },
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

    const pingMessage = category.pingingRoles.reduce((acc, ping) => {
        return acc + `<@&${ping}> `;
    }, "");

    if (pingMessage !== "") {
        await (await channel.send(pingMessage)).delete();
    }

    const ticket = await db.ticket.create({
        data: {
            channelId: channel.id,
            userId: user.id,
            categoryId: category.disCategoryId,
        },
    });

    await db.logs.create({
        data: {
            type: "CREATETICKET",
            ticketId: ticket.ticketId,
            userId: user.id,
        }
    });

    const logsChannel = guild.channels.cache.find(channel => channel.id === config.log_channel_id);
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