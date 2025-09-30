import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils/test.utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    await testUtils.cleanup();
  });

  test('should login successfully', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.navigateTo('/login');
    await testUtils.fillForm({
      'input[name="email"]': 'admin@test.com',
      'input[name="password"]': 'admin123'
    });
    await testUtils.submitForm('form');
    
    await testUtils.waitForUrl('/dashboard');
    await testUtils.assertElementExists('[data-testid="dashboard"]');
  });

  test('should logout successfully', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.loginAs('admin');
    await testUtils.logout();
    await testUtils.assertUrlContains('/login');
  });
});

test.describe('User Management', () => {
  test('should create new user', async ({ page, context }) => {
    const testUtils = new TestUtils(page, context);
    
    await testUtils.loginAs('admin');
    await testUtils.navigateTo('/users/create');
    
    await testUtils.fillForm({
      'input[name="firstName"]': 'John',
      'input[name="lastName"]': 'Doe',
      'input[name="email"]': 'john@example.com',
      'input[name="password"]': 'password123'
    });
    
    await testUtils.submitForm('form');
    await testUtils.assertElementText('.alert-success', 'User created successfully');
  });
});