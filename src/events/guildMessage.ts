import { Client } from "discord.js";
import { ArgsOf } from "discordx";
import { addPing } from "../utils/addPing.js";
import db from "../utils/db.js";
import { logComment } from "../utils/logComment.js";

export async function handleGuild([message]: ArgsOf<"messageCreate">, client: Client) {
    const ticket = await db.ticket.findFirst({
        where: {
            channelId: message.channel.id,
            closed: false,
        }
    });

    if (!ticket) {
        return;
    }

    if (message.content.startsWith(process.env.PREFIX || "=")) {
        logComment(message.content.substring(1), ticket, message.author);
        return;
    }

    let anon = false;
    let messageContent = message.content;
    if (message.content.startsWith(process.env.ANON_PREFIX || "!")) {
        anon = true;
        messageContent = message.content.substring(process.env.ANON_PREFIX?.length || 1);
    }

    await client.users.send(ticket.userId, {
        embeds: [
            {
                description: messageContent,
                color: "GREEN",
                author: {
                    name: anon ? process.env.ANON_NAME || "Anonymous" : message.author.tag,
                    icon_url: anon ? process.env.ANON_ICON_URL : message.author.avatarURL() ?? message.author.defaultAvatarURL,
                },
                timestamp: new Date(),
            },
        ],
        files: message.attachments.map((attachment) => (attachment))
    }).catch((error) => {
        if (error.code === 50007) {
            message.channel.send("Could not send message to user, they may have left the server or disabled DMs.");
        } else {
            console.log("Error sending message to user.", error);
        }
        return;
    });

    let user = message.guild?.members.cache.find((member) => member.id === ticket?.userId);
    if (!user) {
        console.log("Could not find user in guild.", ticket.userId);
        return;
    }
    await message.channel.send({
        embeds: [
            {
                description: messageContent,
                color: "GREEN",
                author: {
                    name: anon ? `${message.author.tag} | Anonymous` : `${message.author.tag}`,
                    icon_url: `${message.author.avatarURL()}`,
                },
                footer: {
                    text: `${user.user.tag} | ${user.id}`,
                    iconURL: user.user.avatarURL() ?? undefined,
                },
                timestamp: new Date(),
            }
        ],
        files: message.attachments.map((attachment) => (attachment))
    });

    await message.delete();

    const staffuser = await db.user.findUnique({
        where: {
            id: message.author.id,
        }
    });

    if ((staffuser && staffuser.pingPreference) || !staffuser) {
        addPing("USER", message.author.id, ticket.ticketId);
    }

    await db.logs.create({
        data: {
            type: "MESSAGE",
            ticketId: ticket.ticketId,
            userId: message.author.id,
            message: messageContent,
            anonymous: anon,
            extra: JSON.stringify({
                ...(message.attachments.size > 0 && { attachments: message.attachments.map((attachment) => (attachment)) }),
            })
        }
    });
}