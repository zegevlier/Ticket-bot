import Prisma from "@prisma/client";

const { PrismaClient } = Prisma;

let db = new PrismaClient();

export default db;