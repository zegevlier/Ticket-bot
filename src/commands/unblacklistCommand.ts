import { CommandInteraction, User } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import { isAdminGuard } from "../guards/isAdminGuard.js";
import db from "../utils/db.js";

@Discord()
class unblacklistCommand {
    @Slash("unblacklist")
    @Guard(
        isAdminGuard
    )
    async hello(
        @SlashOption("user", { description: "The user to blacklist", type: "USER" })
        user: User,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {
        await db.user.upsert({
            where: {
                id: user.id,
            },
            create: {
                id: user.id,
                blacklisted: false,
                blacklistReason: null,
            },
            update: {
                blacklisted: false,
                blacklistReason: null,
            }
        });
        await db.logs.create({
            data: {
                type: "UNBLACKLIST",
                userId: user.id,
                extra: "Unblacklisted by: " + interaction.user.id + " / " + interaction.user.tag,
            }
        });
        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `<@${user.id}> is now unblacklisted.`,
                        color: "AQUA",
                    }
                ]
            }
        );
    }
}