"use client";

type ChatHistoryMessage = {
  sender_role: "user" | "astrologer";
  content: string;
  created_at: string;
};

type ChatHistoryModalProps = {
  open: boolean;
  astrologerName: string;
  sessionId: string;
  messages: ChatHistoryMessage[];
  loading: boolean;
  rated: boolean;
  onClose: () => void;
  onChatAgain: () => void;
  onRateSession: () => void;
};

export function ChatHistoryModal({
  open,
  astrologerName,
  sessionId,
  messages,
  loading,
  rated,
  onClose,
  onChatAgain,
  onRateSession,
}: ChatHistoryModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[min(86vh,760px)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chat History</h2>
            <p className="text-sm text-slate-600">
              {astrologerName} · Session {sessionId.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No archived messages found.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m, idx) => {
                const mine = m.sender_role === "user";
                return (
                  <div
                    key={`${m.created_at}-${idx}`}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? "rounded-br-md bg-gradient-to-br from-purple-600 to-violet-600 text-white"
                          : "rounded-bl-md bg-slate-200 text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
            onClick={onChatAgain}
          >
            Chat Again
          </button>
          {!rated ? (
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              onClick={onRateSession}
            >
              Rate Session
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
