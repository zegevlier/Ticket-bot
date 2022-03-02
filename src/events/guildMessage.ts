import { Client } from "discord.js";
import { ArgsOf } from "discordx";
import { addPing } from "../utils/addPing.js";
import db from "../utils/db.js";
import { logComment } from "../utils/logComment.js";
import { sha256 } from "../utils/sha256.js";

export async function handleGuild([message]: ArgsOf<"messageCreate">, client: Client) {
    if (message.channel.type !== "GUILD_TEXT") {
        return;
    }

    if (!message.channel.topic?.startsWith("TICKET - DO NOT CHANGE - ")) {
        return;
    }

    if (message.channel.topic.split(" - ").length !== 3) {
        return;
    }

    const ticketInfo = message.channel.topic.split(" - ")[2];

    if (ticketInfo.split("/").length !== 3) {
        return;
    }

    const ticketId = ticketInfo.split("/")[0];
    const ticketUserId = ticketInfo.split("/")[1];
    const checksum = ticketInfo.split("/")[2];

    if (sha256(`${ticketId}/${ticketUserId}/${process.env.CHECKSUM_KEY ?? ""}`) !== checksum) {
        return;
    }

    if (message.content.startsWith(config.silent_prefix)) {
        logComment(message.content.substring(config.silent_prefix.length), ticketId, message.author);
        return;
    }

    let anon = false;
    let messageContent = message.content;
    if (message.content.startsWith(config.anon.prefix)) {
        anon = true;
        messageContent = message.content.substring(config.anon.prefix.length);
    }

    await client.users.send(ticketUserId, {
        embeds: [
            {
                description: messageContent,
                color: "GREEN",
                author: {
                    name: anon ? config.anon.name || "Anonymous" : message.author.tag,
                    icon_url: anon ? config.anon.icon_url : message.author.avatarURL() ?? message.author.defaultAvatarURL,
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

    let user = message.guild?.members.cache.find((member) => member.id === ticketUserId);
    if (!user) {
        console.log("Could not find user in guild.", ticketUserId);
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
        addPing("USER", message.author.id, ticketId);
    }

    await db.logs.create({
        data: {
            type: "MESSAGE",
            ticketId: ticketId,
            userId: message.author.id,
            message: messageContent,
            anonymous: anon,
            extra: JSON.stringify({
                ...(message.attachments.size > 0 && { attachments: message.attachments.map((attachment) => (attachment)) }),
            })
        }
    });
}
