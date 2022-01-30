import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import { acloseCommand } from "./commands/aclose_command.js";

import { closeCommand } from "./commands/close_command.js";
import { nopingCommand } from "./commands/noping_command.js";
import { pingCommand } from "./commands/ping_command.js";

export async function handleTicketCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    switch (command) {
        case "close":
            await closeCommand(command, args, message, ticket, client);
            break;
        case "aclose":
            await acloseCommand(command, args, message, ticket, client);
            break;
        case "ping":
            await pingCommand(command, args, message, ticket, client);
            break;
        case "noping":
            await nopingCommand(command, args, message, ticket, client);
            break;
        default:
            break;
    }
}

