import db from "./db.js";

export async function addPing(type: "ROLE" | "USER", id: string, ticketid: string): Promise<void> {
    await db.ticket.update({
        where: {
            ticketId: ticketid,
        },
        data: {
            activePings: {
                deleteMany: {
                    id: id,
                    type: type,
                }
            }
        }
    });

    await db.ticket.update({
        where: {
            ticketId: ticketid,
        },
        data: {
            activePings: {
                create: {
                    type: type,
                    id: id,
                }
            }
        }
    });
}