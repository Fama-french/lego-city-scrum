const SCALE: { points: number; comparison: string }[] = [
  { points: 1, comparison: 'A single small house. Quick to build, no real head-scratching.' },
  { points: 2, comparison: 'A small shop or bus stop. Still simple, a few more pieces.' },
  { points: 3, comparison: 'A playground or park. Several pieces working together.' },
  { points: 5, comparison: 'A school or clinic. Multiple sections, needs some planning.' },
  { points: 8, comparison: 'A hospital or town hall. Complex, many parts, needs coordination.' },
  { points: 13, comparison: 'A whole city block or landmark. Big and uncertain — maybe split it up.' },
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
