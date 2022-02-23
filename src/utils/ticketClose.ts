import { Ticket } from "@prisma/client";
import { Channel, Client, CommandInteraction, Guild, GuildMember, Message, MessageAttachment, TextBasedChannel, TextChannel, User } from "discord.js";

import { BlobServiceClient } from "@azure/storage-blob";

import db from "./db.js";

import discordTranscripts from 'discord-html-transcripts';

export async function onTicketClose(ticket: Ticket, channel: TextBasedChannel, user: User, guild: Guild, reason: string, client: Client, anon: boolean): Promise<void> {
    await db.ticket.update({
        where: {
            ticketId: ticket.ticketId,
        },
        data: {
            closed: true,
            closedId: user.id,
            closedReason: reason,
        }
    });

    await channel.send("Ticket closed!");

    await db.logs.create({
        data: {
            ticketId: ticket.ticketId,
            userId: user.id,
            message: reason,
            type: "CLOSE",
            anonymous: anon,
        }
    });

    await client.users.send(ticket.userId, {
        embeds: [
            {
                title: "Ticket closed",
                description: reason,
                color: "ORANGE",
                author: {
                    name: anon ? config.anon.name : user.tag,
                    icon_url: anon ? config.anon.icon_url : user.avatarURL() ?? user.defaultAvatarURL,
                },
                timestamp: new Date(),
            }
        ]
    }).catch((error) => {
        console.log("Error sending message to user when trying to close ticket.", error);
    });
    let logsTranscript = await discordTranscripts.createTranscript(channel as TextChannel);

    await channel.delete();

    let logsChannel = guild.channels.cache.find(channel => channel.id === config.log_channel_id);
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
        logMessage += `${log.createdAt.toISOString()} | ${log.userId} | ${log.type}${log.anonymous ? " | anonymous" : ""}${log.message === null ? "" : " | " + log.message}${log.extra === null || log.extra === "{}" ? "" : " | " + log.extra}\n`;
    }
    let ticketOwner = guild.members.cache.find((member) => member.id === ticket?.userId);
    if (!ticketOwner) {
        console.log("Could not find user in guild.", ticket.userId);
        return;
    }

    const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "";
    if (STORAGE_CONNECTION_STRING === "") {
        console.log("Could not upload logs to Azure Blob Storage. No connection string found.");
    } else {
        const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
        const containerName = "$web";
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const textBlobClient = containerClient.getBlockBlobClient(`${ticket.ticketId}.txt`);
        const textBuffer = Buffer.from(`${logMessage}`);
        await textBlobClient.uploadData(textBuffer as Buffer, {
            blobHTTPHeaders: {
                blobContentType: "text/plain; charset=utf-8"
            }
        });

        const htmlBlobClient = containerClient.getBlockBlobClient(`${ticket.ticketId}.html`);
        await htmlBlobClient.uploadData(logsTranscript.attachment as Buffer, {
            blobHTTPHeaders: {
                blobContentType: "text/html; charset=utf-8"
            }
        });
    }

    logsChannel.send(
        {
            embeds: [
                {
                    title: "Ticket closed",
                    description: reason,
                    author: {
                        name: anon ? `${user.tag} | Anonymous` : `${user.tag}`,
                        icon_url: `${user.avatarURL()}`,
                    },
                    footer: {
                        text: `${ticketOwner.user.tag} | ${ticketOwner.id}`,
                        iconURL: ticketOwner.user.avatarURL() ?? undefined,
                    },
                    timestamp: new Date(),
                    color: "RED",
                    fields: [
                        {
                            name: "Pretty logs",
                            value: `[Click here](${config.storage_url_prefix}${ticket.ticketId}.html)`,
                            inline: true,
                        },
                        {
                            name: "Full logs",
                            value: `[Click here](${config.storage_url_prefix}${ticket.ticketId}.txt)`,
                            inline: true,
                        },
                        {
                            name: "Ticket ID",
                            value: `${ticket.ticketId}`,
                            inline: false,
                        }
                    ]
                }
            ],
        }
    );
}