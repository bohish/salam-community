هدف: ربط "مدرب futmac الذكي" بـ OpenAI عبر Edge Function آمن، مع إبقاء `OPENAI_API_KEY` على الخادم فقط، والاحتفاظ بواجهة الشات الحالية دون تغيير بصري.

## 1. تجهيز السر
- التحقق من وجود `OPENAI_API_KEY` في أسرار المشروع (غير موجود حالياً حسب `fetch_secrets`).
- طلبه من المستخدم عبر `add_secret` باسم `OPENAI_API_KEY` مع تلميح `sk-...`.

## 2. إنشاء Edge Function جديد: `supabase/functions/ai-coach/index.ts`
- CORS كامل (OPTIONS + headers في كل الردود) بنفس نمط `futgg-proxy`.
- `verify_jwt = false` افتراضياً (لا يحتاج تسجيل دخول لاستخدام المدرب).
- المدخلات: `{ messages: {role, content}[] }` مع تحقق Zod بسيط (طول الرسائل، حد أقصى للتاريخ ~20 رسالة).
- يبني `messages` مع system prompt عربي متخصص في FIFA/EA FC 26 (بناء تشكيلة، تحليل، مقارنة، ترقيات).
- يستدعي `https://api.openai.com/v1/chat/completions`:
  - `model: gpt-4o-mini` (توازن سرعة/جودة/تكلفة، مناسب لمساعد شات).
  - `temperature: 0.7`, `max_tokens: 700`.
  - `Authorization: Bearer ${OPENAI_API_KEY}` من `Deno.env`.
- معالجة الأخطاء: 401 (مفتاح خاطئ) → 500 مع رسالة واضحة، 429 → 429، غير ذلك → 502.
- يُرجع `{ reply: string }`.

## 3. تحديث طبقة الخدمة: `src/services/aiCoach.ts`
- استبدال `mockReply` + `simulatedLatency` بنداء حقيقي:
  - `supabase.functions.invoke("ai-coach", { body: { messages }, signal })`.
  - تحويل `history + userPrompt` إلى مصفوفة `{role, content}` قبل الإرسال.
  - إرجاع `data.reply`.
- الحفاظ على نفس التوقيع (`sendCoachMessage(history, userPrompt, context, signal)`) حتى لا يتغير `AICoach.tsx`.
- الاحتفاظ بـ `SUGGESTED_PROMPTS` و `createMessage` كما هي.
- إزالة كل منطق الـ mock والتعليقات التي تشير إلى المستقبل.

## 4. تحديث نص الواجهة الصغير في `AICoach.tsx`
- تغيير سطر التذييل من "إجابات تجريبية · سيتم ربط الذكاء الاصطناعي الحقيقي قريباً" إلى "مدعوم بالذكاء الاصطناعي".
- لا تغييرات أخرى على UI/UX.

## 5. الاختبار
- نشر الفانكشن عبر `deploy_edge_functions(["ai-coach"])`.
- اختبار عبر `curl_edge_functions` برسالة عربية تجريبية والتأكد من رد نصي سليم.
- التأكد من عدم ظهور المفتاح في أي ملف frontend.

## ملاحظات
- المفتاح يبقى في `Deno.env` فقط؛ لا `VITE_` ولا تسريب للمتصفح.
- سجل المحادثة يُرسَل في كل طلب (OpenAI stateless) — سبق أن اختار المستخدم عدم حفظ تاريخ في قاعدة البيانات، لذا يبقى in-session فقط كما هو الآن.
- الحفاظ على `AbortController` الحالي عبر تمرير `signal` إلى `functions.invoke`.