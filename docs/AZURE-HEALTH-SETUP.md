# AI health companion: Azure setup and verification

## What this release adds

- `/health-check`: entry point for non-diagnostic skin/hair observations and care planning.
- `/hospitals`: official NABH directory link and provider verification questions; no invented hospital records, affiliation claims or bookings.
- `/medical-tourism`: domestic/international travel preparation checklist, official visa and accreditation sources, existing cost comparison and coordination entry points.
- `/api/analyze-patient`: explicit consent and skin/hair focus validation, fixed medical disclaimer, conservative instructions, rejection of truncated responses and no automatic paid retry.
- Existing 800px / JPEG quality 0.7 compression, request size limits, timeouts and best-effort rate limiting remain.

This is a non-diagnostic companion, not a validated medical device or general disease detector. It does not provide prescriptions or clinical clearance for travel. AI output still requires clinical evaluation before any medical decision.

## Recommended first deployment

Keep the website on its existing host and use Azure OpenAI for inference. Do not migrate the entire platform just to enable AI.

**Database constraint:** `src/lib/repo/index.ts` requires Cloudflare D1 in staging/production and deliberately refuses a JSON fallback. Vercel can serve the stateless AI flow but this does not make the account/payment/coordination database work there. A complete move to Azure App Service would require a new durable repository adapter (for example PostgreSQL), migration and account/payment regression tests. This release does not do that migration.

## Azure setup

1. In https://portal.azure.com select the subscription containing your startup credits. Create a dedicated resource group, for example `rg-carejourney-ai-dev`.
2. Create an Azure OpenAI resource and connect it to a project in https://ai.azure.com. Choose a region with the model and quota you need; check applicable data-processing requirements before using patient data.
3. In Foundry, open **Models + endpoints → Deploy model**. Deploy a vision-capable GPT-4o model if available for your subscription. Choose a deployment name such as `carejourney-vision`. The app needs the **deployment name**, not just the model family. Test text plus a non-sensitive image in the playground first.
4. Copy the Azure OpenAI resource endpoint and a key. Use a resource endpoint like `https://YOUR-RESOURCE.openai.azure.com/`, not a Foundry project URL or the complete chat-completions URL.
5. Configure the following secrets in your host's server environment and redeploy. For Vercel use project environment variables for the intended Preview/Production environment. For Cloudflare use the existing deployment environment's secret configuration. Never expose them through `NEXT_PUBLIC_` variables.

```dotenv
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_KEY=YOUR-SECRET-KEY
AZURE_DEPLOYMENT_NAME=carejourney-vision
AZURE_OPENAI_API_VERSION=2024-10-21
```

The existing implementation uses the dated AzureOpenAI SDK interface. This change keeps that contract. Microsoft also documents a newer v1 API, which is a separate migration: do not append `/openai/v1` to this implementation's endpoint. Choose a deployment supporting image inputs, JSON mode, temperature and `max_tokens`; a different model family can require code changes.

6. Set a small deployment quota and Azure budget alerts. Budgets notify; they are not a hard spending cap. Apply a host/WAF rate limit to POST `/api/analyze-patient` before broad public use. The in-memory limiter is best effort and is not shared between instances. Enable access protection for a private pilot if no durable rate limit is available.
7. Review Azure's processing/abuse-monitoring policy. Do not log request bodies, images or generated reports in observability tools. Never promise zero retention based only on this app not storing an image.

## Windows PowerShell

```powershell
git clone https://github.com/yankeeDamn/doctors-credit.git
Set-Location doctors-credit
git switch feat/health-hub-india-care
npm ci
Copy-Item .env.example .env.local
notepad .env.local
# Set the four Azure values above in .env.local; keep it out of git.
# Direct Next command avoids the existing package script's POSIX PORT syntax.
npx next dev --hostname 127.0.0.1 --port 3100
```

Visit http://127.0.0.1:3100/health-check. Local development uses the existing local repository configuration. Do not set APP_ENV=production without a production database binding.

## Verify before launch

1. Open `/health-check`, select Skin then Hair, upload a non-sensitive test photo, enter context, and accept consent. The analyze button must stay disabled without consent or a photo.
2. Confirm the network payload contains a JPEG data URL, `focus`, and `consent: true`; never a key. Confirm compression displays dimensions no larger than 800px.
3. With correct Azure configuration expect HTTP 200 and a fixed disclaimer. This is a live billable test: run it with your own Azure deployment. Mocked tests do not establish clinical accuracy or a working Azure account.
4. Without secrets expect 503; without consent expect 400; with a remote image URL expect 400; oversized payloads expect 413. Truncated/refused output is rejected and malformed model JSON returns 502.
5. On Android/iOS test camera and gallery separately over HTTPS, including portrait images and invalid files. File-input capture support varies by browser. Test desktop upload too.
6. Open `/hospitals`: verify the official NABH link and care/cost links. This is a verification guide, not an in-app searchable hospital directory.
7. Open `/medical-tourism`: toggle international travel, check/uncheck tasks, verify the progress counter and reset. Reload clears selections; no patient travel details are stored.
8. Review medical wording with a qualified clinician before a public launch. Complete the host rate-limit and privacy review, then test the existing sign-in/payment flows on their actual deployment.

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

In restricted environments where tsx's CLI IPC socket cannot open, run its Node loader directly with the same file list, e.g. `node --import tsx --test src/lib/skin-hair.test.ts src/app/api/analyze-patient/route.test.ts`.

## Troubleshooting

- 503: missing variables, wrong endpoint/key, or deployment name not found. Redeploy after changing secrets.
- 429: application rate limit or Azure quota; allow the window to reset and inspect quota without logging patient data.
- 504: provider timeout; try once later. Automatic retries are disabled to keep within the function time budget.
- 422: refused, filtered or incomplete answer; try an appropriate clearer image. Do not bypass content filtering.
- 502: invalid model JSON, unsupported model parameters or provider failure; inspect only sanitized status/error codes.

## Official references (checked 25 October 2026)

- Vision setup: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/gpt-with-vision
- API lifecycle: https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle
- NABH directory: https://nabh.co/find-a-healthcare-organisation/
- India e-Visa: https://indianvisaonline.gov.in/evisa/
- Medical tourism preparation: https://www.cdc.gov/yellow-book/hcp/health-care-abroad/medical-tourism.html
