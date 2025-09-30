export const apiFixtures = {
  // API responses
  responses: {
    success: {
      status: 200,
      data: { message: 'Success' }
    },
    
    error: {
      status: 400,
      error: { message: 'Bad Request' }
    },
    
    unauthorized: {
      status: 401,
      error: { message: 'Unauthorized' }
    },
    
    forbidden: {
      status: 403,
      error: { message: 'Forbidden' }
    },
    
    notFound: {
      status: 404,
      error: { message: 'Not Found' }
    },
    
    serverError: {
      status: 500,
      error: { message: 'Internal Server Error' }
    }
  },
  
  // Mock data
  mockData: {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin'
      }
    ],
    
    products: [
      {
        id: '1',
        name: 'Product 1',
        price: 99.99,
        category: 'Electronics'
      },
      {
        id: '2',
        name: 'Product 2',
        price: 149.99,
        category: 'Clothing'
      }
    ]
  },
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refresh: '/auth/refresh'
    },
    
    users: {
      list: '/users',
      create: '/users',
      get: '/users/:id',
      update: '/users/:id',
      delete: '/users/:id'
    },
    
    products: {
      list: '/products',
      create: '/products',
      get: '/products/:id',
      update: '/products/:id',
      delete: '/products/:id'
    }
  }
};

export default apiFixtures;