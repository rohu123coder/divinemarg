import { v2 as cloudinary } from "cloudinary";
import pkg from "pg";
const { Pool } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r1 = await cloudinary.uploader.upload(
  "/Users/rohit/Downloads/1234567891.jpg",
  { folder: "divinemarg/profiles" }
);
console.log("Photo 1 uploaded:", r1.secure_url);
await pool.query(`UPDATE astrologers SET profile_photo_url = $1 WHERE id = '0029a767-b915-4454-abae-6673909d79ff'`, [r1.secure_url]);
await pool.query(`UPDATE users SET profile_photo_url = $1 WHERE id = (SELECT user_id FROM astrologers WHERE id = '0029a767-b915-4454-abae-6673909d79ff')`, [r1.secure_url]);

const r2 = await cloudinary.uploader.upload(
  "/Users/rohit/Downloads/cp.png",
  { folder: "divinemarg/profiles" }
);
console.log("Photo 2 uploaded:", r2.secure_url);
await pool.query(`UPDATE astrologers SET profile_photo_url = $1 WHERE id = '8fd6fcc9-12dd-404e-a5a6-e241735cf5f6'`, [r2.secure_url]);
await pool.query(`UPDATE users SET profile_photo_url = $1 WHERE id = (SELECT user_id FROM astrologers WHERE id = '8fd6fcc9-12dd-404e-a5a6-e241735cf5f6')`, [r2.secure_url]);

await pool.end();
console.log("All done!");
