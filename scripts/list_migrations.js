// small script to list entries in _prisma_migrations using Prisma Client
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
    const res = await prisma.$queryRaw`select id, migration_name, started_at, finished_at from _prisma_migrations order by started_at;`
    console.log(res)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
