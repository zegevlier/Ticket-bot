import Prisma from "@prisma/client";

const { PrismaClient } = Prisma;

let db = new PrismaClient();

async function seed() {
    await db.catagories.deleteMany({});
    await db.catagories.createMany({
        data: [
            {
                disCatagoryId: "937132793148895302",
                name: "General",
                openMessage: "Please specify you issue",
                pingingRoles: ["931625711297511476"],
                description: "General issues",
            },
            {
                disCatagoryId: "937446809838694470",
                name: "Account",
                openMessage: "You have an account issue!",
                pingingRoles: ["931625711297511476"],
                description: "Account related issues",
            }
        ],
    });
}

await seed();
