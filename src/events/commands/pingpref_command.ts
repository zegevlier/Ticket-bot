import { Client, Message } from "discord.js";
import db from "../../utils/db.js";
import { isStaff } from "../../utils/isStaff.js";

export async function pingprefCommand(args: string[], message: Message<boolean>, client: Client): Promise<void> {
    if (message.guild === null || message.member === null) { return }; // Can never happen
    if (!await isStaff(message.member)) {
        return;
    }
    if (args.length !== 1 || !(args[0].toLocaleLowerCase() === "yes" || args[0].toLocaleLowerCase() === "no")) {
        message.reply("Please provide either yes or no.");
        return;
    }

    const newPreference = args[0].toLocaleLowerCase() === "yes";

    await db.user.upsert({
        where: {
            id: message.author.id,
        },
        create: {
            id: message.author.id,
            pingPreference: newPreference,
        },
        update: {
            pingPreference: newPreference,
        }
    });

    await message.channel.send(`Updated your ping preference to \`${newPreference ? "yes" : "no"}\`.`);
}
