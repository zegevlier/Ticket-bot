import { Ticket } from "@prisma/client";
import { User } from "discord.js";
import db from "./db.js";

export async function logComment(message: string, ticketId: string, user: User): Promise<void> {
    await db.logs.create({
        data: {
            type: "COMMENT",
            userId: user.id,
            ticketId: ticketId,
            message: message,
        }
    });
}