export const userFixtures = {
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  user: {
    id: 'user-123',
    email: 'user@test.com',
    password: 'user123',
    role: 'user',
    firstName: 'Regular',
    lastName: 'User',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  inactiveUser: {
    id: 'inactive-123',
    email: 'inactive@test.com',
    password: 'inactive123',
    role: 'user',
    firstName: 'Inactive',
    lastName: 'User',
    isActive: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  
  // Generate random user data
  generateRandomUser: () => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: `test${Math.random().toString(36).substr(2, 9)}@test.com`,
    password: 'test123',
    role: 'user',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

export default userFixtures;