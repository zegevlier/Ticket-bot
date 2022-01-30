import { Ticket } from "@prisma/client";
import { Guild, User } from "discord.js";
import db from "./db.js";

export async function onTicketClose(ticket: Ticket, user: User, reason: string, guild: Guild, anon: boolean): Promise<void> {
    let logsChannel = guild.channels.cache.find(channel => channel.id === process.env.LOG_CHANNEL_ID);
    if (logsChannel === undefined || logsChannel.type !== "GUILD_TEXT") {
        console.log("Could not log ticket! Log channel not found");
        return;
    }
    let logs = await db.logs.findMany({
        where: {
            ticketId: ticket.ticketId,
        },
    });
    let logMessage = "";
    for (let log of logs) {
        logMessage += `${log.createdAt.toISOString()} | ${log.userId} | ${log.type}${log.anonymous ? " | anonymous" : ""}${log.message === null ? "" : " | " + log.message}\n`;
    }
    let ticketOwner = guild.members.cache.find((member) => member.id === ticket?.userId);
    if (!ticketOwner) {
        console.log("Could not find user in guild.", ticket.userId);
        return;
    }

    logsChannel.send(
        {
            embeds: [
                {
                    title: "Ticket closed",
                    description: `\`\`\`${logMessage}\`\`\``,
                    author: {
                        name: anon ? `${user.tag} | Anonymous` : `${user.tag}`,
                        icon_url: `${user.avatarURL()}`,
                    },
                    footer: {
                        text: `${ticketOwner.user.tag} | ${ticketOwner.id}`,
                        iconURL: ticketOwner.user.avatarURL() ?? undefined,
                    },
                    timestamp: new Date(),
                    color: "AQUA"
                }
            ]
        }
    );
}