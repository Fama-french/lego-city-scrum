const SCALE: { points: number; comparison: string }[] = [
  { points: 1, comparison: 'A house. The baseline unit — about 5-6 bricks, quick to build.' },
  { points: 2, comparison: 'A small shop or bus stop. Still simple, a few more pieces than a house.' },
  { points: 3, comparison: 'An apartment compound — roughly 3x the size of a single house, several units together.' },
  { points: 5, comparison: 'A school or clinic. Multiple sections, needs some planning.' },
  { points: 8, comparison: 'A town hall or fire station. Complex, many parts, needs coordination.' },
  { points: 13, comparison: 'A large landmark or transit hub. Big and uncertain — maybe split it up.' },
  { points: 21, comparison: 'A hospital. The biggest, most complex build in the city.' },
]

export function PointsHelp() {
  return (
    <details className="card">
      <summary>What do the points mean? (?)</summary>
      <p className="hint">
        Points measure relative effort and complexity, not hours. Ask "is this more or less work than that
        other story?" — not "how many minutes will this take?" Use this LEGO-building scale to compare:
      </p>
      <ul>
        {SCALE.map((s) => (
          <li key={s.points}>
            <strong>{s.points}</strong> — {s.comparison}
          </li>
        ))}
      </ul>
    </details>
  )
}
