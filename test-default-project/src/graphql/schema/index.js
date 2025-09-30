import { gql } from 'apollo-server-express';
import { userTypeDefs } from './types/user';

export const typeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

export const resolvers = {
  Query: {
    _empty: () => null
  },
  Mutation: {
    _empty: () => null
  },
  Subscription: {
    _empty: () => null
  }
};

// Merge all type definitions
export const mergedTypeDefs = [
  typeDefs,
  userTypeDefs
];

export const mergedResolvers = {
  ...resolvers,
  // Add other resolvers here
};