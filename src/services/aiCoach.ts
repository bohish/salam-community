// Futmac AI Coach — service layer.
// This file is the single boundary between the chat UI and any AI backend.
// Today it returns mock intelligent responses; later swap `sendCoachMessage`
// to call a Supabase Edge Function that streams from Lovable AI + football tools.

export type CoachRole = "user" | "assistant";

export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
  createdAt: number;
}

export interface CoachContext {
  // Placeholder for future context we may pass to the model
  // (favorite players, current squad, budget, formation, etc.)
  favoriteIds?: number[];
  budget?: number;
  formation?: string;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
  emoji: string;
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "build", label: "ابنِ تشكيلتي", prompt: "ساعدني في بناء تشكيلة قوية 4-3-3 بميزانية متوسطة.", emoji: "🏗️" },
  { id: "analyze", label: "حلّل تشكيلتي", prompt: "حلّل نقاط القوة والضعف في تشكيلتي الحالية.", emoji: "🔍" },
  { id: "compare", label: "قارن لاعبين", prompt: "قارن بين مبابي وهالاند وأيهم أفضل للهجوم.", emoji: "⚖️" },
  { id: "upgrade", label: "اقترح ترقيات", prompt: "ما أفضل الترقيات لتشكيلتي في هذا الأسبوع؟", emoji: "⬆️" },
];

// ---------- Mock intelligence (temporary) ----------

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function mockReply(prompt: string): string {
  const p = prompt.toLowerCase();

  if (/(ابن|build|تشكيل|squad|formation)/i.test(p)) {
    return [
      "**اقتراح تشكيلة 4-3-3 متوازنة** ⚽",
      "",
      "• **الهجوم:** جناح سريع (PAC 90+) + مهاجم قوي بدنياً + صانع ألعاب دقيق التمرير.",
      "• **الوسط:** لاعب ارتكاز دفاعي (DEF 82+)، صانع لعب إبداعي، ولاعب بوكس-تو-بوكس.",
      "• **الدفاع:** ظهيران هجوميان + قلبا دفاع أحدهما سريع والآخر قوي بدنياً.",
      "",
      "💡 نصيحة: ركّز على **الكيمياء** بين الدوري والجنسية قبل التقييم الفردي.",
    ].join("\n");
  }

  if (/(حلل|analyze|analyse|نقاط)/i.test(p)) {
    return [
      "**تحليل سريع للتشكيلة** 📊",
      "",
      "✅ **نقاط القوة:** سرعة عالية في الأطراف، كيمياء ممتازة في الوسط.",
      "⚠️ **نقاط الضعف:** بطء نسبي في قلب الدفاع، وضعف في الكرات الهوائية.",
      "",
      "🎯 **التوصية:** استبدل قلب الدفاع الأبطأ بلاعب PAC 78+ و PHY 85+.",
    ].join("\n");
  }

  if (/(قارن|compare|vs|أفضل)/i.test(p)) {
    return [
      "**مقارنة سريعة** ⚖️",
      "",
      "• **السرعة:** متقاربة، مع أفضلية طفيفة للأصغر سناً.",
      "• **التسديد:** المهاجم الأقوى بدنياً يتفوق في الكرات القريبة.",
      "• **المراوغة:** الجناح صاحب المهارات 5★ هو الأنسب للعب الفردي.",
      "",
      "🏆 **الخلاصة:** الاختيار يعتمد على أسلوبك — اضغط على «مقارنة» في القائمة للحصول على أرقام دقيقة.",
    ].join("\n");
  }

  if (/(ترقي|upgrade|حسّن|حسن|تطوير)/i.test(p)) {
    return [
      "**ترقيات مقترحة لهذا الأسبوع** ⬆️",
      "",
      "1. استبدل ظهيرك الأيمن بخيار TOTW الجديد إن كان ضمن ميزانيتك.",
      "2. رقّي حارس المرمى إلى تقييم 86+ لتحسين ردود الفعل.",
      "3. أضف Evolution للاعب الوسط الحالي لرفع PAS و DRI.",
    ].join("\n");
  }

  return pick([
    "أنا مدربك في futmac ⚽ — أخبرني عن تشكيلتك أو اسم لاعب وسأساعدك.",
    "يمكنني مساعدتك في بناء التشكيلة، تحليلها، أو مقارنة اللاعبين. من أين نبدأ؟",
    "جرّب أحد الاقتراحات في الأعلى، أو اسألني مباشرة عن أي لاعب في FC 26.",
  ]);
}

// Simulate a streaming/typing latency proportional to length.
function simulatedLatency(text: string) {
  return Math.min(1800, 500 + text.length * 8);
}

/**
 * Send a message to the AI coach.
 *
 * FUTURE: replace this body with:
 *   const { data } = await supabase.functions.invoke("ai-coach", {
 *     body: { messages, context },
 *   });
 *   return data.reply;
 *
 * The signature (messages history + context in, assistant text out) is
 * intentionally the same shape a real backend will use.
 */
export async function sendCoachMessage(
  history: CoachMessage[],
  userPrompt: string,
  _context?: CoachContext,
  signal?: AbortSignal,
): Promise<string> {
  const reply = mockReply(userPrompt);
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, simulatedLatency(reply));
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  return reply;
}

export function createMessage(role: CoachRole, content: string): CoachMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
  };
}
