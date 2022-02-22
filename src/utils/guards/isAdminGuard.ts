import { GuardFunction } from "discordx";
import { CommandInteraction, GuildMember } from "discord.js";
import { isAdmin } from "../isAdmin.js";

export const isAdminGuard: GuardFunction<CommandInteraction> =
    async (interaction: CommandInteraction, client, next, guardData) => {
        if (!await isAdmin(interaction.member as GuildMember)) {
            await interaction.reply({
                ephemeral: true,
                embeds: [{
                    title: "Error",
                    description: "You do not have permission to execute this command.",
                    color: "RED",
                }],
            });
            return;
        }

        await next();
    };