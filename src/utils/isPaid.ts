import { GuildMember } from "discord.js";

export async function isPaid(user: GuildMember): Promise<boolean> {
    for (const id of process.env.PAID_ROLES?.split(",") || []) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}