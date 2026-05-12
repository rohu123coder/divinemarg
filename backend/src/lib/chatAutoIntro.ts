import { pool } from "../db/index.js";
import { getSocketServer } from "../socket/io.js";
import { noteAutomatedUserIntro } from "../socket/index.js";

export async function autoInjectIntroMessage(
  sessionId: string,
  userId: string,
  astrologerName: string,
  problemArea: string | null
): Promise<void> {
  const userResult = await pool.query<{
    name: string;
    date_of_birth: Date | string | null;
    time_of_birth: string | null;
    birth_place_name: string | null;
    gender: string | null;
    marital_status: string | null;
    occupation: string | null;
  }>(
    `SELECT name, date_of_birth, time_of_birth, birth_place_name,
            gender, marital_status, occupation
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) return;
  const u = userResult.rows[0];

  const lines = [`Hi ${astrologerName},`, "Below are my details:"];
  lines.push(`Name: ${u.name || "N/A"}`);
  if (u.gender) {
    lines.push(
      `Gender: ${u.gender.charAt(0).toUpperCase() + u.gender.slice(1)}`
    );
  }

  if (u.date_of_birth) {
    const dob = new Date(u.date_of_birth);
    const formatted = dob
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      .replace(/ /g, "-");
    lines.push(`DOB: ${formatted}`);
  }

  if (u.time_of_birth) {
    const raw = String(u.time_of_birth).trim();
    const parts = raw.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      lines.push(
        `TOB: ${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`
      );
    }
  }

  if (u.birth_place_name) {
    lines.push(`POB: ${u.birth_place_name}, India`);
  }

  if (u.marital_status) {
    const ms =
      u.marital_status.charAt(0).toUpperCase() + u.marital_status.slice(1);
    lines.push(`Relationship Status: ${ms}`);
  }

  if (u.occupation) {
    const occMap: Record<string, string> = {
      student: "Student",
      job: "Job/Service",
      business: "Business/Self Employed",
      housewife: "Housewife",
      retired: "Retired",
      other: "Other",
    };
    lines.push(`Occupation: ${occMap[u.occupation] || u.occupation}`);
  }

  if (problemArea) {
    lines.push(`Problem Area: ${problemArea}`);
  }

  const messageText = lines.join("\n");

  const msgResult = await pool.query<{ id: string; created_at: Date }>(
    `INSERT INTO messages (session_id, sender_id, sender_type, content, is_automated)
     VALUES ($1, $2, 'user'::message_sender_type, $3, true)
     RETURNING id, created_at`,
    [sessionId, userId, messageText]
  );

  const row = msgResult.rows[0];
  if (!row) return;

  try {
    await pool.query(
      `INSERT INTO session_messages_archive (session_id, sender_role, content, created_at)
       VALUES ($1, 'user', $2, NOW())`,
      [sessionId, messageText]
    );
  } catch (e) {
    console.error("[Auto-Inject] Archive insert failed:", e);
  }

  noteAutomatedUserIntro(sessionId);

  try {
    const io = getSocketServer();
    io.to(sessionId).emit("new_message", {
      id: row.id,
      sessionId,
      senderId: userId,
      senderType: "user",
      content: messageText,
      isAutomated: true,
      createdAt: row.created_at.toISOString(),
    });
  } catch (e) {
    console.error("[Auto-Inject] Socket emit failed:", e);
  }
}
