import { Ticket } from "@prisma/client";
import { Client, Guild, Message, MessageAttachment, TextChannel, User } from "discord.js";

import { BlobServiceClient } from "@azure/storage-blob";

import db from "./db.js";

import discordTranscripts from 'discord-html-transcripts';

export async function onTicketClose(ticket: Ticket, message: Message<boolean>, reason: string, client: Client, anon: boolean): Promise<void> {

    if (message.guild === null) { return };

    if (!ticket.closable) {
        let failMessage = await message.channel.send(
            {
                embeds: [
                    {
                        title: "This ticket is not closable.",
                        description: `This ticket was marked as unclosable for the following reason: \`\`\`${ticket.closableReason}\`\`\``,
                        color: "RED",
                        footer: {
                            text: "This message will be deleted in 10 seconds.",
                        },
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                        }
                    },
                ]
            }
        );
        await message.delete()

        setTimeout(async () => {
            await failMessage.delete().catch(() => { });
        }, 10000);

        return;
    }

    await db.ticket.update({
        where: {
            ticketId: ticket.ticketId,
        },
        data: {
            closed: true,
            closedId: message.author.id,
            closedReason: reason,
        }
    });
    await message.channel.send("Ticket closed!");


    await db.logs.create({
        data: {
            ticketId: ticket.ticketId,
            userId: message.author.id,
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
                    name: anon ? process.env.ANON_NAME : message.author.tag,
                    icon_url: anon ? process.env.ANON_ICON_URL : message.author.avatarURL() ?? message.author.defaultAvatarURL,
                },
                timestamp: new Date(),
            }
        ]
    }).catch((error) => {
        console.log("Error sending message to user when trying to close ticket.", error);
    });

    if (!message.channel.isText()) {
        return;
    };

    let logsTranscript = await discordTranscripts.createTranscript(message.channel as TextChannel);

    await message.channel.delete();

    let logsChannel = message.guild.channels.cache.find(channel => channel.id === process.env.LOG_CHANNEL_ID);
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
    let ticketOwner = message.guild.members.cache.find((member) => member.id === ticket?.userId);
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
                    description: `There were ${logs.length} logs for this ticket.`,
                    author: {
                        name: anon ? `${message.author.tag} | Anonymous` : `${message.author.tag}`,
                        icon_url: `${message.author.avatarURL()}`,
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
                            value: `[Click here](${process.env.STORAGE_URL_PREFIX}${ticket.ticketId}.html)`,
                            inline: true,
                        },
                        {
                            name: "Full logs",
                            value: `[Click here](${process.env.STORAGE_URL_PREFIX}${ticket.ticketId}.txt)`,
                            inline: true,
                        },
                        {
                            name: "Ticket ID",
                            value: `${ticket.ticketId}`,
                            inline: true,
                        }
                    ]
                }
            ],
        }
    );
}