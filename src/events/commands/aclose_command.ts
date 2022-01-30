import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function acloseCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {

    if (!ticket.closable) {
        await message.channel.send(
            {
                embeds: [
                    {
                        title: "This ticket is not closable.",
                        description: `This ticket was marked as unclosable for the following reason: \`\`\`${ticket.closableReason}\`\`\``,
                        color: 16711680,
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

        await message.delete();

        setTimeout(async () => {
            await message.delete().catch(() => { });
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
            closedReason: args.join(" "),
        }
    });

    await message.channel.send("Ticket closed!");

    let userMessage;
    if (args.length > 0) {
        userMessage = `Reason: ${args.join(" ")}`;
    } else {
        userMessage = "No reason provided.";
    }

    await db.logs.create({
        data: {
            ticketId: ticket.ticketId,
            userId: message.author.id,
            message: userMessage,
            type: "CLOSE",
            anonymous: true,
        }
    });

    await client.users.send(ticket.userId, {
        embeds: [
            {
                title: "Ticket closed",
                description: userMessage,
                color: 16719616,
                author: {
                    name: process.env.ANON_NAME,
                    icon_url: process.env.ANON_ICON_URL,
                },
                timestamp: new Date(),
            }
        ]
    }).catch((error) => {
        console.log("Error sending message to user when trying to close ticket.", error);
    });
    await message.channel.delete()
}