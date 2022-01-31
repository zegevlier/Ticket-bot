import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import { onTicketClose } from "../../utils/ticketClose.js";

export async function closeCommand(args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    const reason = args.join(" ") === "" ? "No reason provided." : args.join(" ");
    if (message.guild === null) { return }; // Can never happen
    await onTicketClose(ticket, message, reason, client, false);
}
