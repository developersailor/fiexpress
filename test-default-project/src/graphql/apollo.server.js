import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { typeDefs } from './schema';
import { resolvers } from './schema/resolvers';
import { context } from './context';
import { createServer } from 'http';
import express from 'express';

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
export default graphqlServer;