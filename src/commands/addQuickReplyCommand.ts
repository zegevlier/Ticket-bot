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
    @Slash("add-quickreply", { description: "Adds a quick reply to the database. If a trigger is already used, it overwrites it." })
    @Guard(
        isAdminGuard
    )
    async hello(
        @SlashOption("trigger", { description: "The trigger of this quick reply.", type: "STRING" })
        trigger: string,
        @SlashOption("title", { description: "The title of this quick reply.", type: "STRING" })
        title: string,
        @SlashOption("content", { description: "The contents of this quick reply.", type: "STRING" })
        content: string,
        @SlashOption("url", { description: "The url of this quick reply.", type: "STRING", required: false })
        url: string | null,
        interaction: CommandInteraction,
        client: Client,
    ): Promise<void> {

        await db.quickReply.upsert({
            where: {
                trigger: trigger,
            },
            create: {
                trigger: trigger,
                title: title,
                content: content,
                url: url,
            },
            update: {
                title: title,
                content: content,
                url: url,
            },
        });

        await interaction.reply(
            {
                embeds: [
                    {
                        title: `Done!`,
                        description: `Quick reply created, it can be used from now on!`,
                        color: "AQUA",
                    }
                ]
            }
        );

        await db.logs.create({
            data: {
                type: "QUICKREPLYADD",
                userTag: interaction.user.tag,
                userId: interaction.user.id,
                message: "Added quick reply: " + trigger,
                extra: JSON.stringify({
                    trigger: trigger,
                    title: title,
                    content: content,
                    url: url,
                }),
            }
        });
    }
}