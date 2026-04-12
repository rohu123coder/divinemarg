import { Suspense } from "react";

import { ChatSessionClient } from "./ChatSessionClient";

function ChatFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
}

export default function ChatSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatSessionClient sessionId={params.sessionId} />
    </Suspense>
  );
}
