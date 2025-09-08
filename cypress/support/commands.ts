// Custom Cypress commands for Laravel/Inertia.js app

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as a user
       * @param email - User email
       * @param password - User password  
       */
      login(email?: string, password?: string): Chainable<void>;
      
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Login as customer user
       */
      loginAsCustomer(): Chainable<void>;
      
      /**
       * Wait for Inertia navigation to complete
       */
      waitForInertia(): Chainable<void>;
      
      /**
       * Seed database with test data
       */
      seed(): Chainable<void>;
      
      /**
       * Clear application cache
       */
      clearCache(): Chainable<void>;
      
      /**
       * Set viewport to mobile size
       */
      mobile(): Chainable<void>;
      
      /**
       * Set viewport to tablet size
       */
      tablet(): Chainable<void>;
      
      /**
       * Set viewport to desktop size
       */
      desktop(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.waitForInertia();
});

// Admin login
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'password');
});

// Customer login  
Cypress.Commands.add('loginAsCustomer', () => {
  cy.login('customer@example.com', 'password');
});

// Wait for Inertia navigation
Cypress.Commands.add('waitForInertia', () => {
  // Wait for Inertia to finish loading
  cy.get('body').should('not.have.class', 'inertia-loading');
  
  // Wait for React to finish rendering
  cy.get('[data-cy="app-layout"]', { timeout: 10000 }).should('be.visible');
});

// Database seeding
Cypress.Commands.add('seed', () => {
  cy.exec('php artisan db:seed --class=TestSeeder --env=testing');
});

// Clear cache
Cypress.Commands.add('clearCache', () => {
  cy.exec('php artisan cache:clear --env=testing');
  cy.exec('php artisan config:clear --env=testing');
});

// Viewport commands
Cypress.Commands.add('mobile', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('tablet', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('desktop', () => {
  cy.viewport(1280, 720); // Desktop
});

// Intercept common API calls
beforeEach(() => {
  // Intercept CSRF cookie request
  cy.intercept('GET', '/sanctum/csrf-cookie', { statusCode: 204 }).as('csrfCookie');
  
  // Intercept dashboard data requests
  cy.intercept('GET', '/api/users/*/achievements').as('getDashboardData');
  cy.intercept('GET', '/api/users/*/dashboard-stats').as('getDashboardStats');
  
  // Intercept action requests
  cy.intercept('POST', '/api/users/*/purchase').as('purchase');
  cy.intercept('POST', '/api/users/*/simulate-achievement').as('simulateAchievement');
});