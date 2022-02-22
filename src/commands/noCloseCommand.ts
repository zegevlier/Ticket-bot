import { Ticket } from "@prisma/client";
import { CommandInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import { inTicketGuard } from "../utils/guards/inTicketGuard.js";
import db from "../utils/db.js";

@Discord()
class noCloseCommand {
    @Slash("noclose", {
        description: "Prevent this ticket from being closed.",
    })
    @Guard(
        inTicketGuard
    )
    async hello(
        @SlashOption("reason", { description: "The reason for preventing closing", type: "STRING", required: false })
        reason: string | undefined,
        interaction: CommandInteraction,
        client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        const { ticket } = guardData;
        reason = reason ? reason : "No reason provided.";
        await db.ticket.update({
            where: {
                ticketId: ticket.ticketId,
            },
            data: {
                closable: false,
                closableReason: reason,
            }
        });

        await interaction.reply(
            {
                embeds: [
                    {
                        title: "This ticket is now marked as unclosable.",
                        description: `This ticket can no longer be closed, until the \`yesclose\` command is used. Reason: \`\`\`${reason}\`\`\``,
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
                message: reason,
                type: "NOCLOSE"
            }
        });
    }
}