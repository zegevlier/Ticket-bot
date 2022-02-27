import Prisma from "@prisma/client";

const { PrismaClient } = Prisma;

let db = new PrismaClient();

async function seed() {
    await db.quickReply.create({
        data: {
            title: "Hello",
            trigger: "hello",
            content: "Hello, Hi",
            url: "https://www.google.com",
        },
    });

    await db.quickReply.create({
        data: {
            title: "Hello2",
            trigger: "hello2",
            content: "Heyyyy",
        },
    });


}

await seed();
