import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export default function ForgotPasswordPage() {
  return (
    <PasswordResetRequestForm
      heading="Reset your password"
      subtext="Enter your registered email. We'll send you a reset link."
      submitEndpoint="/api/auth/forgot-password"
      backHref="/login"
    />
  );
}
