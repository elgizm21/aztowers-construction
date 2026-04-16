# Deploy

Bu layihəni Node server kimi deploy etmək lazımdır. Səbəb: sayt statik görünsə də,
`/api/contact` endpoint-i form müraciətlərini qəbul edir.

## Render ilə deploy

1. Layihəni GitHub repository-yə göndərin.
2. Render dashboard-da `New` -> `Web Service` seçin.
3. Repository-ni qoşun.
4. Render `render.yaml` faylını oxuyacaq və start komandası kimi `npm start` istifadə edəcək.
5. Telegram bot sonra qurulacaqsa, hələlik `TELEGRAM_BOT_TOKEN` və `TELEGRAM_CHAT_ID` boş qala bilər.

## Manual ayarlar

Əgər Render blueprint istifadə etmirsinizsə:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `HOST=0.0.0.0`

Telegram hazır olanda əlavə edin:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Lokal run

```bash
npm start
```

Lokalda `http://127.0.0.1:4173` açılır. Deploy-da isə platformanın verdiyi URL açılacaq.
