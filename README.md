# Doctor's Credit

Vite + React + Tailwind site with a language selector (EN / ES / HI) and a floating "Chat on WhatsApp" button.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this folder to a new GitHub repo and import it in Vercel (preset: Vite; `vercel.json` already sets build and output).
2. **Add the environment variable `VITE_WHATSAPP_NUMBER`** (Project Settings > Environment Variables) before deploying.
   - International format, digits only, no `+` or spaces. India example: `919876543210`.
   - Without it, production builds hide the WhatsApp button on purpose, so visitors are never sent to the placeholder number `1234567890`. The placeholder is only used in local dev.
   - It is read at build time, so redeploy after changing it.

## Where things are

| What | File |
| --- | --- |
| Language list and storage key | `src/lib/i18n/config.ts` |
| All translated copy (incl. the WhatsApp greeting) | `src/lib/i18n/messages.ts` |
| Language state (context + localStorage) | `src/components/LanguageProvider.tsx` |
| Language picker in the top bar | `src/components/LanguageSelector.tsx` |
| WhatsApp link builder and number handling | `src/lib/whatsapp.ts` |
| Floating WhatsApp button | `src/components/WhatsAppFab.tsx` |

To add a language, add it to `LANGUAGES` in `config.ts` and a matching object in `messages.ts` (TypeScript will flag missing keys).
