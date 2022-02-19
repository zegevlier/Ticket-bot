import { Client, Message } from "discord.js";
import db from "../../utils/db.js";

export async function blacklistCommand(args: string[], message: Message<boolean>, client: Client): Promise<void> {
    if (message.guild === null) { return }; // Can never happen
    if (!message.member?.roles.cache.has(process.env.ADMIN_ROLE || "")) {
        return;
    }
    if (args.length !== 1) {
        message.reply("Please provide a user ID.");
        return;
    }

    const user = await client.users.fetch(args[0]);
    if (user === null) {
        message.reply("That user ID is invalid.");
        return;
    }
    await db.user.upsert({
        where: {
            id: user.id,
        },
        create: {
            id: user.id,
            blacklisted: true,
        },
        update: {
            blacklisted: true,
        }
    });
    await db.logs.create({
        data: {
            type: "BLACKLIST",
            userId: user.id,
            extra: "Blacklisted by: " + message.author.id + " / " + message.author.tag,
        }
    });
    await message.channel.send(`${user.tag} has been blacklisted.`);
}
