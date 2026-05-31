import { getHaircutTracker, getMockMatches, getMockNews } from '../server/mockData'

const withLatency = (payload) => new Promise((resolve) => setTimeout(() => resolve(payload), 120))

export const fetchDashboardData = async () => {
  const matches = getMockMatches()

  return withLatency({
    liveMatches: matches.filter((match) => match.status === 'Live'),
    upcomingMatches: matches.slice(0, 10),
    news: getMockNews(),
    haircutTracker: getHaircutTracker(),
  })
}
