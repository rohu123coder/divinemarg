import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: "../../../.env" });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  if (!gmailUser) {
    console.log(`[DEV] Email OTP for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"DivineMarg" <${gmailUser}>`,
    to: email,
    subject: "Your DivineMarg OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7C3AED, #4F46E5); padding: 20px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">✨ DivineMarg</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 12px; margin-top: 20px;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p style="color: #666;">Use this OTP to login to DivineMarg:</p>
          <div style="background: white; border: 2px solid #7C3AED; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #7C3AED; font-size: 40px; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #999; font-size: 12px;">Valid for 5 minutes. Do not share with anyone.</p>
        </div>
      </div>
    `,
  });
}
