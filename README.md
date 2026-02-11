# Вишлист — фронтенд

React-приложение для списков желаний. Работает с **бэкендом на Go** (репозиторий `socialBack`).

## Стек

- React 19, TypeScript, Vite, React Router

## Подключение к бэкенду

1. Запустите бэкенд (из каталога `socialBack`):
   ```bash
   docker compose up --build
   ```
   Бэкенд будет доступен на **http://localhost:8081**.

2. В корне фронта создайте `.env` (или скопируйте из `.env.example`):
   ```
   VITE_API_URL=http://localhost:8081
   ```

3. Запуск фронта:
   ```bash
   npm install
   npm run dev
   ```
   Откройте **http://localhost:5173**. Запросы уйдут на бэкенд; авторизация по cookie (JWT).

4. CORS: бэкенд по умолчанию разрешает origin `http://localhost:5173`. Для другого порта или домена задайте в бэкенде переменную `CORS_ORIGIN`.

## Сборка

```bash
npm run build
```

Статика в `dist/`. Для продакшена задайте `VITE_API_URL` на URL вашего бэкенда.
# GiftTackerFront
