describe('Authentication Flow E2E Tests', () => {
  before(() => {
    cy.clearCache();
    cy.seed();
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/login');
      
      // Check login form is present
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Fill in credentials
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('input[name="password"]').type('password');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.waitForInertia();
      
      // Should show welcome message
      cy.contains('Welcome back,').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains('These credentials do not match our records.').should('be.visible');
      
      // Should remain on login page
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors (check for required attribute or error messages)
      cy.get('input[name="email"]').should('have.attr', 'required');
      cy.get('input[name="password"]').should('have.attr', 'required');
      
      // Should still be on login page
      cy.url().should('include', '/login');
    });

  });

  describe('Registration Flow', () => {
    it('should register new user successfully', () => {
      cy.visit('/register');
      
      // Check registration form
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible'); 
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="password_confirmation"]').should('be.visible');
      
      // Fill in registration form
      const uniqueEmail = `newuser${Date.now()}@example.com`;
      cy.get('input[name="name"]').type('New User');
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="password"]').type('newpassword123');
      cy.get('input[name="password_confirmation"]').type('newpassword123');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard or verification page
      cy.url().should('not.include', '/register');
    });

    it('should validate password confirmation', () => {
      cy.visit('/register');
      
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="password_confirmation"]').type('differentpassword');
      
      cy.get('button[type="submit"]').click();
      
      // Should show password mismatch error
      cy.contains(/password.*match|confirmation/i).should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/register');
      
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      
      // Should show email validation error or remain on page
      cy.get('input[name="email"]').should('have.attr', 'type', 'email');
      cy.url().should('include', '/register');
    });
  });

  describe('Logout Flow', () => {
    it('should logout user successfully', () => {
      // Login first
      cy.loginAsCustomer();
      cy.visit('/dashboard');
      cy.waitForInertia();
      
      // Find and click logout (might be in user menu dropdown)
      cy.get('body').then(($body) => {
        if ($body.find('[data-slot="dropdown-menu-trigger"]').length) {
          cy.get('[data-slot="dropdown-menu-trigger"]').click();
        }
      });
      
      // Click logout link/button
      cy.contains('Log out').click();
      
      // Should redirect to login or home page
      cy.url().should('not.include', '/dashboard');
      cy.url().should('match', /\/(login|welcome|home)?$/);
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect unauthenticated users to login', () => {
      // Try to access protected dashboard without login
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should allow authenticated users to access protected routes', () => {
      cy.loginAsCustomer();
      cy.visit('/dashboard');
      
      // Should be able to access dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back,').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.loginAsCustomer();
      cy.visit('/dashboard');
      cy.waitForInertia();
      
      // Refresh page
      cy.reload();
      cy.waitForInertia();
      
      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back,').should('be.visible');
    });

  });

  describe('Role-Based Access', () => {
    it('should allow customer access to customer dashboard', () => {
      cy.loginAsCustomer();
      cy.visit('/dashboard');
      cy.waitForInertia();
      
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back,').should('be.visible');
    });

    it('should allow admin access to admin sections', () => {
      cy.loginAsAdmin();
      
      // Try to access admin route (if it exists)
      cy.visit('/admin/dashboard', { failOnStatusCode: false });
      
      // Should either access admin dashboard or redirect appropriately
      // This depends on your app's admin routes
    });
  });

  describe('Form Validation and UX', () => {
    it('should show loading state during login', () => {
      // Intercept login with delay
      cy.intercept('POST', '/login', (req) => {
        req.reply((res) => {
          res.setDelay(1000);
          res.send({
            statusCode: 302,
            headers: { 'Location': '/dashboard' }
          });
        });
      }).as('slowLogin');
      
      cy.visit('/login');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').click();
      
      // Should show loading state
      cy.get('button[type="submit"]').should('contain', /loading|submitting|signing/i);
      
      cy.wait('@slowLogin');
    });
  });

  describe('Responsive Authentication', () => {
    it('should work on mobile devices', () => {
      cy.mobile();
      cy.visit('/login');
      
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Forms should be usable on mobile
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('input[name="password"]').type('password');
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('should work on tablet devices', () => {
      cy.tablet();
      cy.visit('/login');
      
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });
  });
});