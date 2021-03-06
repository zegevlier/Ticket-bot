import { UserContextMenuInteraction } from "discord.js";
import { ContextMenu, Discord, Guard } from "discordx";
import { isAdminGuard } from "../utils/guards/isAdminGuard.js";
import { openTicket } from "../utils/ticketOpen.js";

@Discord()
export abstract class newTicket {
    @ContextMenu("USER", "New Ticket")
    @Guard(
        isAdminGuard
    )
    async userHandler(interaction: UserContextMenuInteraction) {

        if (!interaction.guild) {
            await interaction.reply({
                ephemeral: true,
                content: "That's strange!"
            });
            return;
        }

        const category = config.categories.at(0);
        if (!category) {
            await interaction.reply({
                ephemeral: true,
                content: "There are no catagories!"
            });
            return;
        }

        const ticket = await openTicket(interaction.guild, interaction.targetUser, category);
        await interaction.reply({
            ephemeral: true,
            content: `Ticket created! <#${ticket.channelId}>`
        });

        await interaction.targetUser.send({
            embeds: [
                {
                    title: "Ticket created!",
                    description: category.openMessage,
                    color: "DARK_AQUA",
                    fields: [
                        // Only add note if `global.config.general_note` is set
                        ...(global.config.general_note ?
                            [{
                                name: "NOTE:",
                                value: global.config.general_note,
                            }] : []),
                    ],
                    footer: {
                        text: `Ticket ID: ${ticket.ticketId}`,
                    }
                }
            ]
        });

    }
}