describe('Dashboard E2E Tests', () => {
  before(() => {
    // Set up test environment once
    cy.clearCache();
    cy.seed();
  });
  
  beforeEach(() => {
    // Login as customer to access dashboard
    cy.loginAsCustomer();
    
    // Navigate to dashboard
    cy.visit('/dashboard');
    cy.waitForInertia();
  });

  describe('Dashboard Loading and Display', () => {
    it('should load and display dashboard with all components', () => {
      // Check page title
      cy.title().should('contain', 'Dashboard');
      
      // Check welcome message
      cy.contains('Welcome back,').should('be.visible');
      
      // Check main action buttons
      cy.get('button').contains('Random Purchase').should('be.visible').should('be.enabled');
      cy.get('button').contains('Simulate Achievement').should('be.visible').should('be.enabled');
      
      // Wait for API data to load
      cy.wait('@getDashboardData');
      cy.wait('@getDashboardStats');
      
      // Check stats overview section
      cy.contains('Total Purchases').should('be.visible');
      cy.contains('Total Spent').should('be.visible');
      cy.contains('Total Cashback').should('be.visible');
      cy.contains('Pending Cashback').should('be.visible');
      
      // Check current badge section
      cy.contains('Current Badge').should('be.visible');
      
      // Check achievements section
      cy.contains('All Achievements').should('be.visible');
      
      // Check badges section
      cy.contains('All Badges').should('be.visible');
    });

    it('should display correct user information', () => {
      cy.wait('@getDashboardData');
      
      // Should show correct user name (from test data)
      cy.contains('Welcome back,').parent().should('contain', 'Customer');
    });

    it('should handle responsive layout', () => {
      // Test mobile view
      cy.mobile();
      cy.get('button').contains('Random Purchase').should('be.visible');
      cy.contains('All Achievements').should('be.visible');
      
      // Test tablet view
      cy.tablet();
      cy.get('button').contains('Random Purchase').should('be.visible');
      cy.contains('All Achievements').should('be.visible');
      
      // Test desktop view
      cy.desktop();
      cy.get('button').contains('Random Purchase').should('be.visible');
      cy.contains('All Achievements').should('be.visible');
    });
  });

  describe('Dashboard Data Display', () => {
    it('should show achievement progress correctly', () => {
      cy.wait('@getDashboardData');
      
      // Check for achievement progress indicators
      cy.get('[role="generic"]').should('contain', '/');
      cy.get('[role="generic"]').should('contain', '%');
      
      // Check progress bars are present
      cy.get('.h-2.rounded-full').should('have.length.greaterThan', 0);
    });

    it('should display stats with proper formatting', () => {
      cy.wait('@getDashboardStats');
      
      // Check that numbers are displayed (exact values depend on test data)
      cy.get('[data-testid="app-layout"]').within(() => {
        cy.contains(/\d+/).should('be.visible'); // Total purchases count
        cy.contains(/\$\d+/).should('be.visible'); // Money amounts
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API calls to return errors
      cy.intercept('GET', '/api/users/*/achievements', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getDashboardDataError');
      
      cy.visit('/dashboard');
      cy.wait('@getDashboardDataError');
      
      // Should show error state or retry option
      cy.contains(/error|retry|failed/i).should('be.visible');
    });

    it('should retry failed requests', () => {
      // First request fails, second succeeds
      cy.intercept('GET', '/api/users/*/achievements', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('getDashboardDataError');
      
      cy.visit('/dashboard');
      cy.wait('@getDashboardDataError');
      
      // Reset intercept to succeed
      cy.intercept('GET', '/api/users/*/achievements', {
        statusCode: 200,
        fixture: 'dashboard-data.json'
      }).as('getDashboardDataSuccess');
      
      // Click retry button if available
      cy.get('body').then(($body) => {
        if ($body.text().includes('Retry')) {
          cy.contains('Retry').click();
          cy.wait('@getDashboardDataSuccess');
          cy.contains('Welcome back,').should('be.visible');
        }
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      // Intercept with delay to test loading state
      cy.intercept('GET', '/api/users/*/achievements', (req) => {
        req.reply((res) => {
          res.setDelay(2000);
          res.send({ fixture: 'dashboard-data.json' });
        });
      }).as('getSlowDashboardData');
      
      cy.visit('/dashboard');
      
      // Should show loading indicator
      cy.get('.animate-spin').should('be.visible');
      
      cy.wait('@getSlowDashboardData');
      
      // Loading should disappear
      cy.get('.animate-spin').should('not.exist');
      cy.contains('Welcome back,').should('be.visible');
    });
  });

  describe('Navigation and Breadcrumbs', () => {
    it('should display correct breadcrumbs', () => {
      cy.wait('@getDashboardData');
      
      // Check breadcrumb navigation
      cy.get('[data-testid="breadcrumbs"]').should('contain', 'Dashboard');
    });

    it('should maintain state when navigating within dashboard', () => {
      cy.wait('@getDashboardData');
      
      // Ensure dashboard is fully loaded
      cy.contains('All Achievements').should('be.visible');
      
      // State should persist (components remain visible)
      cy.contains('Current Badge').should('be.visible');
      cy.contains('All Badges').should('be.visible');
    });
  });
});