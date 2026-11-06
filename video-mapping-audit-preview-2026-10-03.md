# تدقيق مطابقة الفيديوهات والمحتوى — 2026-10-03

- السجلات المقروءة: **2933**
- سجلات الفيديو: **533**
- دروس لها فيديوهات: **532**
- دروس بلا فيديو: **1**
- عدم تطابق lesson_id في الفيديوهات: **0**
- تكرارات record_id: **0**

## أعداد المواد
- `biology`: 93 درس؛ الفصول: 1=15, 2=7, 3=19, 4=17, 5=35
- `physics`: 115 درس؛ الفصول: 1=26, 2=25, 3=18, 4=7, 5=7, 6=9, 7=6, 8=11, 9=6
- `chemistry`: 165 درس؛ الفصول: 1=23, 2=22, 3=43, 4=20, 5=25, 6=15, 7=10, 8=7
- `mathematics`: 276 درس؛ الفصول: 1=74, 2=41, 3=57, 4=49, 5=11, 6=44
- `arabic_part1`: 28 درس؛ الفصول: 1=5, 2=5, 3=12, 4=6
- `arabic_part2`: 23 درس؛ الفصول: 1=8, 2=7, 3=8
- `islamic`: 25 درس؛ الفصول: 1=5, 2=5, 3=5, 4=5, 5=5
- `english`: 83 درس؛ الفصول: 1=22, 2=7, 3=11, 4=6, 5=11, 6=7, 7=11, 8=4, 9=4

## الدروس التي لا تملك فيديوهات
- `physics` / فصل 4 / درس 7 — record_id `f8221d0a-94ac-4001-83bd-ffeda01392c1` — lesson_id `irq_physics_grade6_preparatory_ch4_segment7`

## قيم lesson_id غير المتطابقة في ملفات الفيديو
- لا توجد حالات؛ **0**.

## السجلات الشاذة المستبعدة من عدّ الدروس
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_4_1` — chapter=1 lesson=2026 — `07cb31e4-9b70-4c8d-8890-f05bdfd3c0c8`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_5_1` — chapter=1 lesson=2026 — `57d69fd2-c833-4203-80bb-35a22d85f05a`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_2_1` — chapter=1 lesson=2026 — `a3f79f90-99e3-4592-a42d-e0328d276f49`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_3_1` — chapter=1 lesson=2026 — `f94c4332-e003-4d2e-a352-0f6dacff8809`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_6_1` — chapter=1 lesson=2026 — `444c43ea-6491-4d1f-8a5f-83f69fc215bf`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_7_1` — chapter=1 lesson=2026 — `9cc9a1e3-b7de-4cad-992c-30e909b0fce8`
- `arabic_part1` / `ج١ عربي يوتيوب/json_extracted_files_2026-08-04 (1)/fixed_cleaned_file_1_1` — chapter=1 lesson=2026 — `9f3f21e2-525d-412d-8a95-c59e83ef71f5`
- `biology` / `irq_biology_grade6_preparatory_ch1_segment0` — chapter=1 lesson=0 — `e578b8ea-9b8e-4e2e-b1ce-3a3d79dd1db7`
- `english` / `cleaned_json_files/cleaned_file_62_1` — chapter=None lesson=None — `3964a54e-9069-4e77-857b-be5f22692a7b`
- `english` / `cleaned_json_files/cleaned_file_60_1` — chapter=None lesson=None — `7efc5041-01f7-4303-a0ab-36876d0d58a2`
- `english` / `cleaned_json_files/cleaned_file_58_1` — chapter=None lesson=None — `87f17b69-42ae-4620-9a92-b2cf0eb82355`
- `islamic` / `irq_islamic_grade6_preparatory_ch1_segment0` — chapter=1 lesson=0 — `7497aba0-b076-471b-8c2f-ca0854e954df`

## تفسير page_id
- ملفات الفيديو تحتوي `lesson_id` داخل بنية الفيديو ولا تعتمد على `page_id`.
- ملفات MCQ وTF وPH والمنهج تعتمد على `content.pages[*].page_id`، واللاحقة `_mcq` أو `_tf` أو `_ph` تميز النوع.
- الملف الذي لا يحتوي page_id يُعامل كمنهج/محتوى عادي، ولا يجوز استخدام غياب page_id لإسقاط فيديو.

## أحياء الفصل الأول
- سجل الفيديو للدرس 1 يحمل `irq_biology_grade6_preparatory_ch1_segment1` ويحتوي فيديوهات، وسجل الفيديو للدرس 2 يحمل `...segment2` ويحتوي فيديوهات.
- وُجد في المصدر أكثر من سجل curriculum للدرس 1: سجل قديم يحتوي نص الانتشار/عبور المواد، وسجل `biology_ch01_segment01_curriculum` يصف مقارنة التراكيب الخلوية والغشاء والجدار. هذا تعارض مصدر بيانات مستقل عن الفيديو، وسأبقيه واضحاً بدلاً من إخفائه.
- التدقيق الكامل لا يثبت أن درس 1 يجب أن يحتوي موضوع عبور المواد؛ السجل الصحيح للموضوع موجود في الفصل 1/الدرس 2 حسب `segment_topics` المصدرية.

الجدول التفصيلي لكل record_id والعناوين موجود في ملف JSON المرفق.
