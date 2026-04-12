import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  const schemaPath = join(__dirname, "schema.sql");
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
  console.log("Migration completed successfully.");
  await pool.end();
}

migrate().catch(async (err: unknown) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
