# Вишлист — фронтенд

React-приложение для списков желаний. Поддерживает **Supabase** (рекомендуется) или **бэкенд на Go** (репозиторий `socialBack`).

## Стек

- React 19, TypeScript, Vite, React Router, Supabase (Auth, Postgres, Realtime)

## Вариант 1: Supabase (рекомендуется)

1. Создайте проект в [Supabase](https://supabase.com). В корне фронта создайте `.env` (скопируйте из `.env.example`):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ваш_anon_ключ
   ```
   Ключи: Dashboard → Project Settings → API.

2. Примените миграции (один раз):
   ```bash
   npx supabase link --project-ref ваш-ref   # или через Dashboard → SQL
   npx supabase db push
   ```
   Либо выполните вручную SQL из `supabase/migrations/20250211000000_initial_schema.sql` в SQL Editor.

3. Опционально: Edge Function для автозаполнения по URL:
   ```bash
   supabase functions deploy fetch-meta
   ```

4. Запуск:
   ```bash
   npm install
   npm run dev
   ```
   Откройте **http://localhost:5173**. Авторизация и данные идут через Supabase; обновления списков — через Realtime.

## Вариант 2: Go-бэкенд

1. Запустите бэкенд (из каталога `socialBack`): `docker compose up --build` (порт **8081**).

2. В `.env` задайте только:
   ```
   VITE_API_URL=http://localhost:8081
   ```

3. Запуск фронта: `npm install && npm run dev`. CORS на бэкенде должен разрешать origin фронта.

## Сборка

```bash
npm run build
```

Статика в `dist/`. Для продакшена задайте либо `VITE_SUPABASE_*`, либо `VITE_API_URL`.

## Деплой на Vercel

1. Подключите репозиторий в [Vercel](https://vercel.com) (Import Git Repository).

2. В настройках проекта задайте **Environment Variables**:
   - `VITE_API_URL` — URL продакшен-бэкенда (например `https://api.example.com`)
   - `VITE_SUPABASE_URL` — URL проекта Supabase
   - `VITE_SUPABASE_ANON_KEY` — анонимный ключ Supabase

3. **Build & Development** (обычно подхватывается из `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: Vite

4. Деплой: каждый push в основную ветку создаёт превью или продакшен-деплой.

---

## Фронт на Vercel + бэкенд на Render

Чтобы фронт `https://gift-tacker-front.vercel.app` работал с бэкендом на Render, нужно настроить обе стороны.

### 1. Vercel (фронт)

В проекте Vercel → **Settings** → **Environment Variables** задайте:

| Переменная | Значение | Где взять |
|------------|----------|-----------|
| `VITE_API_URL` | **URL бэкенда на Render** | В Render: сервис бэкенда → вкладка *Info* → **URL** (например `https://your-app.onrender.com`). Без слэша в конце. |
| `VITE_SUPABASE_URL` | URL проекта Supabase | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | anon key | там же |

После сохранения переменных сделайте **Redeploy** (Deployments → … → Redeploy), иначе старая сборка продолжит ходить на `localhost:8081`.

### 2. Render (бэкенд)

CORS на бэкенде должен разрешать origin фронта на Vercel.

В Render: ваш **сервис бэкенда** → **Environment** → добавьте или измените:

| Key | Value |
|-----|--------|
| `CORS_ORIGIN` | `https://gift-tacker-front.vercel.app` |

**Без слэша в конце.** Если указать `https://gift-tacker-front.vercel.app/`, браузер будет ругаться: origin в запросе приходит без слэша, и заголовок должен совпадать точно.

Несколько доменов: **CORS_ORIGIN** на Render можно задать через запятую, например:  
`https://gift-tacker-front.vercel.app,https://gift-tracker-front.vercel.app` — тогда оба варианта будут разрешены (в т.ч. превью-деплои, если добавить их домены).

Сохраните и дождитесь перезапуска сервиса на Render. После этого запросы с Vercel не должны блокироваться CORS.
