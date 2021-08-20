import { gql } from '@apollo/client';

// define query
export const QUERY_ME = gql`
  query me {
    me {
      _id
      username
      email
      savedCities {
        name
        image
        healthcare
        taxation
        education
        housing
        costOfLiving
        safety
        environmentalQuality
        economy
        population
        region
      }
    }
  }
`;