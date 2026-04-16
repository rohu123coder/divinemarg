import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export default function AstrologerForgotPasswordPage() {
  return (
    <PasswordResetRequestForm
      heading="Reset your password"
      subtext="Enter your registered email. We'll send you a reset link."
      submitEndpoint="/api/auth/astrologer/forgot-password"
      backHref="/astrologer/login"
    />
  );
}
