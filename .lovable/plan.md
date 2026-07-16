## المصدر المتوفر
جربت API الآن والنتائج:
- `GET /players/v2/26/?isSpecial=1&page=N` → يرجّع **كل لاعبي الأحداث الخاصة** (البروموات + Icons + Heroes)، مع اسم البروموو في `rarityName` (مثل: `Festival of Football: Path to Glory`, `Glory Hunters`, `Star Performer`…).
- `GET /upgrade-hub/26/?page=N` → أحدث الترقيات (نستخدمه لتبويب "الجديد").
- `GET /players/v2/search/?query=…&game=26` → بحث.
- `GET /evolutions/v2/26/v3/all/?page=N` و `GET /sbc/26/?page=N` → التطويرات و SBCs.
- ❌ لا يوجد endpoint واحد يرجّع "قائمة البروموات". الحل: نستخرجها ديناميكياً من `rarityName` لكل اللاعبين الخاصين.

## الخطة

### 1) `src/services/futggApi.ts`
- إضافة `listSpecialPlayers(page)` = `/players/v2/26/?isSpecial=1&page=…`.
- إضافة `fetchAllSpecial(maxPages=10)`: يجيب أول N صفحات بالتوازي (React Query cache).
- إضافة helper `groupByPromo(players)` يرجع خريطة `{ promoName: FutGgPlayer[] }` + `promoSlug(name)`.

### 2) `src/hooks/useFutgg.ts`
- `useSpecialPlayers(page)` — صفحة واحدة.
- `useAllPromos()` — يجيب 8-10 صفحات ويجمعها في قائمة بروموات مرتبة بأحدث لاعب + العدد.
- `usePlayersByPromo(promoSlug)` — يفلتر النتيجة أعلاه.

### 3) إعادة هيكلة `src/pages/EventsPage.tsx`
تبويبات أعلى الصفحة:
- **البروموات** (افتراضي): شبكة بطاقات لكل بروموو نشط (اسم + عدد اللاعبين + أعلى تقييم + معاينة أول 3 صور). ضغطة → `/event/:slug`.
- **الجديد**: من `upgradeHub` (الحالي).
- **Icons** / **Heroes**: كما هو.
- **Evolutions** / **SBC**: كما هو.

### 4) صفحة تفصيل الحدث — جديدة
`src/pages/EventDetailPage.tsx` على `/event/:slug`:
- Header بلون البروموو + اسمه + العدد.
- Grid كامل بلاعبي هذا الحدث + فرز حسب التقييم/الموقع.
- Breadcrumbs + Skeleton + SEO.

### 5) تحديث `App.tsx`
إضافة `<Route path="/event/:slug" element={<EventDetailPage />} />`.

### 6) `HomePage.tsx`
كاروسيل جديد "أحداث حية" أعلى الصفحة يعرض أول 6 بروموات.

## ما يتضمنه فعلياً
كل الأحداث الجارية في FC 26 (Festival of Football, Path to Glory, Glory Hunters, Star Performer, TOTS/TOTY/TOTW حين تصدر، Icons، Heroes) — بشكل ديناميكي بدون هاردكود، لأن أي بروموو جديد يظهر تلقائياً حين يضيفه FUT.GG.

## للجانب التقني
```text
src/services/futggApi.ts   (+ listSpecialPlayers, groupByPromo, promoSlug)
src/hooks/useFutgg.ts      (+ useSpecialPlayers, useAllPromos, usePlayersByPromo)
src/pages/EventsPage.tsx   (تبويب "البروموات" افتراضي + شبكة بطاقات بروموات)
src/pages/EventDetailPage.tsx  (جديد)
src/App.tsx                (route جديد)
src/pages/HomePage.tsx     (كاروسيل بروموات حية)
```
لا تغييرات على قاعدة البيانات.
