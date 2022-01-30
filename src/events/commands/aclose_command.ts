import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function acloseCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    await message.channel.send("Ticket closed!");
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
