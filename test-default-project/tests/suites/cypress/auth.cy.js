describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@test.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('form').submit();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.loginAs('admin');
    cy.get('[data-testid="logout-button"]').click();
    cy.url().should('include', '/login');
  });
});

describe('User Management', () => {
  it('should create new user', () => {
    cy.loginAs('admin');
    cy.visit('/users/create');
    
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('form').submit();
    
    cy.get('.alert-success').should('contain', 'User created successfully');
  });
});