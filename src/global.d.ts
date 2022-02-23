type anon = {
    prefix: string;
    icon_url: string;
    name: string;
}

type category = {
    name: string;
    openMessage: string;
    disCategoryId: string;
    description: string;
    pingingRoles: string[];
}

type roles = {
    admin: string[];
    staff: string[];
    paid: string[];
}

declare global {
    var config: {
        guild_id: string;
        log_channel_id: string;
        silent_prefix: string;
        general_note: string;
        anon: anon;
        storage_url_prefix: string;
        categories: category[];
        roles: roles;
    };
}

export { };