const STEPS = [
  { title: '1. Write', body: 'Create user stories. As soon as you’ve written one, ordering and estimating unlock.' },
  { title: '2. Order & Estimate', body: 'Drag the backlog into your own priority order and pick story points — at your own pace, privately.' },
  { title: '3. Validate', body: 'Once your order and every estimate are set, validate them. Everyone sees who’s done; Leo reveals the team result once everyone has.' },
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
