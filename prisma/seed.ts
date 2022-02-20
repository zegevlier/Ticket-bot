import Prisma from "@prisma/client";

const { PrismaClient } = Prisma;

let db = new PrismaClient();

async function seed() {
    await db.catagory.deleteMany({});
    await db.catagory.createMany({
        data: [
            {
                disCatagoryId: "937132793148895302",
                name: "General",
                openMessage: "Please specify you issue",
                pingingRoles: ["937740822043041813", "937740866041311342"],
                description: "General issues",
            },
            {
                disCatagoryId: "937446809838694470",
                name: "Account",
                openMessage: "You have an account issue!",
                pingingRoles: ["937740778363555931", "937740866041311342"],
                description: "Account related issues",
            }
        ],
    });
}

await seed();
