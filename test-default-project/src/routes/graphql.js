import express from 'express';
import { graphqlServer } from '../graphql/apollo.server';
import { createServer } from 'http';

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
    subscriptions: 'ws://localhost:4000/graphql',
    playground: process.env.NODE_ENV !== 'production' ? '/graphql' : 'disabled'
  });
});

export default router;