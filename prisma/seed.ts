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
                pingingRoles: ["931625711297511476"]
            }
        ],
    });
}

await seed();
