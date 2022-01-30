import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";

import { handleCloseCommand } from "./commands/close_command.js";

export async function handleTicketCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    switch (command) {
        case "close":
            await handleCloseCommand(command, args, message, ticket, client);
            break;
        // Ignore if none apply.
    }
}

