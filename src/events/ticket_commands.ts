import { Ticket } from "@prisma/client";
import { Client, Message, User } from "discord.js";
import db from "../utils/db.js";
import { acloseCommand } from "./commands/aclose_command.js";

import { closeCommand } from "./commands/close_command.js";
import { nocloseCommand } from "./commands/noclose_command.js";
import { nopingCommand } from "./commands/noping_command.js";
import { pingCommand } from "./commands/ping_command.js";
import { yescloseCommand } from "./commands/yesclose_command.js";

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
        case "yesclose":
            await yescloseCommand(command, args, message, ticket, client);
            break;
        case "noclose":
            await nocloseCommand(command, args, message, ticket, client);
            break;
        default:
            await logComment([command, ...args].join(" "), ticket, message.author);
            break;
    }
}

async function logComment(message: string, ticket: Ticket, user: User): Promise<void> {
    await db.logs.create({
        data: {
            type: "COMMENT",
            userId: user.id,
            ticketId: ticket.ticketId,
            message: message,
        }
    });
}
