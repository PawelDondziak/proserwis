# PROSERWIS

Polish-language landing page for the PROSERWIS television repair service in Gdańsk. Built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, or preview it with `npm run preview`.

The browser-tab satellite icon is provided as a 32x32 PNG with a standard `/favicon.ico` fallback. Both assets are in `public/` and are copied into the production build.

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

### Attachments

The current endpoint contract is JSON-only and there is no backend in this repository to receive attachments. Photos are compressed in the browser and videos are transcoded locally to MP4 (H.264/AAC where audio exists), at no more than 854 × 480 and 15 MB. Video input is limited to 100 MB and 30 seconds. Processing uses the browser's WebCodecs support through Mediabunny; video remains on the user's device and is not sent to an external transcoding service. If the device cannot decode or encode the selected media, the form displays an error instead of retaining the oversized original.

The form displays local previews but does not upload or email files. Requests with attachments remain blocked until the intended submission behavior is implemented. The `mediabunny` dependency is licensed under MPL-2.0.

## Before launch

- Configure and test the production repair-request endpoint.
- Publish an approved privacy notice and establish the applicable legal basis and wording before collecting personal information. The form intentionally does not include an unverified consent checkbox.
- The owner confirmed the PROSERWIS name and current address, phone, and email in `src/config/company.ts`. Confirm the production domain separately; no registration numbers have been supplied.
- Confirm the canonical URL and metadata if the production domain changes.
- The founding year is intentionally not published until confirmed. No opening hours, service guarantees, certifications, reviews, ratings, or authorized-service claims have been added.

## Service coverage map

The service coverage section sits between the common television problems and the repair process sections. Its CTA links to the existing `#kontakt` section; the repair form and submission behavior are unchanged.

### Geometry and attribution

The regional outline is the `PL-PM` feature from the simplified [geoBoundaries gbOpen Poland ADM1 dataset](https://github.com/wmgeolab/geoBoundaries/blob/9469f09/releaseData/gbOpen/POL/ADM1/geoBoundaries-POL-ADM1_simplified.geojson), pinned to revision `9469f09`, boundary ID `POL-ADM1-17162690`. The [dataset metadata](https://www.geoboundaries.org/api/current/gbOpen/POL/ADM1/) identifies OpenStreetMap / Wambacher as the source, a represented year of 2017, and **Open Database License 1.0**, not CC BY. Attribution and a license link are visible below the map. The extracted geographic data is distributed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) at `public/maps/pomorskie.geojson`, also downloadable from the section.

The SVG path in `src/config/pomorskieOutline.ts` is generated from that geographic outline using a local equirectangular projection with longitude scaled at the region's midpoint latitude. It retains the source's simplified boundary; it is a geographically grounded regional map, not a cadastral or navigation map. North is up. Gdańsk's city reference point (18.6540233° E, 54.3482907° N) comes from [Wikidata Q1792, P625](https://www.wikidata.org/wiki/Q1792#P625) (CC0); it is not a claim about the workshop's exact location.

To regenerate the assets from the pinned public source, run from the repository root:

```sh
curl -fL 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/POL/ADM1/geoBoundaries-POL-ADM1_simplified.geojson' -o /tmp/proserwis-pol-adm1.geojson
node scripts/generate-coverage-map.mjs /tmp/proserwis-pol-adm1.geojson
```

### Updating the service area

All customer-facing copy, the contact target, marker labels, and the separate `coveragePolygon` are in `src/config/serviceCoverage.ts`. The polygon uses **SVG display coordinates in a 600 × 480 viewBox**, not invented geographic coordinates. It currently covers the entire viewBox and is clipped to the real voivodeship outline, highlighting all of Pomeranian Voivodeship as requested. Change those vertices, or add vertices, to adjust the highlighted layer without changing the component or regional boundary. SVG x increases eastward; y increases southward.

**The highlighted shape is the geographic voivodeship, not an approved service boundary.** Hatching, the legend, the accessible description, and a visible disclaimer clarify that highlighting the whole region does not confirm service in every town. No individual towns are advertised as covered.

Before replacing this regional highlight with a confirmed service polygon, the owner must approve the geographic limits, eligible towns and exclusions, and any conditions on service or collection. If a confirmed geographic polygon is supplied later, project it using the same transformation as the outline, update `coveragePolygon`, and revise the description, disclaimer, legend, and accessible description together. Keep attribution when changing geographic sources.