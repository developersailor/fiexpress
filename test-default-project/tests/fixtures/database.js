export const databaseFixtures = {
  // Database setup
  setup: async (db: any) => {
    // Create test database
    await db.query('CREATE DATABASE IF NOT EXISTS test_db');
    await db.query('USE test_db');
    
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  },
  
  // Cleanup
  cleanup: async (db: any) => {
    await db.query('DROP DATABASE IF EXISTS test_db');
  },
  
  // Seed data
  seed: async (db: any) => {
    // Insert test users
    await db.query(`
      INSERT INTO users (id, email, password, role, first_name, last_name) VALUES
      ('admin-123', 'admin@test.com', 'admin123', 'admin', 'Admin', 'User'),
      ('user-123', 'user@test.com', 'user123', 'user', 'Regular', 'User')
    `);
    
    // Insert test products
    await db.query(`
      INSERT INTO products (id, name, price, category, description) VALUES
      ('prod-1', 'Test Product 1', 99.99, 'Electronics', 'A test product'),
      ('prod-2', 'Test Product 2', 149.99, 'Clothing', 'Another test product')
    `);
  }
};

export default databaseFixtures;