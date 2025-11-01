# دليل النشر - Deployment Guide

## خيار 1: النشر التلقائي عبر Vercel (الموصى به)

### الخطوات:

1. **إنشاء حساب Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل الدخول باستخدام GitHub

2. **ربط المشروع**
   - اضغط على "Add New Project"
   - اختر repository: `ipeapp/ipe-attendance-and-absence-app`
   - اضغط "Import"

3. **تكوين متغيرات البيئة**
   في صفحة إعدادات المشروع، أضف المتغيرات التالية:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **النشر**
   - اضغط "Deploy"
   - انتظر اكتمال عملية البناء
   - ستحصل على رابط مثل: `https://your-project.vercel.app`

## خيار 2: النشر عبر GitHub Actions (تلقائي)

تم إضافة ملف `.github/workflows/deploy.yml` للنشر التلقائي.

### إعداد GitHub Secrets:

1. اذهب إلى Settings > Secrets and variables > Actions
2. أضف السرّيات التالية:
   - `VERCEL_TOKEN`: [احصل عليه من Vercel Settings](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: موجود في `.vercel/project.json`
   - `VERCEL_PROJECT_ID`: موجود في `.vercel/project.json`

بعد ذلك، سيتم النشر تلقائياً عند كل push!

## خيار 3: النشر اليدوي عبر CLI

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel --prod
```

## الحصول على معلومات Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. افتح مشروعك
3. اذهب إلى Settings > API
4. انسخ:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## روابط مفيدة

- 📚 [وثائق Vercel](https://vercel.com/docs)
- 🗄️ [وثائق Supabase](https://supabase.com/docs)
- 🚀 [دليل Next.js Deployment](https://nextjs.org/docs/deployment)

---

**تم البناء بنجاح ✅**
المشروع جاهز للنشر!
