import { ArtistStreams } from '@/features/rhythms/components/ArtistStreams'
import { Heatmap } from '@/features/rhythms/components/Heatmap'
import { MonthlyJourney } from '@/features/rhythms/components/MonthlyJourney'
import { DataGate } from '@/shared/components/DataGate'
import { PageTitle } from '@/shared/components/PageTitle'

export default function RhythmsPage() {
  return (
    <DataGate>
      {({ life, story }) => (
        <>
          <PageTitle kicker="The shape of the habit">
            When the music plays, and how the year moves
          </PageTitle>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <section className="paper p-5 md:p-6" aria-labelledby="heat-title">
              <h2 id="heat-title" className="text-xl">
                A week, hour by hour
              </h2>
              <p className="mb-3 mt-1 text-ink-2">
                Every one of {life.totals.plays.toLocaleString('en-US')} plays placed by weekday and
                hour. The evenings and the small hours are the brightest; the working day is nearly
                empty.
              </p>
              <Heatmap hours={life.music.hours} />
            </section>
            <section className="paper p-5 md:p-6" aria-labelledby="streams-title">
              <h2 id="streams-title" className="text-xl">
                Who filled each year
              </h2>
              <p className="mb-3 mt-1 text-ink-2">
                The eight most played artists, stacked year by year. Grey is everyone else. Select
                an artist to follow one thread.
              </p>
              <ArtistStreams music={life.music} />
            </section>
          </div>
          <section className="paper mt-6 p-5 md:mt-8 md:p-6" aria-labelledby="journey-title">
            <h2 id="journey-title" className="text-xl">
              Listening against spending, month by month
            </h2>
            <p className="mb-3 mt-1 max-w-3xl text-ink-2">
              The filled area is time spent listening (square-root scale, so quiet months stay
              visible). The orange line is everyday spending, drawn only where a ledger exists. The
              bands are the chapters.
            </p>
            <MonthlyJourney months={story.months} chapters={story.chapters} />
          </section>
        </>
      )}
    </DataGate>
  )
}
