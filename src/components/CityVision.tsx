const PROMPT =
  'It should be a safe place, where families of diverse incomes can live. They should be able to get ' +
  'around easily and have access to standard public resources. In particular, citizens of all variety ' +
  'should have the opportunity to be educated, entertained, and enlightened.'

export function CityVision() {
  return (
    <details className="city-vision card">
      <summary>City Vision (the professor&apos;s prompt)</summary>
      <p className="story-sentence">&ldquo;{PROMPT}&rdquo;</p>
    </details>
  )
}
