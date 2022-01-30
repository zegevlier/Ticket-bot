import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import { Discord, On, Client, SelectMenuComponent } from "discordx";
import type { ArgsOf } from "discordx";

import db from "../utils/db.js";

@Discord()
export abstract class AppDiscord {
    @On("messageCreate")
    async onMessage([message]: ArgsOf<"messageCreate">, client: Client) {
        if (message.author.id !== client.user?.id) {
            if (message.inGuild()) {
                this.handleGuild([message], client);
            } else {
                this.handleDm([message], client);
            }
        }
    }

    async handleDm([message]: ArgsOf<"messageCreate">, client: Client) {
        console.log("DM Created", client.user?.username, message.content);

        const activeTicket = await db.ticket.findFirst({
            where: {
                closed: false,
                userId: message.author.id,
            },
            select: {
                closable: true,
                userId: true,
                channelId: true,
                ticketId: true,
                activePings: {
                    select: {
                        pingId: true,
                        id: true,
                        type: true,
                    }
                }
            },
        });

        if (activeTicket) {
            let guild = client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);
            if (!guild) {
                console.log("Could not find guild", process.env.GUILD_ID);
                return;
            }
            let channel = guild.channels.cache.find((channel) => channel.id === activeTicket.channelId);
            if (!channel || !channel.isText()) {
                console.log("Invalid channel ID in database!", activeTicket.channelId);
                message.reply("An unknown error occurred! Please contact a staff member.");
                return;
            }

            channel.send(message.content);

            for (let ping of activeTicket.activePings) {
                let message;
                if (ping.type === "ROLE") {
                    message = await channel.send(`<@&${ping.id}>`);
                } else {
                    message = await channel.send(`<@${ping.id}>`);
                }
                message.delete();
            }

            message.react("✅");
        } else {
            let catagoryOptions: MessageSelectOptionData[] = [];
            let catagories = await db.catagories.findMany(
                {
                    select: {
                        name: true,
                        catagoryId: true,
                    }
                }
            );
            catagories.forEach((catagory) => {
                catagoryOptions.push(
                    {
                        label: catagory.name,
                        value: catagory.catagoryId,
                    }
                )
            });
            const menu = new MessageSelectMenu()
                .addOptions(catagoryOptions)
                .setCustomId("catagory-menu");

            const buttonRow = new MessageActionRow().addComponents(menu);

            message.reply({
                content: "Please select a catagory",
                components: [buttonRow],
            });
        }
    }

    async handleGuild([message]: ArgsOf<"messageCreate">, client: Client) {
        console.log("Message Created", client.user?.username, message.content);
        let ticket = await db.ticket.findFirst({
            where: {
                channelId: message.channel.id,
                closed: false,
            }
        });
        if (!ticket) {
            return;
        }

        if (message.content.startsWith(process.env.PREFIX || "=")) {
            let command = message.content.substring(process.env.PREFIX?.length || 1);
            let args = command.split(" ");
            let commandName = args.shift();
            let commandArgs = args;
            switch (commandName) {
                case "close":
                    await message.channel.send("Ticket closed!");
                    await db.ticket.update({
                        where: {
                            ticketId: ticket.ticketId,
                        },
                        data: {
                            closed: true,
                            closedId: message.author.id,
                            closedReason: commandArgs.join(" "),
                        }
                    });
                    let userMessage = `Ticket closed by ${message.author.username}.`;
                    if (commandArgs.length > 0) {
                        userMessage += ` Reason: ${commandArgs.join(" ")}`;
                    } else {
                        userMessage += ` No reason provided.`;
                    }

                    await client.users.send(ticket.userId, userMessage).catch((error) => {
                        console.log("Error sending message to user when trying to close ticket.", error);
                    });
                    await message.channel.delete();
            }
            return;
        }

        await client.users.send(ticket.userId, message.content).catch((error) => {
            if (error.code === 50007) {
                message.channel.send("Could not send message to user, they may have left the server or disabled DMs.");
            } else {
                console.log("Error sending message to user.", error);
            }
        });

        await db.ticket.update({
            where: {
                ticketId: ticket.ticketId,
            },
            data: {
                activePings: {
                    create: {
                        type: "USER",
                        id: message.author.id,
                    }
                }
            }
        });
    }


    @SelectMenuComponent("catagory-menu")
    async catagoryMenu(interaction: SelectMenuInteraction) {
        if (!interaction.isSelectMenu()) { return; }
        let guild = interaction.client.guilds.cache.find((guild) => guild.id === process.env.GUILD_ID);
        if (!guild) {
            console.log("Could not find guild", process.env.GUILD_ID);
            return;
        }
        let catagory = await db.catagories.findUnique({
            where: {
                catagoryId: interaction.values?.[0],
            },
            select: {
                disCatagoryId: true,
                name: true,
                openMessage: true,
                pingingRoles: true,
            }
        });
        if (!catagory) {
            console.log("Could not find catagory", interaction.values?.[0]);
            return;
        }
        await interaction.update({
            content: `Creating ticket in ${catagory.name}. Please wait...`,
            components: [],
        });

        let channel = await guild.channels.create(
            catagory.name,
            {
                type: "GUILD_TEXT",
                parent: catagory.disCatagoryId,
            });

        channel.send(
            {
                embeds: [
                    {
                        "title": "New ticket",
                        "description": `Type a message here to send it to the user, messages starting with \`${process.env.PREFIX}\` will not be sent to the user.`,
                        "color": 5814783,
                        "fields": [
                            {
                                "name": "User",
                                "value": `<@${interaction.user.id}> (${interaction.user.id})`,
                                "inline": true
                            },
                            {
                                "name": "Roles",
                                "value": guild.members.cache.find((member) => member.id === interaction.user.id)
                                    ?.roles.cache
                                    .filter((role) => role.name !== "@everyone")
                                    .map((role) => `<@&${role.id}>`)
                                    .join(" ") || "None",
                                "inline": true
                            }
                        ],
                        "footer": {
                            "text": `${interaction.user.tag} | ${interaction.user.id}`,
                            "icon_url": interaction.user.avatarURL() || interaction.user.defaultAvatarURL,
                        },
                        "timestamp": new Date(),
                    }
                ]
            }
        );

        for (let role of catagory.pingingRoles) {
            let message = await channel.send(`<@&${role}>`);
            await message.delete();
        }



        let ticket = await db.ticket.create({
            data: {
                channelId: channel.id,
                userId: interaction.user.id,
                catagoryId: catagory.disCatagoryId,
            },
        });



        await interaction.followUp({
            content: `Ticket created! **NOTE: YOUR FIRST MESSAGE IS NOT SENT. SEND IT AGAIN IF YOU WANT SUPPORT TO SEE IT.**\n ${catagory.openMessage}`,
            components: [],
        });
    }

}
