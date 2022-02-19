import { Ticket } from "@prisma/client";
import { Client, Message, User } from "discord.js";
import db from "../utils/db.js";
import { acloseCommand } from "./commands/aclose_command.js";
import { blacklistCommand } from "./commands/blacklist_command.js";

import { closeCommand } from "./commands/close_command.js";
import { fixCommand } from "./commands/fix_command.js";
import { nocloseCommand } from "./commands/noclose_command.js";
import { nopingCommand } from "./commands/noping_command.js";
import { pingCommand } from "./commands/ping_command.js";
import { unblacklistCommand } from "./commands/unblacklist_command.js";
import { yescloseCommand } from "./commands/yesclose_command.js";

export async function handleTicketCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket | null, client: Client): Promise<void> {
    if (ticket === null) {
        switch (command) {
            case "fix":
                await fixCommand(args, message, client);
                break;
            case "blacklist":
                await blacklistCommand(args, message, client);
                break;
            case "unblacklist":
                await unblacklistCommand(args, message, client);
        }
        return;
    }
    switch (command) {
        case "close":
            await closeCommand(args, message, ticket, client);
            break;
        case "aclose":
            await acloseCommand(args, message, ticket, client);
            break;
        case "ping":
            await pingCommand(args, message, ticket, client);
            break;
        case "noping":
            await nopingCommand(args, message, ticket, client);
            break;
        case "yesclose":
            await yescloseCommand(args, message, ticket, client);
            break;
        case "noclose":
            await nocloseCommand(args, message, ticket, client);
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
