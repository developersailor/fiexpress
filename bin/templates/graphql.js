import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateGraphQLSupport(targetRoot, options = {}) {
  const { ts = false, subscriptions = true } = options;
  
  // Apollo Server configuration
  const apolloServer = generateApolloServer(ts, subscriptions);
  writeFileSafe(path.join(targetRoot, "src", "graphql", "apollo.server.js"), apolloServer);
  
  // GraphQL schema
  const schema = generateGraphQLSchema(ts);
  writeFileSafe(path.join(targetRoot, "src", "graphql", "schema", "index.js"), schema);
  
  // Type definitions
  const typeDefs = generateTypeDefs(ts);
  writeFileSafe(path.join(targetRoot, "src", "graphql", "schema", "types", "user.js"), typeDefs);
  
  // Resolvers
  const resolvers = generateResolvers(ts);
  writeFileSafe(path.join(targetRoot, "src", "graphql", "schema", "resolvers", "user.js"), resolvers);
  
  // GraphQL routes
  const graphqlRoutes = generateGraphQLRoutes(ts, subscriptions);
  writeFileSafe(path.join(targetRoot, "src", "routes", "graphql.js"), graphqlRoutes);
  
  // Playground configuration
  const playgroundConfig = generatePlaygroundConfig(ts);
  writeFileSafe(path.join(targetRoot, "src", "graphql", "playground.config.js"), playgroundConfig);
  
  // GraphQL schema file
  const schemaFile = generateSchemaFile();
  writeFileSafe(path.join(targetRoot, "graphql", "schema.graphql"), schemaFile);
  
  // Update package.json with GraphQL dependencies
  updatePackageJsonWithGraphQL(targetRoot, subscriptions);
  
  console.log("🚀 GraphQL support added successfully!");
}

function generateApolloServer(ts, subscriptions) {
  if (ts) {
    return `import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { typeDefs } from './schema';
import { resolvers } from './schema/resolvers';
import { context } from './context';
${subscriptions ? `import { createServer } from 'http';
import express from 'express';` : ''}

export class GraphQLServer {
  private server: ApolloServer;
  private pubsub: PubSub;

  constructor() {
    this.pubsub = new PubSub();
    
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: resolvers(this.pubsub)
    });

    this.server = new ApolloServer({
      schema,
      context: context(this.pubsub),
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: server }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await server.close();
              },
            };
          },
        },
      ],
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production'
    });
  }

  async start(app: express.Application, httpServer?: any) {
    await this.server.start();
    
    if (subscriptions && httpServer) {
      // WebSocket server for subscriptions
      const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
      });

      useServer({
        schema: this.server.schema,
        context: context(this.pubsub)
      }, wsServer);
    }
    
    this.server.applyMiddleware({ app, path: '/graphql' });
    
    console.log('🚀 GraphQL server ready at /graphql');
    if (subscriptions) {
      console.log('🚀 GraphQL subscriptions ready at ws://localhost:4000/graphql');
    }
  }

  getPubSub(): PubSub {
    return this.pubsub;
  }
}

export const graphqlServer = new GraphQLServer();
export default graphqlServer;`;
  } else {
    return `const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');
const { typeDefs } = require('./schema');
const { resolvers } = require('./schema/resolvers');
const { context } = require('./context');
${subscriptions ? `const { createServer } = require('http');
const express = require('express');` : ''}

class GraphQLServer {
  constructor() {
    this.pubsub = new PubSub();
    
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: resolvers(this.pubsub)
    });

    this.server = new ApolloServer({
      schema,
      context: context(this.pubsub),
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: server }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await server.close();
              },
            };
          },
        },
      ],
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production'
    });
  }

  async start(app, httpServer) {
    await this.server.start();
    
    if (subscriptions && httpServer) {
      // WebSocket server for subscriptions
      const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
      });

      useServer({
        schema: this.server.schema,
        context: context(this.pubsub)
      }, wsServer);
    }
    
    this.server.applyMiddleware({ app, path: '/graphql' });
    
    console.log('🚀 GraphQL server ready at /graphql');
    if (subscriptions) {
      console.log('🚀 GraphQL subscriptions ready at ws://localhost:4000/graphql');
    }
  }

  getPubSub() {
    return this.pubsub;
  }
}

const graphqlServer = new GraphQLServer();
module.exports = { GraphQLServer, graphqlServer };
module.exports.default = graphqlServer;
`;
  }
}

function generateGraphQLSchema(ts) {
  if (ts) {
    return `import { gql } from 'apollo-server-express';
import { userTypeDefs } from './types/user';

export const typeDefs = gql\`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
\`;

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
};`;
  } else {
    return `const { gql } = require('apollo-server-express');
const { userTypeDefs } = require('./types/user');

const typeDefs = gql\`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
\`;

const resolvers = {
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
const mergedTypeDefs = [
  typeDefs,
  userTypeDefs
];

const mergedResolvers = {
  ...resolvers,
  // Add other resolvers here
};

module.exports = {
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers
};
`;
  }
}

function generateTypeDefs(ts) {
  if (ts) {
    return `import { gql } from 'apollo-server-express';

export const userTypeDefs = gql\`
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateUserInput {
    email: String!
    name: String!
    password: String!
  }

  input UpdateUserInput {
    email: String
    name: String
    avatar: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  extend type Query {
    users: [User!]!
    user(id: ID!): User
    me: User
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
  }

  extend type Subscription {
    userCreated: User!
    userUpdated: User!
    userDeleted: ID!
  }
\`;`;
  } else {
    return `const { gql } = require('apollo-server-express');

const userTypeDefs = gql\`
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateUserInput {
    email: String!
    name: String!
    password: String!
  }

  input UpdateUserInput {
    email: String
    name: String
    avatar: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  extend type Query {
    users: [User!]!
    user(id: ID!): User
    me: User
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
  }

  extend type Subscription {
    userCreated: User!
    userUpdated: User!
    userDeleted: ID!
  }
\`;

module.exports = { userTypeDefs };
`;
  }
}

function generateResolvers(ts) {
  if (ts) {
    return `import { PubSub } from 'graphql-subscriptions';
import { User } from '../../models/User';
import { sign } from 'jsonwebtoken';

export function userResolvers(pubsub: PubSub) {
  return {
    Query: {
      users: async () => {
        return await User.findAll();
      },
      
      user: async (parent: any, { id }: { id: string }) => {
        return await User.findByPk(id);
      },
      
      me: async (parent: any, args: any, context: any) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }
        return context.user;
      }
    },
    
    Mutation: {
      createUser: async (parent: any, { input }: { input: any }, context: any) => {
        try {
          const user = await User.create(input);
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          // Publish subscription
          pubsub.publish('USER_CREATED', {
            userCreated: user
          });
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(\`Failed to create user: \${error.message}\`);
        }
      },
      
      updateUser: async (parent: any, { id, input }: { id: string, input: any }, context: any) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.update(input);
          
          // Publish subscription
          pubsub.publish('USER_UPDATED', {
            userUpdated: user
          });
          
          return user;
        } catch (error) {
          throw new Error(\`Failed to update user: \${error.message}\`);
        }
      },
      
      deleteUser: async (parent: any, { id }: { id: string }, context: any) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.destroy();
          
          // Publish subscription
          pubsub.publish('USER_DELETED', {
            userDeleted: id
          });
          
          return true;
        } catch (error) {
          throw new Error(\`Failed to delete user: \${error.message}\`);
        }
      },
      
      login: async (parent: any, { input }: { input: any }, context: any) => {
        try {
          const user = await User.findOne({ where: { email: input.email } });
          if (!user) {
            throw new Error('Invalid credentials');
          }
          
          // In a real app, you'd verify the password here
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(\`Login failed: \${error.message}\`);
        }
      },
      
      logout: async (parent: any, args: any, context: any) => {
        // In a real app, you'd invalidate the token here
        return true;
      }
    },
    
    Subscription: {
      userCreated: {
        subscribe: () => pubsub.asyncIterator(['USER_CREATED'])
      },
      
      userUpdated: {
        subscribe: () => pubsub.asyncIterator(['USER_UPDATED'])
      },
      
      userDeleted: {
        subscribe: () => pubsub.asyncIterator(['USER_DELETED'])
      }
    }
  };
}`;
  } else {
    return `const { PubSub } = require('graphql-subscriptions');
const { User } = require('../../models/User');
const { sign } = require('jsonwebtoken');

function userResolvers(pubsub) {
  return {
    Query: {
      users: async () => {
        return await User.findAll();
      },
      
      user: async (parent, { id }) => {
        return await User.findByPk(id);
      },
      
      me: async (parent, args, context) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }
        return context.user;
      }
    },
    
    Mutation: {
      createUser: async (parent, { input }, context) => {
        try {
          const user = await User.create(input);
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          // Publish subscription
          pubsub.publish('USER_CREATED', {
            userCreated: user
          });
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(\`Failed to create user: \${error.message}\`);
        }
      },
      
      updateUser: async (parent, { id, input }, context) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.update(input);
          
          // Publish subscription
          pubsub.publish('USER_UPDATED', {
            userUpdated: user
          });
          
          return user;
        } catch (error) {
          throw new Error(\`Failed to update user: \${error.message}\`);
        }
      },
      
      deleteUser: async (parent, { id }, context) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.destroy();
          
          // Publish subscription
          pubsub.publish('USER_DELETED', {
            userDeleted: id
          });
          
          return true;
        } catch (error) {
          throw new Error(\`Failed to delete user: \${error.message}\`);
        }
      },
      
      login: async (parent, { input }, context) => {
        try {
          const user = await User.findOne({ where: { email: input.email } });
          if (!user) {
            throw new Error('Invalid credentials');
          }
          
          // In a real app, you'd verify the password here
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(\`Login failed: \${error.message}\`);
        }
      },
      
      logout: async (parent, args, context) => {
        // In a real app, you'd invalidate the token here
        return true;
      }
    },
    
    Subscription: {
      userCreated: {
        subscribe: () => pubsub.asyncIterator(['USER_CREATED'])
      },
      
      userUpdated: {
        subscribe: () => pubsub.asyncIterator(['USER_UPDATED'])
      },
      
      userDeleted: {
        subscribe: () => pubsub.asyncIterator(['USER_DELETED'])
      }
    }
  };
}

module.exports = { userResolvers };
`;
  }
}

function generateGraphQLRoutes(ts, subscriptions) {
  if (ts) {
    return `import express from 'express';
import { graphqlServer } from '../graphql/apollo.server';
${subscriptions ? `import { createServer } from 'http';` : ''}

const router = express.Router();

// GraphQL endpoint
router.use('/graphql', (req, res, next) => {
  // GraphQL server handles this route
  next();
});

// GraphQL playground (development only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/playground', (req, res) => {
    res.redirect('/graphql');
  });
}

// GraphQL health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GraphQL',
    endpoint: '/graphql',
    ${subscriptions ? `subscriptions: 'ws://localhost:4000/graphql',` : ''}
    playground: process.env.NODE_ENV !== 'production' ? '/graphql' : 'disabled'
  });
});

export default router;`;
  } else {
    return `const express = require('express');
const { graphqlServer } = require('../graphql/apollo.server');
${subscriptions ? `const { createServer } = require('http');` : ''}

const router = express.Router();

// GraphQL endpoint
router.use('/graphql', (req, res, next) => {
  // GraphQL server handles this route
  next();
});

// GraphQL playground (development only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/playground', (req, res) => {
    res.redirect('/graphql');
  });
}

// GraphQL health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GraphQL',
    endpoint: '/graphql',
    ${subscriptions ? `subscriptions: 'ws://localhost:4000/graphql',` : ''}
    playground: process.env.NODE_ENV !== 'production' ? '/graphql' : 'disabled'
  });
});

module.exports = router;
`;
  }
}

function generatePlaygroundConfig(ts) {
  if (ts) {
    return `export const playgroundConfig = {
  settings: {
    'editor.theme': 'dark',
    'editor.fontSize': 14,
    'editor.fontFamily': 'Monaco, Consolas, "Courier New", monospace',
    'editor.reuseHeaders': true,
    'tracing.hideTracingResponse': false,
    'queryPlan.hideQueryPlanResponse': false,
    'editor.cursorShape': 'line',
    'editor.lineWrap': 'on',
    'prettify.printWidth': 80,
    'prettify.tabWidth': 2,
    'prettify.useTabs': false,
    'request.credentials': 'include'
  },
  tabs: [
    {
      endpoint: '/graphql',
      query: \`# Welcome to GraphQL Playground
# 
# GraphQL Playground is an in-browser tool for writing, validating, and
# testing GraphQL queries, mutations, and subscriptions.
#
# Type queries into this side of the screen, and you'll see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#  Merge Fragments: Shift-Ctrl-M (or press the merge button above)
#
#  Run Query:       Ctrl-Enter (or press the play button above)
#
#  Auto Complete:    Ctrl-Space (or just start typing)
#

query GetUsers {
  users {
    id
    email
    name
    avatar
    createdAt
  }
}\`,
      variables: {},
      responses: []
    }
  ]
};

export default playgroundConfig;`;
  } else {
    return `const playgroundConfig = {
  settings: {
    'editor.theme': 'dark',
    'editor.fontSize': 14,
    'editor.fontFamily': 'Monaco, Consolas, "Courier New", monospace',
    'editor.reuseHeaders': true,
    'tracing.hideTracingResponse': false,
    'queryPlan.hideQueryPlanResponse': false,
    'editor.cursorShape': 'line',
    'editor.lineWrap': 'on',
    'prettify.printWidth': 80,
    'prettify.tabWidth': 2,
    'prettify.useTabs': false,
    'request.credentials': 'include'
  },
  tabs: [
    {
      endpoint: '/graphql',
      query: \`# Welcome to GraphQL Playground
# 
# GraphQL Playground is an in-browser tool for writing, validating, and
# testing GraphQL queries, mutations, and subscriptions.
#
# Type queries into this side of the screen, and you'll see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#  Merge Fragments: Shift-Ctrl-M (or press the merge button above)
#
#  Run Query:       Ctrl-Enter (or press the play button above)
#
#  Auto Complete:    Ctrl-Space (or just start typing)
#

query GetUsers {
  users {
    id
    email
    name
    avatar
    createdAt
  }
}\`,
      variables: {},
      responses: []
    }
  ]
};

module.exports = { playgroundConfig };
module.exports.default = playgroundConfig;
`;
  }
}

function generateSchemaFile() {
  return `# GraphQL Schema

type User {
  id: ID!
  email: String!
  name: String!
  avatar: String
  createdAt: String!
  updatedAt: String!
}

type AuthPayload {
  token: String!
  user: User!
}

input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
  avatar: String
}

input LoginInput {
  email: String!
  password: String!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  me: User
}

type Mutation {
  createUser(input: CreateUserInput!): AuthPayload!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  login(input: LoginInput!): AuthPayload!
  logout: Boolean!
}

type Subscription {
  userCreated: User!
  userUpdated: User!
  userDeleted: ID!
}`;
}

function updatePackageJsonWithGraphQL(targetRoot, subscriptions) {
  const fs = require('fs');
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["apollo-server-express"] = "^3.12.0";
    pkg.dependencies["graphql"] = "^16.8.0";
    pkg.dependencies["@graphql-tools/schema"] = "^9.0.0";
    pkg.dependencies["graphql-subscriptions"] = "^2.0.0";
    
    if (subscriptions) {
      pkg.dependencies["graphql-ws"] = "^5.14.0";
      pkg.dependencies["ws"] = "^8.14.0";
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with GraphQL dependencies:", error);
  }
}
