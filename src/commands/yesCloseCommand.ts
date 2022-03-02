import { Ticket } from "@prisma/client";
import { CommandInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
} from "discordx";
import { inTicketGuard } from "../utils/guards/inTicketGuard.js";
import db from "../utils/db.js";

@Discord()
class yesCloseCommand {
    @Slash("yesclose", {
        description: "Allows this ticket to be closed.",
    })
    @Guard(
        inTicketGuard
    )
    async hello(
        interaction: CommandInteraction,
        client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        const { ticket } = guardData;
        await db.ticket.update({
            where: {
                ticketId: ticket.ticketId,
            },
            data: {
                closable: true,
                closableReason: null,
            }
        });

        await interaction.reply(
            {
                embeds: [
                    {
                        title: "This ticket is now marked as closable.",
                        description: `This ticket can now be closed.`,
                        color: "AQUA",
                        author: {
                            name: interaction.user.tag,
                            icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                        },
                    }
                ]
            }
        );

        await db.logs.create({
            data: {
                ticketId: ticket.ticketId,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                type: "YESCLOSE"
            }
        });
    }
}