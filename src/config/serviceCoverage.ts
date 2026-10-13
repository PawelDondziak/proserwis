import { pomorskieOutline } from './pomorskieOutline'

type MapPoint = { x: number; y: number }

export const serviceCoverage = {
  eyebrow: 'PROSERWIS • GDAŃSK I OKOLICE',
  heading: 'Gdzie działamy?',
  description: 'Na mapie zaznaczono województwo pomorskie, z Gdańskiem jako punktem odniesienia. Skontaktuj się z nami, aby potwierdzić możliwość obsługi Twojej miejscowości.',
  caption: 'Obszar działania serwisu',
  note: 'Nie masz pewności, czy obsługujemy Twoją okolicę? Zapytaj nas o możliwość realizacji usługi.',
  cta: 'Zapytaj o zasięg usług',
  contactHref: '#kontakt',
  regionLabel: 'Województwo pomorskie',
  coverageLabel: 'Województwo pomorskie — obsługa do potwierdzenia',
  legendLabel: 'Legenda mapy',
  disclaimer: 'Zaznaczenie całego województwa nie oznacza potwierdzonej obsługi wszystkich miejscowości. Możliwość realizacji usługi ustalamy indywidualnie.',
  accessibleDescription: 'Mapa z całym województwem pomorskim zaznaczonym na niebiesko i kreskowaniem. Gdańsk jest głównym punktem odniesienia serwisu. Wyróżnienie regionu nie oznacza obsługi wszystkich miejscowości; możliwość realizacji usługi wymaga potwierdzenia w kontakcie z serwisem.',
  northLabel: 'Północ',
  gdanskLabel: 'Gdańsk',
  gdanskDescription: 'Gdańsk — główny punkt odniesienia serwisu',
  geography: pomorskieOutline,
  // Cover the full viewBox; clipping preserves the verified voivodeship boundary.
  // This regional highlight does not confirm service availability in every town.
  coveragePolygon: [
    { x: 0, y: 0 },
    { x: 600, y: 0 },
    { x: 600, y: 480 },
    { x: 0, y: 480 },
  ] satisfies MapPoint[],
  attribution: {
    label: 'Dane mapy: geoBoundaries / © autorzy OpenStreetMap',
    href: 'https://www.geoboundaries.org/',
    licenseLabel: 'ODbL 1.0',
    licenseHref: 'https://www.openstreetmap.org/copyright',
    dataLabel: 'Pobierz obrys',
    dataHref: '/maps/pomorskie.geojson',
  },
}
