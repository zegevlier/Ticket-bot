import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function yescloseCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    await db.ticket.update({
        where: {
            ticketId: ticket.ticketId,
        },
        data: {
            closable: true,
            closableReason: undefined,
        }
    });

    await message.delete();
    await message.channel.send(
        {
            embeds: [
                {
                    title: "This ticket is now marked as closable.",
                    description: "This ticket can now be closed.",
                    color: 16583,
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                    },
                }
            ]
        }
    );
    await db.logs.create({
        data: {
            ticketId: ticket.ticketId,
            userId: message.author.id,
            type: "YESCLOSE"
        }
    });
}