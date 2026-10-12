# PROSERWIS

Polish-language landing page for the PROSERWIS television repair service in Gdańsk. Built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, or preview it with `npm run preview`.

## Repair request API

Set `VITE_REPAIR_REQUESTS_ENDPOINT` in a local `.env` file to the real HTTPS endpoint before enabling request submissions. `.env.example` shows the required setting. If it is unset, the form displays a configuration error and does not claim that a request was sent.

The browser sends a `POST` request with `Content-Type: application/json`. The body contains:

```json
{
  "name": "Jan Kowalski",
  "phone": "+48 000 000 000",
  "email": "jan@example.com",
  "brand": "Samsung",
  "model": "Optional model",
  "issue": "Brak obrazu",
  "description": "Optional description"
}
```

Optional fields are omitted when blank. Return any `2xx` response only after the backend has accepted the request; non-`2xx` responses are shown as errors. The backend must validate all input, apply appropriate spam protection and rate limiting, handle personal data securely, and configure any required CORS policy. The form includes a honeypot field, which is deliberately not sent to the API.

## Before launch

- Configure and test the production repair-request endpoint.
- Publish an approved privacy notice and establish the applicable legal basis and wording before collecting personal information. The form intentionally does not include an unverified consent checkbox.
- Have the business owner confirm the contact details, production domain, and company information in `src/config/company.ts`.
- Confirm the canonical URL and metadata if the production domain changes.
- The founding year is intentionally not published until confirmed. No opening hours, service guarantees, certifications, reviews, ratings, or authorized-service claims have been added.