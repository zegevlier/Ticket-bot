import { Client } from "discord.js";
import { ArgsOf } from "discordx";
import db from "../utils/db.js";
import { handleTicketCommand } from "./ticket_commands.js";

export async function handleGuild([message]: ArgsOf<"messageCreate">, client: Client) {
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
        if (commandName === undefined) {
            return;
        }
        handleTicketCommand(commandName, commandArgs, message, ticket, client);
        return;
    }

    await client.users.send(ticket.userId, {
        embeds: [
            {
                description: `${message.content}`,
                color: 8781568,
                author: {
                    name: `${message.author.tag}`,
                    icon_url: `${message.author.avatarURL()}`,
                },
                timestamp: new Date(),
            }
        ]
    }).catch((error) => {
        if (error.code === 50007) {
            message.channel.send("Could not send message to user, they may have left the server or disabled DMs.");
        } else {
            console.log("Error sending message to user.", error);
        }
    });

    await message.delete();
    let user = message.guild?.members.cache.find((member) => member.id === ticket?.userId);
    if (!user) {
        console.log("Could not find user in guild.", ticket.userId);
        return;
    }
    await message.channel.send({
        embeds: [
            {
                description: `${message.content}`,
                color: 8781568,
                author: {
                    name: `${message.author.tag}`,
                    icon_url: `${message.author.avatarURL()}`,
                },
                footer: {
                    text: `${user.user.tag} | ${user.id}`,
                    iconURL: user.user.avatarURL() ?? undefined,
                },
                timestamp: new Date(),
            }
        ]
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