import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function nocloseCommand(command: string, args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    const closeReason = args.join(" ") === "" ? "No reason provided." : args.join(" ");
    await db.ticket.update({
        where: {
            ticketId: ticket.ticketId,
        },
        data: {
            closable: false,
            closableReason: closeReason,
        }
    });

    await message.delete();
    await message.channel.send(
        {
            embeds: [
                {
                    title: "This ticket is now marked as unclosable.",
                    description: `This ticket can no longer be closed, until the \`yesclose\` command is used. Reason: \`\`\`${closeReason}\`\`\``,
                    color: "AQUA",
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
            message: closeReason,
            type: "NOCLOSE"
        }
    });
}