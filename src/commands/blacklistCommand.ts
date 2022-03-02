import { CommandInteraction, User } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import { isAdminGuard } from "../utils/guards/isAdminGuard.js";
import db from "../utils/db.js";

@Discord()
class blacklistCommand {
    @Slash("blacklist")
    @Guard(
        isAdminGuard
    )
    async hello(
        @SlashOption("user", { description: "The user to blacklist", type: "USER" })
        user: User,
        @SlashOption("reason", { description: "The reason for blacklisting", type: "STRING", required: false })
        reason: string | undefined,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {
        reason = reason ? reason : "No reason provided.";
        await db.user.upsert({
            where: {
                id: user.id,
            },
            create: {
                id: user.id,
                blacklisted: true,
                blacklistReason: reason,
            },
            update: {
                blacklisted: true,
                blacklistReason: reason,
            }
        });
        await db.logs.create({
            data: {
                type: "BLACKLIST",
                userId: user.id,
                userTag: interaction.user.tag,
                extra: "Blacklisted by: " + interaction.user.id + " / " + interaction.user.tag + "\nReason: " + reason,
            }
        });
        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `<@${user.id}> is now blacklisted. Reason: \`\`\`${reason}\`\`\``,
                        color: "AQUA",
                    }
                ]
            }
        );
    }
}