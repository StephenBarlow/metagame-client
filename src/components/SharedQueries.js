import { gql } from '@apollo/client';

const GET_SPORTS_GAMES = gql`
  query GetSportsGames($season: String) {
    sportsGames(season: $season) {
      id
      awayTeam {
        id
        shortName
      }
      homeTeam {
        id
        shortName
      }
      week
      result {
        complete
        awayTeamScore
        homeTeamScore
      }
    }
  }
`;

export { GET_SPORTS_GAMES };
