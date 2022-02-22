import { GuildMember } from "discord.js";

export async function isAdmin(user: GuildMember): Promise<boolean> {
    if (!process.env.ADMIN_ROLE) {
        return false;
    }
    return (user.roles.cache.has(process.env.ADMIN_ROLE));
}