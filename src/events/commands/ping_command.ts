import { Ticket } from "@prisma/client";
import { Client, Message } from "discord.js";
import { addPing } from "../../utils/addPing.js";

export async function pingCommand(args: string[], message: Message<boolean>, ticket: Ticket, client: Client): Promise<void> {
    addPing("USER", message.author.id, ticket.ticketId);

    await message.delete();

    const doneMessage = await message.channel.send(
        {
            embeds: [
                {
                    title: "You will be notified when the user responds.",
                    description: "If you no longer wish to be notified, use `noping`",
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
        await doneMessage.delete();
    }, 10000);
}