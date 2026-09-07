const STEPS = [
  { title: '1. Write', body: 'Each person creates three user stories.' },
  { title: '2. Prioritize', body: 'Everyone independently ranks the backlog.' },
  { title: '3. Estimate', body: 'Everyone estimates story points.' },
  { title: '4. Sprint', body: 'Choose work and move it to In Progress.' },
  { title: '5. Demo', body: 'Show the teaching staff what you built.' },
  { title: '6. Retrospective', body: 'Discuss what worked and groom the backlog.' },
]

export function HowItWorks() {
  return (
    <details className="card">
      <summary>How it works</summary>
      <div className="stack" style={{ marginTop: '0.75rem' }}>
        {STEPS.map((step) => (
          <div key={step.title}>
            <strong>{step.title}</strong> — {step.body}
          </div>
        ))}
      </div>
    </details>
  )
}
