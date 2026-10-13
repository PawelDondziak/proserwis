import { useId } from 'react'
import { ArrowRight } from 'lucide-react'
import { serviceCoverage as coverage } from '../config/serviceCoverage'

export default function ServiceCoverage() {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const clipId = `${id}-region`
  const hatchId = `${id}-hatch`
  const { geography, attribution } = coverage
  const polygon = coverage.coveragePolygon.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <section className="section coverage-section" id="zasieg" aria-labelledby={`${id}-heading`}>
      <div className="container coverage-grid">
        <div className="coverage-copy">
          <div className="section-heading">
            <p className="eyebrow">{coverage.eyebrow}</p>
            <h2 id={`${id}-heading`}>{coverage.heading}</h2>
            <p className="section-intro">{coverage.description}</p>
          </div>
          <p className="coverage-note">{coverage.note}</p>
          <a className="button" href={coverage.contactHref}>
            {coverage.cta} <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
        <figure className="coverage-map">
          <figcaption className="coverage-map-caption">
            <strong>{coverage.caption}</strong>
            <span>{coverage.regionLabel}</span>
          </figcaption>
          <svg
            className="coverage-map-svg"
            viewBox={geography.viewBox}
            role="img"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <title id={titleId}>{coverage.caption} — {coverage.regionLabel}</title>
            <desc id={descriptionId}>{coverage.accessibleDescription}</desc>
            <defs>
              <clipPath id={clipId}>
                <path d={geography.outlinePath} />
              </clipPath>
              <pattern id={hatchId} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <path d="M0 0V10" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
              </pattern>
            </defs>
            <path className="coverage-region" d={geography.outlinePath} />
            <g clipPath={`url(#${clipId})`}>
              <polygon
                className="coverage-area"
                points={polygon}
                aria-label={coverage.coverageLabel}
              >
                <title>{coverage.coverageLabel}</title>
              </polygon>
              <polygon points={polygon} fill={`url(#${hatchId})`} />
            </g>
            <path className="coverage-region-border" d={geography.outlinePath} />
            <g className="coverage-north" transform="translate(542 46)" aria-hidden="true">
              <path d="M0 32V0M-5 8L0 0L5 8" />
              <text x="0" y="51" textAnchor="middle">{coverage.northLabel}</text>
            </g>
            <g transform={`translate(${geography.gdansk.x} ${geography.gdansk.y})`} aria-label={coverage.gdanskDescription}>
              <title>{coverage.gdanskDescription}</title>
              <circle className="coverage-marker-halo" r="15" />
              <circle className="coverage-marker" r="7" />
              <text className="coverage-city-label" x="23" y="6">{coverage.gdanskLabel}</text>
            </g>
          </svg>
          <ul className="coverage-legend" aria-label={coverage.legendLabel}>
            <li><span className="coverage-swatch coverage-swatch-area" aria-hidden="true" />{coverage.coverageLabel}</li>
          </ul>
          <p className="coverage-disclaimer">{coverage.disclaimer}</p>
          <p className="coverage-attribution">
            <a href={attribution.href}>{attribution.label}</a>
            {' · '}<a href={attribution.licenseHref}>{attribution.licenseLabel}</a>
            {' · '}<a href={attribution.dataHref} download>{attribution.dataLabel}</a>
          </p>
        </figure>
      </div>
    </section>
  )
}
