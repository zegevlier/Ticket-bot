import { Ticket } from "@prisma/client";
import { CommandInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import { inTicketGuard } from "../guards/inTicketGuard.js";
import { onTicketClose } from "../utils/ticketClose.js";

@Discord()
class closeCommand {
    @Slash("close")
    @Guard(
        inTicketGuard
    )
    async hello(
        @SlashOption("reason", { description: "The reason for closing", type: "STRING", required: false })
        reason: string | undefined,
        @SlashOption("anonymous", { description: "Whether to close anonymously", type: "BOOLEAN", required: false })
        anonymous: boolean | undefined,
        interaction: CommandInteraction,
        client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        const { ticket } = guardData;
        reason = reason ? reason : "No reason provided.";

        if (!ticket.closable) {
            await interaction.reply(
                {
                    embeds: [
                        {
                            title: "This ticket is not closable.",
                            description: `This ticket was marked as unclosable for the following reason: \`\`\`${ticket.closableReason}\`\`\``,
                            color: "RED",
                            footer: {
                                text: "This message will be deleted in 10 seconds.",
                            },
                            author: {
                                name: interaction.user.tag,
                                icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                            }
                        },
                    ],
                    ephemeral: true,
                }
            );
            return;
        }

        if (!interaction.channel || !interaction.guild) {
            return;
        }

        await onTicketClose(ticket, interaction.channel, interaction.user, interaction.guild, reason, client, anonymous ? true : false);
    }
}