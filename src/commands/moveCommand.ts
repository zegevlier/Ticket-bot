import { Ticket } from "@prisma/client";
import { CommandInteraction, GuildChannel, MessageActionRow, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    SelectMenuComponent,
    Slash,
    SlashOption,
} from "discordx";
import db from "../utils/db.js";
import { inTicketGuard } from "../utils/guards/inTicketGuard.js";
import { onTicketClose } from "../utils/ticketClose.js";

@Discord()
class closeCommand {
    @Slash("move")
    @Guard(
        inTicketGuard
    )
    async hello(
        interaction: CommandInteraction,
        _client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        // const { ticket } = guardData;
        const categories = config.categories;
        const categoryOptions: MessageSelectOptionData[] = categories.map((category) => {
            return {
                label: category.name,
                value: category.id,
                description: category.description
            };
        });
        const menu = new MessageSelectMenu()
            .addOptions(categoryOptions)
            .setCustomId("move-menu");


        interaction.reply({
            content: "Please select a category to move the ticket to.",
            components: [new MessageActionRow().addComponents(menu)],
            ephemeral: true,
        });
    }

    @SelectMenuComponent("move-menu")
    async handle(interaction: SelectMenuInteraction) {
        await interaction.deferReply();

        const category = config.categories.find((category) => category.id === interaction.values?.[0]);

        if (!category) {
            console.log("Could not find category", interaction.values?.[0]);
            return;
        }

        const ticket = await db.ticket.findFirst({
            where: {
                channelId: interaction.channel?.id,
            },
        });

        if (!ticket) {
            interaction.followUp("You're not in a ticket");
            return;
        }

        await db.ticket.update({
            where: {
                ticketId: ticket.ticketId,
            },
            data: {
                categoryId: category.id,
            },
        });

        const channel = interaction.channel as GuildChannel;

        await channel.setParent(category.disCategoryId);

        await interaction.followUp({
            embeds: [{
                title: "Ticket moved",
                description: `Ticket moved to ${category.name}`,
                color: 0x00ff00,
            }],
        });

        await db.logs.create({
            data: {
                type: "MOVE",
                userId: interaction.user?.id,
                ticketId: ticket.ticketId,
                extra: JSON.stringify({
                    from: ticket.categoryId,
                    to: category.id,
                }),
            }
        });
    }
}