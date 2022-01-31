import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function nopingCommand(args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    await db.ticket.update({
        where: {
            ticketId: ticket.ticketId,
        },
        data: {
            activePings: {
                deleteMany: {
                    type: "USER",
                    id: message.author.id,
                }
            }
        }
    });

    await message.delete();
    const doneMessage = await message.channel.send(
        {
            embeds: [
                {
                    title: "You will be NOT notified when the user responds.",
                    description: "If you do wish to be notified, use `ping`",
                    color: "AQUA",
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.avatarURL() ?? message.author.defaultAvatarURL,
                    },
                    footer: {
                        text: "This message will be deleted in 10 seconds.",
                    }
                }
            ]
        }
    );

    setTimeout(async () => {
        await doneMessage.delete().catch(() => { });
    }, 10000);
}