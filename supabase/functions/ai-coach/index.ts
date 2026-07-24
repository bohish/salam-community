import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `أنت "مدرب futmac" — مساعد ذكي متخصص في لعبة EA SPORTS FC 26 (فيفا).
- تجاوب دائماً بالعربية الفصحى المبسّطة ما لم يسألك المستخدم بلغة أخرى.
- ساعد في: بناء التشكيلات، تحليل نقاط القوة والضعف، مقارنة اللاعبين، اقتراح ترقيات وأحداث (TOTW/TOTY/SBC/Evolutions)، وشرح الكيمياء وأساليب اللعب (PlayStyles).
- كن مختصراً ومنظماً: استخدم عناوين قصيرة، قوائم نقطية، وأرقام واضحة.
- لا تخترع أسعاراً أو تقييمات دقيقة إذا لم تكن متأكداً؛ أعطِ نطاقات تقديرية ووضّح أنها تقديرية.
- لا تخرج عن مجال FIFA / EA FC / كرة القدم الافتراضية.`;

interface ChatMsg { role: 'user' | 'assistant'; content: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY غير مضبوط في الخادم.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const raw = body?.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return new Response(JSON.stringify({ error: 'messages مطلوب.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed: ChatMsg[] = raw
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (trimmed.length === 0) {
      return new Response(JSON.stringify({ error: 'لا توجد رسائل صالحة.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 700,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenAI error:', res.status, errText);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الطلبات. حاول بعد قليل.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (res.status === 401) {
        return new Response(JSON.stringify({ error: 'مفتاح OpenAI غير صالح.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'فشل الاتصال بالذكاء الاصطناعي.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) {
      return new Response(JSON.stringify({ error: 'رد فارغ من النموذج.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-coach error:', e);
    return new Response(JSON.stringify({ error: 'خطأ غير متوقع في الخادم.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
