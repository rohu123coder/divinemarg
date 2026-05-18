export async function sendEmailOTP(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Email OTP for ${email}: ${otp}`);
    return;
  }
  
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  
  await resend.emails.send({
    from: 'DivineMarg <noreply@divinemarg.com>',
    to: email,
    subject: 'Your DivineMarg OTP',
    html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #7C3AED, #4F46E5); padding: 20px; border-radius: 12px; text-align: center;"><h1 style="color: white; margin: 0;">✨ DivineMarg</h1></div><div style="padding: 30px; background: #f9f9f9; border-radius: 12px; margin-top: 20px;"><h2 style="color: #333;">Your OTP Code</h2><p style="color: #666;">Use this OTP to login to DivineMarg:</p><div style="background: white; border: 2px solid #7C3AED; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;"><h1 style="color: #7C3AED; font-size: 40px; letter-spacing: 10px; margin: 0;">${otp}</h1></div><p style="color: #999; font-size: 12px;">Valid for 5 minutes. Do not share with anyone.</p></div></div>`,
  });
}

export async function sendDemoBookingConfirmation(
  email: string,
  name: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #1A0B2E, #8B5CF6); padding: 24px; border-radius: 12px; text-align: center;"><h1 style="color: #FFD700; margin: 0;">DivineMarg</h1></div><div style="padding: 28px; background: #f9f9f9; border-radius: 12px; margin-top: 20px;"><h2 style="color: #333; margin-top: 0;">Demo booking confirmed</h2><p style="color: #666; line-height: 1.6;">Hi ${name},</p><p style="color: #666; line-height: 1.6;">Your ₹99 live demo is confirmed. Our team will send your Zoom link on WhatsApp within 10 minutes.</p><p style="color: #666; line-height: 1.6;">Questions? Reply to this email or contact support@divinemarg.com.</p></div></div>`;

  if (!apiKey) {
    console.log(`[DEV] Demo booking confirmation for ${email}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "DivineMarg <noreply@divinemarg.com>",
    to: email,
    subject: "Your ₹99 DivineMarg demo is confirmed",
    html,
  });
}

export async function sendAdminDemoBookingNotification(payload: {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentBusiness?: string | null;
  leadId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? "admin@divinemarg.com";
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px;"><h2>New ₹99 B2B demo booking</h2><p><strong>Name:</strong> ${payload.name}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Phone:</strong> ${payload.phone}</p><p><strong>City:</strong> ${payload.city}</p><p><strong>Business:</strong> ${payload.currentBusiness || "—"}</p><p><strong>Lead ID:</strong> ${payload.leadId}</p></div>`;

  if (!apiKey) {
    console.log(`[DEV] Admin demo booking notification:`, payload);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "DivineMarg <noreply@divinemarg.com>",
    to: adminEmail,
    subject: `New ₹99 demo: ${payload.name} (${payload.city})`,
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Password reset for ${email}: ${resetLink}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "DivineMarg <noreply@divinemarg.com>",
    to: email,
    subject: "Reset your DivineMarg password",
    html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #7C3AED, #4F46E5); padding: 20px; border-radius: 12px; text-align: center;"><h1 style="color: white; margin: 0;">DivineMarg</h1></div><div style="padding: 30px; background: #f9f9f9; border-radius: 12px; margin-top: 20px;"><h2 style="color: #333; margin-top: 0;">Reset your password</h2><p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new one. This link will expire in 1 hour.</p><div style="margin: 28px 0; text-align: center;"><a href="${resetLink}" style="display: inline-block; background: #7C3AED; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Reset Password</a></div><p style="color: #666; line-height: 1.6;">If the button does not work, copy and paste this link into your browser:</p><p style="word-break: break-all; color: #4F46E5;">${resetLink}</p><p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p></div></div>`,
  });
}
