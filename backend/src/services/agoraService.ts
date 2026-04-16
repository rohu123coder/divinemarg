import pkg from "agora-token";

const { RtcRole, RtcTokenBuilder } = pkg;

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

if (!APP_ID) {
  throw new Error("AGORA_APP_ID is required");
}

if (!APP_CERTIFICATE) {
  throw new Error("AGORA_APP_CERTIFICATE is required");
}

export function generateAgoraToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber" = "publisher"
): string {
  const expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const rtcRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    rtcRole,
    expiryTime,
    expiryTime
  );
}

export function generateChannelName(sessionId: string): string {
  return `dm_${sessionId.replace(/-/g, "").substring(0, 20)}`;
}

