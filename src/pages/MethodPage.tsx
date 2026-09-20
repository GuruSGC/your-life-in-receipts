import { DataGate } from '@/shared/components/DataGate'
import { PageTitle } from '@/shared/components/PageTitle'
import { formatNumber } from '@/shared/utils/format'

const STEPS = [
  {
    title: 'Sessions',
    text: 'Plays that follow each other within 30 minutes are grouped into one listening session. A session is the unit that can meet a purchase on the same day.',
  },
  {
    title: 'Chapters',
    text: 'The timeline is cut wherever the household ledger or the card statement begins or ends. Each stretch is then split where monthly listening changes level the most (the split that leaves the least spread inside each side, at least six months apiece), until there are seven chapters.',
  },
  {
    title: 'Who you were',
    text: 'A chapter is named after the trait that sets it furthest from the whole timeline: night listening, one artist dominating, a burst of new artists, a very loud or very quiet stretch, or a busy forward button. Neighbouring chapters never share a name.',
  },
  {
    title: 'Connections',
    text: 'For each of the fifteen most played artists and each kind of spending, the app compares how often the artist plays on days with that spending against how often the artist plays on any day in the same period. Pairs with at least 8 shared days and a rate at least a quarter above or below normal are kept.',
  },
  {
    title: 'Insights',
    text: 'Every number in a finding is computed from the receipts. Each finding lists the days it was found on, and each of those days opens the receipts recorded on it.',
  },
]

const LIMITS = [
  'The three sources are treated as one fictional life. Nothing in the files says they belong to the same person.',
  'Times are shown exactly as recorded. The listening export is in UTC, so "night" means night on that clock.',
  'A connection is a co-occurrence, not a cause. Busy days have more of everything, so each rate is compared with all days.',
  'Amounts are read as rupees. Money that moved through savings, investments and transfers is kept out of "everyday spending".',
  'The card statement has coordinates that do not match its cities, so no map is drawn.',
]

export default function MethodPage() {
  return (
    <DataGate>
      {({ life }) => (
        <>
          <PageTitle kicker="The fine print">How this was made, and what was left alone</PageTitle>
          <section aria-labelledby="clean-title">
            <h2 id="clean-title" className="text-xl">
              What the data looked like
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {life.quality.map((source) => (
                <article key={source.label} className="paper p-5">
                  <h3 className="text-lg">{source.label}</h3>
                  <p className="mono mt-1 text-sm text-accent">
                    {formatNumber(source.rows)} rows read, {formatNumber(source.kept)} kept
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.95rem] text-ink-2">
                    {source.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10" aria-labelledby="steps-title">
            <h2 id="steps-title" className="text-xl">
              How the story is found
            </h2>
            <ol className="mt-3 grid gap-3 md:grid-cols-2">
              {STEPS.map((step, index) => (
                <li key={step.title} className="paper flex gap-4 p-5">
                  <span className="mono grid size-9 shrink-0 place-items-center rounded-full border border-accent font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg">{step.title}</h3>
                    <p className="mt-1 text-[0.95rem] text-ink-2">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10" aria-labelledby="limits-title">
            <h2 id="limits-title" className="text-xl">
              Limits worth knowing
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-2">
              {LIMITS.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </DataGate>
  )
}
