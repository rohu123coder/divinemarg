import { Suspense } from "react";

import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

function ResetPasswordContent() {
  return (
    <PasswordResetForm
      heading="Set new password"
      submitEndpoint="/api/auth/reset-password"
      loginHref="/login"
      expiredBackHref="/forgot-password"
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
