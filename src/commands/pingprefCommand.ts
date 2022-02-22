import { CommandInteraction, User } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashChoice,
    SlashOption,
} from "discordx";
import { isAdminGuard } from "../guards/isAdminGuard.js";
import db from "../utils/db.js";

@Discord()
class pingprefCommand {
    @Slash("pingpref")
    @Guard(
        isAdminGuard
    )
    async hello(
        @SlashChoice("Enabled", "on")
        @SlashChoice("Disabled", "off")
        @SlashOption("status", { description: "Whether to enable or disable pings" })
        status: string,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {
        const newPreference = status === "on";

        await db.user.upsert({
            where: {
                id: interaction.user.id,
            },
            create: {
                id: interaction.user.id,
                pingPreference: newPreference,
            },
            update: {
                pingPreference: newPreference,
            }
        });

        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `Your ping preference has been set to ${newPreference ? "enabled" : "disabled"}.`,
                        color: "AQUA",
                    }
                ],
                ephemeral: true,
            }
        );
    }
}