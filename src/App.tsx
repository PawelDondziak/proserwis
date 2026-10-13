import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  Monitor,
  Phone,
  Plug,
  Volume2,
  X,
} from 'lucide-react'
import { company } from './config/company'
import AttachmentUploader from './components/AttachmentUploader'
import ServiceCoverage from './components/ServiceCoverage'
import { submitRepairRequest, type RepairRequest } from './services/repairRequests'
import {
  MAX_PHOTOS,
  MAX_PHOTO_SIZE,
  MAX_PHOTOS_SIZE,
  MAX_TOTAL_SIZE,
  MAX_VIDEO_HEIGHT,
  MAX_VIDEO_SIZE,
  MAX_VIDEO_WIDTH,
  isVideoDurationAllowed,
  type RepairAttachments,
} from './utils/attachments'

const problemCards = [
  {
    title: 'Telewizor nie włącza się',
    description: 'Urządzenie nie reaguje na przycisk zasilania lub nie uruchamia się prawidłowo.',
    Icon: Plug,
  },
  {
    title: 'Brak obrazu',
    description: 'Ekran pozostaje czarny, chociaż telewizor jest włączony.',
    Icon: Monitor,
  },
  {
    title: 'Problem z dźwiękiem',
    description: 'Dźwięk zanika, jest zniekształcony albo nie ma go wcale.',
    Icon: Volume2,
  },
  {
    title: 'Inne usterki',
    description: 'Opisz, co zauważasz — wspólnie ustalimy, co dalej.',
    Icon: ArrowRight,
  },
]

const repairSteps = [
  {
    number: '01',
    title: 'Opisz usterkę',
    description: 'Wypełnij krótki formularz i podaj dane potrzebne do kontaktu.',
  },
  {
    number: '02',
    title: 'Skontaktujemy się z Tobą',
    description: 'Dopytamy o problem i omówimy dalsze postępowanie.',
  },
  {
    number: '03',
    title: 'Ustalimy dalsze kroki',
    description: 'Przekażemy informacje dotyczące diagnostyki i dalszej obsługi urządzenia.',
  },
]

const issueOptions = [
  'Brak obrazu',
  'Telewizor nie włącza się',
  'Problem z dźwiękiem',
  'Uszkodzony ekran',
  'Problem z obrazem',
  'Inna usterka',
]

type FormValues = {
  name: string
  phone: string
  email: string
  brand: string
  model: string
  issue: string
  description: string
  website: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const emptyValues: FormValues = {
  name: '',
  phone: '',
  email: '',
  brand: '',
  model: '',
  issue: '',
  description: '',
  website: '',
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const phoneDigits = values.phone.replace(/\D/g, '')

  if (values.name.trim().length < 2) errors.name = 'Podaj imię.'
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phone = 'Podaj prawidłowy numer telefonu (od 9 do 15 cyfr).'
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Podaj prawidłowy adres e-mail.'
  }
  if (!values.issue) errors.issue = 'Wybierz rodzaj usterki.'

  return errors
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#start" aria-label="PROSERWIS — strona główna" onClick={closeMenu}>
          <img src="/images/proserwis-logo.svg" alt="PROSERWIS — serwis telewizorów" width="2008" height="783" />
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="main-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Nawigacja główna">
          <a href="#start" onClick={closeMenu}>Strona główna</a>
          <a href="#naprawa" onClick={closeMenu}>Naprawa telewizorów</a>
          <a href="#o-firmie" onClick={closeMenu}>O firmie</a>
          <a href="#kontakt" onClick={closeMenu}>Kontakt</a>
          <a className="button button-small nav-cta" href="#zgloszenie" onClick={closeMenu}>Zgłoś usterkę</a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="start">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> PROSERWIS <span>•</span> SERWIS TELEWIZORÓW <span>•</span> GDAŃSK</p>
          <h1>Twój telewizor nie działa? <span>Zajmiemy się tym.</span></h1>
          <p className="hero-description">
            Obraz zniknął, ekran nie chce się włączyć, a może telewizor ma dźwięk, ale nie wyświetla obrazu?
            Opisz problem, a skontaktujemy się z Tobą, żeby ustalić dalsze kroki.
          </p>
          <div className="hero-actions">
            <a className="button" href="#zgloszenie">Zgłoś usterkę telewizora <ArrowRight size={18} /></a>
            <a className="button button-outline" href={`tel:${company.phoneHref}`}><Phone size={17} /> Zadzwoń do serwisu</a>
          </div>
          <a className="hero-scroll" href="#naprawa"><span>Sprawdź, jak pomagamy</span><ArrowDown size={15} /></a>
        </div>
        <div className="hero-art" aria-label="Ilustracja telewizora" role="img">
          <div className="art-glow" />
          <div className="art-caption"><span className="caption-line" /> SERWIS TELEWIZORÓW <span>GDAŃSK</span></div>
          <div className="television">
            <div className="tv-screen">
              <div className="screen-shape screen-shape-one" />
              <div className="screen-shape screen-shape-two" />
              <div className="screen-sheen" />
            </div>
            <div className="tv-frame">
              <span className="tv-indicator" />
            </div>
            <div className="tv-stand"><span /><span /></div>
          </div>
          <div className="art-note"><span className="note-icon"><Check size={15} /></span><span>Opisz usterkę<br /><strong>Porozmawiajmy o rozwiązaniu</strong></span></div>
          <div className="art-index">01 <i /> 03</div>
        </div>
      </div>
    </section>
  )
}

function Problems() {
  return (
    <section className="section problems-section" id="naprawa">
      <div className="container">
        <div className="section-heading section-heading-row">
          <div>
            <p className="eyebrow">W CZYM MOŻEMY POMÓC</p>
            <h2>Co dzieje się z Twoim telewizorem?</h2>
          </div>
          <p className="heading-aside">Każda usterka wygląda inaczej. Opowiedz nam, co się dzieje.</p>
        </div>
        <div className="problem-grid">
          {problemCards.map(({ title, description, Icon }, index) => (
            <a className="problem-card" href="#zgloszenie" key={title}>
              <span className="card-number">0{index + 1}</span>
              <span className="problem-icon"><Icon size={23} strokeWidth={1.7} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="card-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
            </a>
          ))}
        </div>
        <p className="section-footnote">To przykładowe kategorie zgłoszeń — opisz problem, nawet jeśli nie pasuje do żadnej z nich.</p>
      </div>
    </section>
  )
}

function Process() {
  return (
    <section className="section process-section">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">JASNY PLAN DZIAŁANIA</p>
          <h2>Od zgłoszenia do rozwiązania</h2>
          <p className="section-intro">Zaczynamy od rozmowy o problemie i wspólnie ustalamy, co dalej.</p>
        </div>
        <div className="steps-grid">
          {repairSteps.map((step, index) => (
            <article className="step-card" key={step.number}>
              <div className="step-top"><span className="step-number">{step.number}</span>{index < repairSteps.length - 1 && <span className="step-connector" />}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="section about-section" id="o-firmie">
      <div className="container about-grid">
        <div className="about-mark" aria-hidden="true">
          <div className="about-line" />
          <img src="/images/proserwis-logo.svg" alt="" width="2008" height="783" />
          <span>GDAŃSK <i /> SERWIS ELEKTRONIKI</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">POZNAJ NAS</p>
          <h2>Doświadczenie w serwisie elektroniki</h2>
          <p>
            PROSERWIS to firma z Gdańska, której historia jest związana z serwisem sprzętu telewizyjnego i elektronicznego.
            Przez lata działalność obejmowała między innymi urządzenia do odbioru telewizji cyfrowej i satelitarnej oraz
            serwis sprzętu RTV. Dziś chcemy ułatwić klientom kontakt z serwisem i zgłaszanie problemów z telewizorami.
          </p>
          <a className="text-link" href="#kontakt">Poznaj dane kontaktowe <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  )
}

function Field({
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  placeholder,
  required = false,
}: {
  name: keyof FormValues
  label: string
  value: string
  onChange: (name: keyof FormValues, value: string) => void
  error?: string
  type?: string
  autoComplete?: string
  placeholder?: string
  required?: boolean
}) {
  const id = `field-${name}`
  const errorId = `${id}-error`
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}{required && <span className="required-mark"> *</span>}</label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  )
}

function RepairForm() {
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [attachments, setAttachments] = useState<RepairAttachments>({ photos: [], video: null })
  const [attachmentsProcessing, setAttachmentsProcessing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const submitting = status === 'loading'

  const updateAttachments = (nextAttachments: RepairAttachments, processing: boolean) => {
    setAttachments(nextAttachments)
    setAttachmentsProcessing(processing)
    if (status === 'error') {
      setStatus('idle')
      setStatusMessage('')
    }
  }

  const updateValue = (name: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
    if (status === 'error') {
      setStatus('idle')
      setStatusMessage('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    setStatusMessage('')

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstInvalid?.focus()
      return
    }

    if (values.website) {
      setStatus('error')
      setStatusMessage('Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.')
      return
    }

    if (attachmentsProcessing) {
      setStatus('error')
      setStatusMessage('Poczekaj, aż przygotowywanie załączników zostanie zakończone.')
      return
    }

    const photosSize = attachments.photos.reduce((total, photo) => total + photo.file.size, 0)
    const attachmentSize = photosSize + (attachments.video?.file.size ?? 0)
    const invalidAttachments = attachments.photos.length > MAX_PHOTOS
      || attachments.photos.some((photo) => photo.file.size > MAX_PHOTO_SIZE || !['image/webp', 'image/jpeg'].includes(photo.file.type))
      || photosSize > MAX_PHOTOS_SIZE
      || attachmentSize > MAX_TOTAL_SIZE
      || Boolean(attachments.video && (
        attachments.video.file.size > MAX_VIDEO_SIZE
        || !isVideoDurationAllowed(attachments.video.duration)
        || attachments.video.width > MAX_VIDEO_WIDTH
        || attachments.video.height > MAX_VIDEO_HEIGHT
      ))

    if (invalidAttachments) {
      setStatus('error')
      setStatusMessage('Jeden lub więcej załączników nie spełnia wymaganych limitów. Usuń je lub wybierz pliki o mniejszym rozmiarze.')
      return
    }

    if (attachments.photos.length > 0 || attachments.video) {
      setStatus('error')
      setStatusMessage('Załączniki nie zostały wysłane. Formularz będzie mógł je przesłać po skonfigurowaniu wysyłki e-mailowej. Usuń załączniki lub skontaktuj się z serwisem telefonicznie albo e-mailowo.')
      return
    }

    const request: RepairRequest = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      ...(values.email.trim() ? { email: values.email.trim() } : {}),
      ...(values.brand.trim() ? { brand: values.brand.trim() } : {}),
      ...(values.model.trim() ? { model: values.model.trim() } : {}),
      issue: values.issue,
      ...(values.description.trim() ? { description: values.description.trim() } : {}),
    }

    setStatus('loading')
    setStatusMessage('Wysyłanie zgłoszenia…')
    try {
      await submitRepairRequest(request)
      setStatus('success')
      setStatusMessage('Dziękujemy. Zgłoszenie zostało wysłane — skontaktujemy się z Tobą.')
      setValues(emptyValues)
      setErrors({})
      formRef.current?.reset()
    } catch (error) {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Wystąpił błąd. Spróbuj ponownie później.')
    }
  }

  return (
    <section className="section form-section" id="zgloszenie">
      <div className="container form-layout">
        <div className="form-intro">
          <p className="eyebrow">ZGŁOSZENIE SERWISOWE</p>
          <h2>Zgłoś usterkę telewizora</h2>
          <p>Wypełnij formularz, a skontaktujemy się z Tobą, aby omówić problem.</p>
          <a className="form-assurance" href={`tel:${company.phoneHref}`} aria-label={`Zadzwoń do serwisu: ${company.phone}`}>
            <span><Phone size={18} /></span>
            <p>Wolisz porozmawiać?<br /><strong>{company.phone}</strong></p>
          </a>
          <div className="form-note"><span className="note-rule" /> Administratorem danych jest PROSERWIS, NIP {company.nip}. Dane wykorzystujemy do obsługi zgłoszenia i naprawy. <a href="/polityka-prywatnosci.html">Przeczytaj politykę prywatności</a>.</div>
        </div>
        <form className="repair-form" ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <Field name="name" label="Imię" value={values.name} onChange={updateValue} error={errors.name} autoComplete="given-name" placeholder="Jan" required />
            <Field name="phone" label="Numer telefonu" value={values.phone} onChange={updateValue} error={errors.phone} type="tel" autoComplete="tel" placeholder="+48 000 000 000" required />
            <Field name="email" label="Adres e-mail" value={values.email} onChange={updateValue} error={errors.email} type="email" autoComplete="email" placeholder="jan@przyklad.pl" />
            <Field name="brand" label="Marka telewizora" value={values.brand} onChange={updateValue} autoComplete="off" placeholder="np. Samsung" />
            <Field name="model" label="Model telewizora" value={values.model} onChange={updateValue} autoComplete="off" placeholder="Jeśli znasz model" />
            <div className="form-field">
              <label htmlFor="field-issue">Rodzaj usterki<span className="required-mark"> *</span></label>
              <div className="select-wrap">
                <select
                  id="field-issue"
                  name="issue"
                  value={values.issue}
                  required
                  aria-invalid={Boolean(errors.issue)}
                  aria-describedby={errors.issue ? 'field-issue-error' : undefined}
                  onChange={(event) => updateValue('issue', event.target.value)}
                >
                  <option value="">Wybierz z listy</option>
                  {issueOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </div>
              {errors.issue && <span className="field-error" id="field-issue-error">{errors.issue}</span>}
            </div>
            <div className="form-field form-field-wide">
              <label htmlFor="field-description">Opis problemu</label>
              <textarea
                id="field-description"
                name="description"
                rows={4}
                value={values.description}
                placeholder="Opisz, co dzieje się z telewizorem..."
                onChange={(event) => updateValue('description', event.target.value)}
              />
            </div>
          </div>
          <AttachmentUploader onChange={updateAttachments} />
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="field-website">Pozostaw to pole puste</label>
            <input id="field-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => updateValue('website', event.target.value)} />
          </div>
          {statusMessage && (
            <div className={`form-status form-status-${status}`} role={status === 'loading' ? 'status' : 'alert'} aria-live="polite">
              {status === 'success' && <Check size={18} />}
              {statusMessage}
            </div>
          )}
          <div className="form-submit-row">
            <p>Pola oznaczone <span className="required-mark">*</span> są wymagane.</p>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Wysyłanie…' : 'Wyślij zgłoszenie'} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="section contact-section" id="kontakt">
      <div className="container">
        <div className="contact-top">
          <div>
            <p className="eyebrow">POROZMAWIAJMY</p>
            <h2>Skontaktuj się z serwisem</h2>
            <p>Masz pytanie? Wybierz dogodną formę kontaktu.</p>
          </div>
          <a className="button button-light" href="#zgloszenie">Zgłoś usterkę <ArrowRight size={18} /></a>
        </div>
        <div className="contact-details">
          <div className="contact-item"><span className="contact-icon"><Monitor size={19} /></span><div><span className="contact-label">ADRES</span><address>{company.address}</address></div></div>
          <div className="contact-item"><span className="contact-icon"><Phone size={19} /></span><div><span className="contact-label">TELEFON</span><a href={`tel:${company.phoneHref}`}>{company.phone}</a></div></div>
          <div className="contact-item"><span className="contact-icon"><ArrowRight size={19} /></span><div><span className="contact-label">E-MAIL</span><a href={`mailto:${company.email}`}>{company.email}</a></div></div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#start" aria-label="PROSERWIS — strona główna">
              <img src="/images/proserwis-logo.svg" alt="PROSERWIS — serwis telewizorów" width="2008" height="783" />
            </a>
            <p>{company.description} Skontaktuj się z nami w sprawie usterki.</p>
          </div>
          <nav className="footer-column" aria-label="Nawigacja w stopce"><h3>Nawigacja</h3><a href="#start">Strona główna</a><a href="#naprawa">Naprawa telewizorów</a><a href="#o-firmie">O firmie</a><a href="#kontakt">Kontakt</a></nav>
          <div className="footer-column"><h3>Kontakt</h3><a href={`tel:${company.phoneHref}`}>{company.phone}</a><a href={`mailto:${company.email}`}>{company.email}</a><address>{company.address}</address><span>NIP: {company.nip}</span></div>
          <div className="footer-column"><h3>Informacje</h3><a className="footer-legal-note" href="/polityka-prywatnosci.html">Polityka prywatności</a></div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {company.name}. Wszelkie prawa zastrzeżone.</span>
          <a href="#start">Wróć na górę <ArrowDown size={14} aria-hidden="true" /></a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Przejdź do treści</a>
      <Header />
      <main id="main">
        <Hero />
        <Problems />
        <ServiceCoverage />
        <Process />
        <About />
        <RepairForm />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
