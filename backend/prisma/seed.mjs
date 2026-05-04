import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { syncDatabaseUrlFromParts } from "../src/db/databaseUrl.js";

syncDatabaseUrlFromParts();

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.station.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} station(s) already in the database.`);
    return;
  }

  const name = process.env.SEED_STATION_NAME?.trim() || "Station 1";
  const deviceId =
    process.env.TUYA_DEVICE_ID?.trim() || "replace-with-tuya-device-id";
  const localKey =
    process.env.TUYA_LOCAL_KEY?.trim() || "replace-with-tuya-local-key";
  const ipAddress = process.env.TUYA_DEVICE_IP?.trim() || "0.0.0.0";

  await prisma.station.create({
    data: {
      name,
      deviceId,
      localKey,
      ipAddress,
    },
  });

  console.log(`Created first station "${name}" (id will be 1).`);
  if (!process.env.TUYA_DEVICE_ID?.trim()) {
    console.log(
      "Tip: set TUYA_DEVICE_ID, TUYA_LOCAL_KEY, and TUYA_DEVICE_IP in .env for real plug control, then update this row in Prisma Studio or re-create after reset.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
