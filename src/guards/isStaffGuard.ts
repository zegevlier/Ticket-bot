import { GuardFunction } from "discordx";
import { CommandInteraction, GuildMember } from "discord.js";
import { isStaff } from "../utils/isStaff.js";

export const isStaffGuard: GuardFunction<CommandInteraction> =
    async (interaction: CommandInteraction, client, next, guardData) => {
        if (!await isStaff(interaction.member as GuildMember)) {
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