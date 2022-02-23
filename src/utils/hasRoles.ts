import { GuildMember } from "discord.js";

export async function isAdmin(user: GuildMember): Promise<boolean> {
    for (const id of config.roles.admin) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}

export async function isPaid(user: GuildMember): Promise<boolean> {
    for (const id of config.roles.paid) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}

export async function isStaff(user: GuildMember): Promise<boolean> {
    for (const id of config.roles.staff) {
        if (user.roles.cache.has(id)) {
            return true;
        }
    }
    return false;
}
