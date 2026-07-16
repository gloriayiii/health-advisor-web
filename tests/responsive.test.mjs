import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('components/styles/PatientReview.css', 'utf8')

test('patient review defines phone, tablet, and desktop layout contracts', () => {
  const widths = [
    { name: 'phone', width: 390, pattern: /@media \(max-width: 700px\)/ },
    { name: 'tablet', width: 768, pattern: /@media \(min-width: 701px\) and \(max-width: 1024px\)/ },
    { name: 'desktop', width: 1440, pattern: /\.review-main-content[\s\S]*grid-template-columns: 1fr 1fr/ }
  ]

  for (const viewport of widths) {
    assert.match(css, viewport.pattern, `${viewport.name} (${viewport.width}px) contract missing`)
  }
})
