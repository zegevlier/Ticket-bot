import { GuildMember } from "discord.js";

export async function isAdmin(user: GuildMember): Promise<boolean> {
    if (!process.env.ADMIN_ROLE) {
        return false;
    }
    return (user.roles.cache.has(process.env.ADMIN_ROLE));
}

export async function isPaid(user: GuildMember): Promise<boolean> {
    for (const id of process.env.PAID_ROLES?.split(",") || []) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}

export async function isStaff(user: GuildMember): Promise<boolean> {
    for (const id of process.env.STAFF_ROLES?.split(",") || []) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}
