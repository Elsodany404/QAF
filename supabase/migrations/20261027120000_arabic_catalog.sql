-- Arabic text for the catalog, shown on the Arabic pages (/ar/...). It is
-- optional: a product, option or value without it shows its English text.
-- The anon/authenticated table grants cover the new columns.

ALTER TABLE public."Product"
  ADD COLUMN IF NOT EXISTS "nameAr" text,
  ADD COLUMN IF NOT EXISTS "descriptionAr" text;

ALTER TABLE public."Options"
  ADD COLUMN IF NOT EXISTS "nameAr" text,
  ADD COLUMN IF NOT EXISTS "descriptionAr" text;

ALTER TABLE public."OptionValues"
  ADD COLUMN IF NOT EXISTS "labelAr" text;

-- Translations of the catalog as it is today, matched by the English text so
-- rows that were renamed (or don't exist, e.g. locally) are left alone.
-- Turkish blends keep the "Turkish Coffee | <Blend>" shape: product cards
-- badge the part after the "|".

UPDATE public."Product" AS p
SET "nameAr" = t.name_ar,
    "descriptionAr" = t.description_ar
FROM (VALUES
  (
    'Turkish Coffee | Golden Blend',
    'قهوة تركي | الخلطة الذهبية',
    'التوازن المثالي بين الجودة والقيمة. محضّرة من حبوب قهوة مختارة بعناية، لتمنحك رائحة غنية وقوامًا ناعمًا ونكهة قهوة تركي أصيلة. محمّصة باحتراف لفنجان يرضيك كل يوم.'
  ),
  (
    'Hazelnut Coffee',
    'قهوة بالبندق',
    'حبوب أو مطحون قهوة مُنكّه بنكهات البندق الطبيعية أو زيوته أو شرابه. تمنحك رائحة دافئة مريحة وحلاوة ناعمة بطعم المكسرات توازن مرارة القهوة الطبيعية.'
  ),
  (
    'French Coffee',
    'قهوة فرنساوي',
    'قهوة فرنساوي: قهوة محضّرة بالحليب البودرة لتمنحك قوامًا غنيًا وكثيفًا ومُرضيًا. تتميز بمذاق ناعم وكريمي مع حلاوة متوازنة وحموضة أقل، لفنجان ناعم بشكل استثنائي.'
  ),
  (
    'Espresso',
    'إسبريسو',
    'جرعة قهوة شديدة التركيز تُحضّر بتمرير الماء الساخن تحت ضغط عالٍ عبر قهوة مطحونة ناعمة ومضغوطة بإحكام. تشتهر بنكهتها الغنية المركّبة وطبقة الكريما المخملية الذهبية على سطحها.'
  ),
  (
    'American Coffee',
    'قهوة أمريكي',
    'فنجان كلاسيكي بسيط يُحضّر كقهوة فلتر بالتقطير، أو بتخفيف جرعة إسبريسو بالماء الساخن (أمريكانو). يقدّم نكهة صافية ومتوازنة وقوامًا خفيفًا سهل الشرب.'
  ),
  (
    'Arabic Coffee',
    'قهوة عربي',
    'قهوة عطرية محمّصة تحميصًا خفيفًا، متبّلة بالحبهان وتُحضّر مع الزعفران أو القرنفل أو ماء الورد. تُقدّم دون تصفية في فناجين صغيرة، بلون ذهبي ونكهة عطرية عشبية فريدة.'
  ),
  (
    'Green Coffee',
    'قهوة خضراء',
    'تُحضّر من حبوب قهوة خام غير محمّصة، فيشبه طعمها الشاي العشبي أكثر من القهوة التقليدية. تتميز بنكهة منعشة عشبية، ويقدّرها كثيرون لغناها بمضادات الأكسدة.'
  ),
  (
    'Turkish Coffee | QAF Blend',
    'قهوة تركي | خلطة قاف',
    'أفضل خلطات القهوة التركي لدينا، تجمع بين البن اليمني الفاخر ونسبة مختارة بعناية من الأرابيكا، لرائحة غنية وقوام ناعم ومذاق تقليدي أصيل.'
  ),
  (
    'Turkish Coffee | Colombian Blend',
    'قهوة تركي | الخلطة الكولومبية',
    'محضّرة من حبوب قهوة كولومبية وبرازيلية وحبشية فاخرة، لتقدّم فنجانًا ناعمًا ومتوازنًا برائحة غنية وقوام متوسط ونكهة راقية.'
  )
) AS t(name, name_ar, description_ar)
WHERE p.name = t.name
  AND p."nameAr" IS NULL;

UPDATE public."Options" AS o
SET "nameAr" = t.name_ar,
    "descriptionAr" = t.description_ar
FROM (VALUES
  ('Size', 'الحجم', 'اختر حجم العبوة المناسب لأسلوب حياتك وروتين قهوتك.'),
  ('Roast', 'درجة التحميص', 'من الناعم المنعش إلى القوي المدخّن.'),
  (
    'Percentage of Arabica',
    'نسبة الأرابيكا',
    'اختر نسبة الأرابيكا لرائحة أقوى وحلاوة ناعمة ونكهات راقية.'
  ),
  ('Hazelnut Grind', 'طحنة البندق', 'ناعمة كالحرير أو مجروشة لترتقي بفنجان الصباح.'),
  (
    'Grind',
    'نوع الطحن',
    'احتفظ بالرائحة كاملة مع حبوب الإسبريسو الكاملة، أو اخترها مطحونة جاهزة للتحضير.'
  ),
  ('Blend', 'التحويج', 'تُمزج مع حبوب القهوة وتُعطّر بالحبهان الطبيعي.')
) AS t(name, name_ar, description_ar)
WHERE o.name = t.name
  AND o."nameAr" IS NULL;

UPDATE public."OptionValues" AS v
SET "labelAr" = t.label_ar
FROM public."Options" AS o,
  (VALUES
    ('Size', '50g', '50 جم'),
    ('Size', '100g', '100 جم'),
    ('Size', '250g', '250 جم'),
    ('Size', '500g', '500 جم'),
    ('Roast', 'Light', 'فاتح'),
    ('Roast', 'Medium', 'وسط'),
    ('Roast', 'Dark', 'غامق'),
    ('Percentage of Arabica', '70% Arabica', '70% أرابيكا'),
    ('Percentage of Arabica', '80% Arabica', '80% أرابيكا'),
    ('Percentage of Arabica', '100% Arabica', '100% أرابيكا'),
    ('Hazelnut Grind', 'Smooth ground hazelnut', 'بندق مطحون ناعم'),
    ('Hazelnut Grind', 'Crunchy ground hazelnut', 'بندق مجروش'),
    ('Grind', 'Whole espresso beans', 'حبوب إسبريسو كاملة'),
    ('Grind', 'Ground espresso beans', 'إسبريسو مطحون'),
    ('Blend', 'Plain', 'سادة'),
    ('Blend', 'Blended', 'محوّج')
  ) AS t(option_name, label, label_ar)
WHERE v."optionID" = o.id
  AND o.name = t.option_name
  AND v.label = t.label
  AND v."labelAr" IS NULL;
