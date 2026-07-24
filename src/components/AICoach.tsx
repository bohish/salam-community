import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, RotateCcw, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUGGESTED_PROMPTS,
  createMessage,
  sendCoachMessage,
  type CoachMessage,
} from "@/services/aiCoach";

const TypingDots = () => (
  <div className="flex items-center gap-1 py-1" aria-label="يكتب...">
    {[0, 150, 300].map((d) => (
      <span
        key={d}
        className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse"
        style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }}
      />
    ))}
  </div>
);

const MessageBubble = ({ m }: { m: CoachMessage }) => {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex gap-2.5 animate-fade-in", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "w-7 h-7 rounded-full shrink-0 flex items-center justify-center border",
          isUser
            ? "bg-primary/15 border-primary/30 text-primary"
            : "bg-gradient-primary border-primary/40 text-primary-foreground shadow-[var(--shadow-glow)]",
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card/80 border border-border/60 text-foreground rounded-tl-sm",
        )}
      >
        {m.content.split("\n").map((line, i) => {
          // very light markdown-ish rendering (bold via **)
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className={i > 0 ? "mt-0.5" : ""}>
              {parts.map((p, j) =>
                p.startsWith("**") && p.endsWith("**") ? (
                  <strong key={j} className="font-black">
                    {p.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={j}>{p}</span>
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AICoach = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg = createMessage("user", trimmed);
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const reply = await sendCoachMessage(nextHistory, trimmed, undefined, ctrl.signal);
      setMessages((prev) => [...prev, createMessage("assistant", reply)]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", "تعذّر الاتصال بالمدرب الآن، حاول مرة أخرى بعد قليل."),
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Futmac AI Coach"
        className={cn(
          "fixed z-50 bottom-24 sm:bottom-6 left-4 sm:left-6",
          "w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-primary text-primary-foreground",
          "shadow-[var(--shadow-glow)] border border-primary/40",
          "hover:scale-105 active:scale-95 transition-fluid",
        )}
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full bg-accent opacity-70 animate-ping" />
            <span className="relative inline-flex w-3 h-3 rounded-full bg-accent" />
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            dir="rtl"
            className={cn(
              "fixed z-50 flex flex-col animate-slide-up",
              "inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-24 sm:left-6",
              "sm:w-[400px] h-[85vh] sm:h-[600px] sm:max-h-[80vh]",
              "bg-card border border-border/60",
              "rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elegant)]",
              "overflow-hidden",
            )}
          >
            {/* Header */}
            <div className="relative px-4 py-3.5 border-b border-border/60 bg-gradient-to-l from-primary/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">مدرب futmac الذكي</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    جاهز للمساعدة
                  </p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="w-8 h-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-fluid"
                    aria-label="محادثة جديدة"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-fluid"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-primary/15 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-black text-sm mb-1">مرحباً بك في مدرب futmac</p>
                  <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                    اسألني عن بناء تشكيلتك، تحليلها، مقارنة اللاعبين، أو أفضل الترقيات.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}

              {loading && (
                <div className="flex gap-2.5 animate-fade-in">
                  <div className="w-7 h-7 rounded-full bg-gradient-primary border border-primary/40 flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-card/80 border border-border/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            {messages.length === 0 && (
              <div className="px-4 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => send(s.prompt)}
                      disabled={loading}
                      className="text-right p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/60 hover:border-primary/40 transition-fluid disabled:opacity-50"
                    >
                      <div className="text-base leading-none mb-1">{s.emoji}</div>
                      <div className="text-[11px] font-bold">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="p-3 border-t border-border/60 bg-background/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="اسأل المدرب..."
                  disabled={loading}
                  className="flex-1 resize-none max-h-32 min-h-[42px] rounded-xl bg-muted/40 border border-border/60 focus:border-primary/50 focus:outline-none px-3 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-fluid"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-[42px] h-[42px] rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-fluid"
                  aria-label="إرسال"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
                </button>
              </form>
              <p className="text-[9px] text-muted-foreground/70 text-center mt-2">
                مدعوم بالذكاء الاصطناعي
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AICoach;
