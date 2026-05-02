import { v2 as cloudinary } from "cloudinary";
import pkg from "pg";
const { Pool } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const { rows } = await pool.query(
    `SELECT a.id, a.user_id, a.profile_photo_url
     FROM astrologers a
     WHERE a.profile_photo_url LIKE '%onrender.com%'`
  );

  console.log(`Found ${rows.length} astrologers to migrate`);

  for (const row of rows) {
    const url = row.profile_photo_url;
    console.log(`Migrating: ${url}`);
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: "divinemarg/profiles",
      });
      const newUrl = result.secure_url;
      await pool.query(`UPDATE astrologers SET profile_photo_url = $1 WHERE id = $2`, [newUrl, row.id]);
      await pool.query(`UPDATE users SET profile_photo_url = $1 WHERE id = $2`, [newUrl, row.user_id]);
      console.log(`Done: ${newUrl}`);
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }

  await pool.end();
  console.log("Migration complete!");
}

migrate();
