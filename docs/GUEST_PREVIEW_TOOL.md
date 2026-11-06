# أداة دخول الضيف للمعاينة

هذه الأداة مخصصة لنسخة **Preview** فقط. لا تُفعّل في Production لأنها تنشئ جلسة مؤقتة بلا حساب طالب حقيقي، ولذلك لا تسجل نقاطًا ولا تتيح المجتمع أو المراسلة أو الإشعارات الشخصية.

## الحالة الآمنة في Production

```text
VITE_ENABLE_GUEST_PREVIEW=false
ALLOW_PREVIEW_GUESTS=false
```

الحماية لها قفلان:

1. `VITE_ENABLE_GUEST_PREVIEW`: إظهار زر الضيف في الواجهة.
2. `ALLOW_PREVIEW_GUESTS`: قبول جلسة الضيف في خادم التحديات.

إخفاء الزر وحده ليس حماية كافية؛ يجب إبقاء قفل الخادم مغلقًا أيضًا.

## تشغيل الأداة في Preview

شغّل Workflow التالي:

```text
.github/workflows/deploy-online-challenge-preview.yml
```

هذا المسار يشغّل القفلين، لكنه يسمح بالدخول فقط من نطاقات مشروع المعاينة المسجلة في `PREVIEW_GUEST_ORIGINS`.

## إطفاء الأداة

1. انشر فرع `main` بواسطة Workflow الإنتاج.
2. تأكد أن `VITE_ENABLE_GUEST_PREVIEW=false`.
3. تأكد أن `ALLOW_PREVIEW_GUESTS=false`.
4. تأكد من اختفاء زر **دخول كضيف**.
5. تأكد أن طلبات `Guest` إلى الخادم تحصل على `401 unauthorized`.

## ملفات الأداة

- `src/services/guestPreviewService.ts`: جلسة الضيف.
- `src/components/LoginPage.tsx`: زر الضيف المشروط.
- `src/App.tsx`: تعطيل المجتمع والنقاط والمراسلة للضيف.
- `cloudflare/online-challenge/src/worker.js`: حماية الخادم.
- `.github/workflows/deploy-online-challenge-preview.yml`: تشغيل الضيف في Preview.
- `.github/workflows/deploy-cloudflare.yml`: نشر Production والضيف مطفأ.

## خصائص جلسة الضيف

- تحفظ في `sessionStorage` فقط.
- لا تملك حسابًا في Supabase.
- لا تسجل نقاطًا أو تقدمًا دائمًا.
- لا تعرض المجتمع ولا تسمح بالمراسلة.
- تستخدم لاختبار الواجهة وغرف اللعب فقط.

## قاعدة أمنية

لا تضبط `ALLOW_PREVIEW_GUESTS=true` في Production، ولا تضف نطاق Production إلى `PREVIEW_GUEST_ORIGINS`. استخدم Workflow المعاينة المعزول فقط عند الحاجة إلى اختبار الضيف.
