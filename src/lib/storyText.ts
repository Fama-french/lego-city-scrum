/** Builds the canonical "As a X, I want Y, so that Z." sentence from the three fields. */
export function buildFullStory(actor: string, want: string, benefit: string): string {
  const a = actor.trim().replace(/\.$/, '')
  const w = want.trim().replace(/\.$/, '')
  const b = benefit.trim().replace(/\.$/, '')
  return `As a ${a}, I want ${w}, so that ${b}.`
}
