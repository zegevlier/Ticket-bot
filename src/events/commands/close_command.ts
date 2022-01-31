import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";
import { onTicketClose } from "../../utils/ticketClose.js";

export async function closeCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {

    let reason;
    if (args.length > 0) {
        reason = `${args.join(" ")}`;
    } else {
        reason = "No reason provided.";
    }
    if (message.guild === null) { return };
    await onTicketClose(ticket, message, reason, client, false);
}
