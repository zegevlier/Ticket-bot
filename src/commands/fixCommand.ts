import { CommandInteraction, User } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import { isStaffGuard } from "../guards/isStaffGuard.js";
import db from "../utils/db.js";

@Discord()
class fixCommand {
    @Slash("fix")
    @Guard(
        isStaffGuard
    )
    async hello(
        @SlashOption("user", { description: "The user to blacklist", type: "USER" })
        user: User,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {
        await db.ticket.updateMany({
            where: {
                userId: user.id,
                closed: false,
            },
            data: {
                closed: true,
                closedReason: "USER FIXED",
            }
        });
        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `All tickets for <@${user.id}> have been marked as closed. If they had any active tickets, these channels need to be deleted manually.`,
                        color: "AQUA",
                    }
                ]
            }
        );
    }
}