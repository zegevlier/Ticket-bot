import { Ticket } from "@prisma/client";
import { CommandInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashChoice,
    SlashOption,
} from "discordx";
import { inTicketGuard } from "../guards/inTicketGuard.js";
import { addPing } from "../utils/addPing.js";
import db from "../utils/db.js";

@Discord()
class pingCommand {
    @Slash("ping")
    @Guard(
        inTicketGuard
    )
    async hello(
        @SlashChoice("Enabled", "on")
        @SlashChoice("Disabled", "off")
        @SlashOption("status", { description: "Whether to enable or disable pings", required: false })
        status: string,
        interaction: CommandInteraction,
        client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        const { ticket } = guardData;
        let enablePing;
        if (status === "" || status === undefined) {
            enablePing = true;
        } else {
            enablePing = status === "on";
        }

        if (enablePing) {
            addPing("USER", interaction.user.id, ticket.ticketId);
            await interaction.reply(
                {
                    embeds: [
                        {
                            title: "You will be notified when the user responds.",
                            description: "If you no longer wish to be notified, use `/ping Disable`",
                            color: "AQUA",
                            author: {
                                name: interaction.user.tag,
                                icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                            },
                        }
                    ],
                    ephemeral: true,
                }
            );
        } else {
            await db.ticket.update({
                where: {
                    ticketId: ticket.ticketId,
                },
                data: {
                    activePings: {
                        deleteMany: {
                            type: "USER",
                            id: interaction.user.id,
                        }
                    }
                }
            });
            await interaction.reply(
                {
                    embeds: [
                        {
                            title: "You will no longer be notified when the user responds.",
                            description: "If you wish to be notified, use `/ping`",
                            color: "AQUA",
                            author: {
                                name: interaction.user.tag,
                                icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                            },
                        }
                    ],
                    ephemeral: true,
                }
            );
        }

    }
}