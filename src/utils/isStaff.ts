import { GuildMember } from "discord.js";

export async function isStaff(user: GuildMember): Promise<boolean> {
    for (const id of process.env.STAFF_ROLES?.split(",") || []) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}