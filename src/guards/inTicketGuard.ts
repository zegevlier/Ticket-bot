import { GuardFunction } from "discordx";
import { CommandInteraction } from "discord.js";
import db from "../utils/db.js";

export const inTicketGuard: GuardFunction<CommandInteraction> =
    async (interaction: CommandInteraction, client, next, guardData) => {
        const ticket = await db.ticket.findFirst({
            where: {
                channelId: interaction.channelId,
            }
        });
        if (!interaction.guild) {
            return;
        }
        if (!ticket || ticket.closed) {
            await interaction.reply({
                ephemeral: true,
                embeds: [{
                    title: "Error",
                    description: "This channel is not a ticket.",
                    color: "RED",
                }],
            });
            return;
        }
        guardData.ticket = ticket;
        await next();
    };