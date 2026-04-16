import { Suspense } from "react";

import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

function AstrologerResetPasswordContent() {
  return (
    <PasswordResetForm
      heading="Set new password"
      submitEndpoint="/api/auth/astrologer/reset-password"
      loginHref="/astrologer/login"
      expiredBackHref="/astrologer/forgot-password"
    />
  );
}

export default function AstrologerResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      }
    >
      <AstrologerResetPasswordContent />
    </Suspense>
  );
}
