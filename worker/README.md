# Заявки в Telegram

1. В Telegram откройте @BotFather, команда `/newbot`, получите **токен**.
2. Напишите своему боту любое сообщение. Чтобы заявки шли в группу, добавьте бота в неё.
3. Узнайте **chat_id**: откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найдите `"chat":{"id":...}`.
4. Деплой (нужен Node.js):
   ```
   cd worker
   npx wrangler login
   npx wrangler secret put BOT_TOKEN
   npx wrangler secret put CHAT_ID
   # впишите адрес сайта в ALLOWED_ORIGIN в wrangler.toml
   npx wrangler deploy
   ```
5. Скопируйте выданный адрес воркера (`https://olivka-orders.<аккаунт>.workers.dev`) в константу `ORDER_ENDPOINT` в начале скрипта в `index.html`.
