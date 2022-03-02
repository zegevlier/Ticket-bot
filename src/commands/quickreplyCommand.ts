import { Ticket } from "@prisma/client";
import { CommandInteraction, Interaction, MessageActionRow, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import {
    Client,
    Discord,
    Guard,
    SelectMenuComponent,
    Slash,
    SlashOption,
} from "discordx";
import { addPing } from "../utils/addPing.js";
import db from "../utils/db.js";
import { inTicketGuard } from "../utils/guards/inTicketGuard.js";

@Discord()
class closeCommand {
    @Slash("quickreply")
    @Guard(
        inTicketGuard
    )
    async hello(
        @SlashOption("trigger", { description: "Trigger of the quick reply, leave empty for selection.", type: "STRING", required: false })
        trigger: string | undefined,
        interaction: CommandInteraction,
        client: Client,
        guardData: { ticket: Ticket }
    ): Promise<void> {
        const { ticket } = guardData;

        if (trigger) {
            await sendQuickReply(interaction, trigger, ticket, client);
        } else {
            const quickReplies = await db.quickReply.findMany({});
            const categoryOptions: MessageSelectOptionData[] = quickReplies.map((qr) => {
                return {
                    label: qr.title,
                    value: qr.trigger,
                    description: `Trigger: ${qr.trigger}`,
                };
            });
            const menu = new MessageSelectMenu()
                .addOptions(categoryOptions)
                .setCustomId("qr-menu");


            interaction.reply({
                content: "Please select a quick reply.",
                components: [new MessageActionRow().addComponents(menu)],
                ephemeral: true,
            });
        }
    }

    @SelectMenuComponent("qr-menu")
    async handle(interaction: SelectMenuInteraction, client: Client) {
        const ticket = await db.ticket.findFirst({
            where: {
                channelId: interaction.channel?.id,
            },
        });
        if (!ticket) {
            await interaction.reply({
                content: "Could not find ticket.",
            });
            return;
        }
        await sendQuickReply(interaction, interaction.values?.[0], ticket, client);

    }
}

async function sendQuickReply(interaction: CommandInteraction | SelectMenuInteraction, trigger: string, ticket: Ticket, client: Client) {
    const quickReply = await db.quickReply.findFirst({
        where: {
            trigger: trigger,
        },
    });

    if (!quickReply) {
        await interaction.reply(
            {
                embeds: [
                    {
                        title: "Could not find quick reply.",
                        description: "Please try again. Leave out the ID to get a full list.",
                        color: "RED",
                    }
                ],
                ephemeral: true,
            }
        );
        return;
    }

    await client.users.send(ticket.userId, {
        embeds: [
            {
                title: quickReply.title,
                description: quickReply.content ?? "",
                url: quickReply.url ?? undefined,
                color: "GREEN",
                author: {
                    name: interaction.user.tag,
                    icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                },
                timestamp: new Date(),
            },
        ],
    }).catch((error) => {
        if (error.code === 50007) {
            interaction.reply("Could not send message to user, they may have left the server or disabled DMs.");
        } else {
            console.log("Error sending message to user.", error);
        }
        return;
    });

    let user = interaction.guild?.members.cache.find((member) => member.id === ticket?.userId);
    if (!user) {
        console.log("Could not find user in guild.", ticket.userId);
        return;
    }

    await interaction.reply({
        content: "Message sent!",
        ephemeral: true,
    });

    await interaction.channel?.send({
        embeds: [
            {
                title: quickReply.title,
                description: quickReply.content ?? "",
                color: "GREEN",
                url: quickReply.url ?? undefined,
                author: {
                    name: interaction.user.tag,
                    icon_url: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
                },
                footer: {
                    text: `${user.user.tag} | ${user.id}`,
                    iconURL: user.user.avatarURL() ?? undefined,
                },
                timestamp: new Date(),
            }
        ],
    });

    const staffuser = await db.user.findUnique({
        where: {
            id: interaction.user.id,
        }
    });

    if ((staffuser && staffuser.pingPreference) || !staffuser) {
        addPing("USER", interaction.user.id, ticket.ticketId);
    }

    await db.logs.create({
        data: {
            type: "QUICKREPLY",
            ticketId: ticket.ticketId,
            userId: interaction.user.id,
            userTag: interaction.user.tag,
            message: quickReply.content ?? "",
            extra: JSON.stringify({
                quickreply: quickReply.trigger,
            })
        }
    });
} 