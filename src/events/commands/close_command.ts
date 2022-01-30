import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db";

export async function handleCloseCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
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
    let userMessage = `Ticket closed by ${message.author.username}.`;
    if (args.length > 0) {
        userMessage += ` Reason: ${args.join(" ")}`;
    } else {
        userMessage += ` No reason provided.`;
    }

    await client.users.send(ticket.userId, userMessage).catch((error) => {
        console.log("Error sending message to user when trying to close ticket.", error);
    });
    await message.channel.delete()
}
