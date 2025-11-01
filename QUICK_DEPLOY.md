# 🚀 نشر سريع - Quick Deploy

## الطريقة الأسرع (دقيقة واحدة)

### 1. افتح Terminal وقم بتشغيل:

```bash
./deploy.sh
```

أو يدوياً:

```bash
npx vercel --prod
```

### 2. اتبع التعليمات:
- سجل الدخول إلى Vercel (إذا لم تكن مسجلاً)
- اقبل الإعدادات الافتراضية
- انتظر اكتمال النشر

### 3. ستحصل على:
```
✅ Production: https://your-project.vercel.app
```

## إعداد متغيرات البيئة

بعد أول نشر، أضف متغيرات Supabase:

### عبر Vercel Dashboard:
1. افتح مشروعك في Vercel
2. اذهب إلى Settings → Environment Variables
3. أضف:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### أو عبر CLI:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

ثم أعد النشر:
```bash
vercel --prod
```

## حالة المشروع الحالية

✅ **Build Successful** - المشروع جاهز تماماً للنشر!
- Dependencies installed
- Build completed successfully  
- No build errors
- Configuration files ready

## روابط للنشر السريع

### نشر بنقرة واحدة:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ipeapp/ipe-attendance-and-absence-app)

### أدلة أخرى:
- 📖 [دليل النشر الكامل](./DEPLOYMENT_GUIDE.md)
- ⚙️ [دليل الإعداد](./SETUP_GUIDE.md)
- 📚 [README](./README.md)

---

**جاهز للنشر الآن! 🎉**
