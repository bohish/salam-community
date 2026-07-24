import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, RotateCcw, Bot, User, Paperclip, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SUGGESTED_PROMPTS,
  createMessage,
  sendCoachMessage,
  analyzeSquadImage,
  type CoachMessage,
  type AnalyzeStage,
} from "@/services/aiCoach";

const STAGE_LABEL: Record<AnalyzeStage, string> = {
  resizing: "تجهيز الصورة…",
  detecting: "التعرّف على اللاعبين…",
  building: "بناء التشكيلة…",
  analyzing: "تحليل التشكيلة بالذكاء الاصطناعي…",
};

const TypingDots = ({ label }: { label?: string }) => (
  <div className="flex items-center gap-2 py-1" aria-label={label ?? "يكتب..."}>
    <div className="flex items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse"
          style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
    {label && <span className="text-[11px] text-muted-foreground font-bold">{label}</span>}
  </div>
);

const renderMarkdownLine = (line: string, i: number) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div key={i} className={i > 0 ? "mt-0.5" : ""}>
      {parts.map((p, j) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={j} className="font-black">{p.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{p}</span>
        ),
      )}
    </div>
  );
};

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
        {m.attachment?.kind === "image" && (
          <img
            src={m.attachment.url}
            alt={m.attachment.name}
            className="mb-2 rounded-lg max-h-52 w-auto border border-border/40"
          />
        )}
        {m.content.split("\n").map((line, i) => renderMarkdownLine(line, i))}
      </div>
    </div>
  );
};

const AICoach = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, stageLabel]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // Cleanup preview URLs when replaced/unmounted
  useEffect(() => () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
  }, [pendingImage]);

  const attachImage = (file: File | null | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("الرجاء اختيار ملف صورة (PNG/JPG/WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد 10MB).");
      return;
    }
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    setPendingImage({ file, url: URL.createObjectURL(file) });
  };

  const clearPending = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    setPendingImage(null);
  };

  const runImageAnalysis = async (file: File, previewUrl: string, note: string) => {
    const userMsg = createMessage(
      "user",
      note || "حلّل هذه التشكيلة من الصورة.",
      { kind: "image", url: previewUrl, name: file.name },
    );
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingImage(null); // don't revoke — bubble now owns the URL
    setLoading(true);
    setStageLabel(STAGE_LABEL.resizing);
    try {
      const { reply } = await analyzeSquadImage(file, (s) => setStageLabel(STAGE_LABEL[s]));
      setMessages((prev) => [...prev, createMessage("assistant", reply)]);
    } catch (err) {
      const msg = (err as Error).message || "تعذّر تحليل الصورة الآن.";
      toast.error(msg);
      setMessages((prev) => [...prev, createMessage("assistant", `⚠️ ${msg}`)]);
    } finally {
      setLoading(false);
      setStageLabel(null);
    }
  };

  const send = async (text: string) => {
    if (loading) return;
    // If an image is attached, prioritize the analysis pipeline.
    if (pendingImage) {
      await runImageAnalysis(pendingImage.file, pendingImage.url, text.trim());
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
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
        const msg = (err as Error).message || "تعذّر الاتصال بالمدرب الآن، حاول مرة أخرى بعد قليل.";
        toast.error(msg);
        setMessages((prev) => [...prev, createMessage("assistant", msg)]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    clearPending();
    setMessages([]);
    setInput("");
    setLoading(false);
    setStageLabel(null);
  };

  // Drag & drop (desktop)
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) attachImage(f);
  };

  // Paste image from clipboard (desktop)
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) { attachImage(f); e.preventDefault(); break; }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSend = !loading && (!!pendingImage || input.trim().length > 0);

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
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "fixed z-50 flex flex-col animate-slide-up",
              "inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-24 sm:left-6",
              "sm:w-[400px] h-[85vh] sm:h-[600px] sm:max-h-[80vh]",
              "bg-card border border-border/60",
              "rounded-t-3xl sm:rounded-3xl shadow-[var(--shadow-elegant)]",
              "overflow-hidden",
            )}
          >
            {/* Drag overlay */}
            {dragActive && (
              <div className="absolute inset-0 z-10 border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm grid place-items-center pointer-events-none">
                <div className="text-center">
                  <ImageIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="font-black text-sm">أفلت الصورة هنا للتحليل</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="relative px-4 py-3.5 border-b border-border/60 bg-gradient-to-l from-primary/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">مدرب futmac الذكي</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    جاهز — ارفع لقطة تشكيلة لتحليل فوري
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
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                    اسألني عن بناء تشكيلتك أو ارفع لقطة شاشة من زر 📎 لأحلّلها لك مباشرة.
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
                    <TypingDots label={stageLabel ?? undefined} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            {messages.length === 0 && !pendingImage && (
              <div className="px-4 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (s.id === "analyze") {
                          fileInputRef.current?.click();
                        } else {
                          send(s.prompt);
                        }
                      }}
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

            {/* Pending image preview */}
            {pendingImage && (
              <div className="px-3 pt-2">
                <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl p-2">
                  <img src={pendingImage.url} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-border/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black truncate">{pendingImage.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      اضغط إرسال لتحليل التشكيلة تلقائياً • {(pendingImage.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={clearPending}
                    className="w-7 h-7 rounded-lg hover:bg-muted/60 grid place-items-center text-muted-foreground"
                    aria-label="إزالة الصورة"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                {/* Attach buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-[42px] h-[42px] rounded-xl bg-muted/50 border border-border/60 hover:border-primary/50 hover:bg-muted/70 text-foreground flex items-center justify-center transition-fluid disabled:opacity-40"
                    aria-label="إرفاق صورة"
                    title="إرفاق صورة"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={loading}
                      className="w-[42px] h-[42px] rounded-xl bg-muted/50 border border-border/60 hover:border-primary/50 hover:bg-muted/70 text-foreground flex items-center justify-center transition-fluid disabled:opacity-40"
                      aria-label="التقاط بالكاميرا"
                      title="التقاط بالكاميرا"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    attachImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    attachImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

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
                  placeholder={pendingImage ? "أضف ملاحظة (اختياري) واضغط إرسال" : "اسأل المدرب أو ارفع صورة تشكيلة…"}
                  disabled={loading}
                  className="flex-1 resize-none max-h-32 min-h-[42px] rounded-xl bg-muted/40 border border-border/60 focus:border-primary/50 focus:outline-none px-3 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-fluid"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="w-[42px] h-[42px] rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-fluid"
                  aria-label="إرسال"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
                </button>
              </form>
              <p className="text-[9px] text-muted-foreground/70 text-center mt-2">
                مدعوم بالذكاء الاصطناعي • يدعم رفع الصور والسحب والإفلات واللصق
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AICoach;
