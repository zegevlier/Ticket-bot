import { CommandInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    Slash,
    SlashOption,
} from "discordx";
import db from "../utils/db.js";
import { isAdminGuard } from "../utils/guards/isAdminGuard.js";

@Discord()
class fixCommand {
    @Slash("remove-quickreply", { description: "Removes a quick reply to the database." })
    @Guard(
        isAdminGuard
    )
    async hello(
        @SlashOption("trigger", { description: "The trigger of this quick reply.", type: "STRING" })
        trigger: string,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {

        const quickReply = await db.quickReply.delete({
            where: {
                trigger: trigger,
            },
        });

        if (!quickReply) {
            interaction.reply(
                {
                    embeds: [
                        {
                            title: `Error!`,
                            description: `Quick reply not found!`,
                            color: "RED",
                        }
                    ],
                    ephemeral: true,
                }
            );
            return;
        }



        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `Quick reply deleted!`,
                        color: "AQUA",
                    }
                ]
            }
        );

        await db.logs.create({
            data: {
                type: "QUICKREPLYREMOVE",
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                message: "Removed quick reply: " + trigger,
                extra: JSON.stringify(quickReply),
            }
        });
    }
}