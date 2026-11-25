import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_PROGRAMS, SEED_REPORTS } from "../src/data/seedData";

// Seed with the direct (unpooled) URL like migrations do; fall back to the pooled one.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set. Add one to .env (never commit that file).");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

async function main() {
  // Programs first: reports point at them. Upsert by fixed id, so re-running is safe and nothing is deleted.
  for (const { id, ...fields } of SEED_PROGRAMS) {
    await prisma.program.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }

  for (const { id, ...fields } of SEED_REPORTS) {
    await prisma.outcomeReport.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }

  console.log(`Seeded ${SEED_PROGRAMS.length} sample programs and ${SEED_REPORTS.length} sample reports.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
