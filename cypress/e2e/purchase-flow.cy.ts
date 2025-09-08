describe('Purchase Flow E2E Tests', () => {
  before(() => {
    cy.clearCache();
    cy.seed();
  });
  
  beforeEach(() => {
    cy.loginAsCustomer();
    cy.visit('/dashboard');
    cy.waitForInertia();
    cy.wait('@getDashboardData');
    cy.wait('@getDashboardStats');
  });

  describe('Successful Purchase Flow', () => {
    it('should complete a successful purchase with achievement unlock', () => {
      // Intercept purchase API to return success with achievement
      cy.intercept('POST', '/api/users/*/purchase', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Purchase processed successfully',
          purchase_id: 123,
          cashback_amount: 25.00,
          newly_unlocked_achievements: [
            {
              id: 4,
              name: 'Random Shopper',
              description: 'Made a random purchase'
            }
          ],
          newly_unlocked_badges: [
            {
              id: 3,
              name: 'Shopping Badge', 
              description: 'Awarded for making purchases',
              icon_url: null
            }
          ]
        }
      }).as('successfulPurchase');

      const purchaseButton = cy.get('button').contains('Random Purchase');
      
      // Initial state
      purchaseButton.should('be.enabled');
      purchaseButton.should('not.contain', 'Processing...');

      // Click purchase button
      purchaseButton.click();

      // Wait for API call
      cy.wait('@successfulPurchase');

      // Should show achievement notification
      cy.contains('Achievement Unlocked!', { timeout: 10000 }).should('be.visible');
      cy.contains('Random Shopper').should('be.visible');
      cy.contains('Shopping Badge').should('be.visible');

      // Button should return to normal state
      cy.get('button').contains('Random Purchase').should('be.enabled');
      cy.get('button').should('not.contain', 'Processing...');

      // Notification should disappear after timeout
      cy.contains('Achievement Unlocked!', { timeout: 6000 }).should('not.exist');
    });

    it('should handle purchase without achievements', () => {
      cy.intercept('POST', '/api/users/*/purchase', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Purchase processed successfully',
          purchase_id: 124,
          cashback_amount: 15.00,
          newly_unlocked_achievements: [],
          newly_unlocked_badges: []
        }
      }).as('simplePurchase');

      cy.get('button').contains('Random Purchase').click();
      cy.wait('@simplePurchase');

      // Should not show achievement notification
      cy.contains('Achievement Unlocked!').should('not.exist');
      
      // Button should return to normal
      cy.get('button').contains('Random Purchase').should('be.enabled');
    });

    it('should handle purchase with only badge rewards', () => {
      cy.intercept('POST', '/api/users/*/purchase', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Purchase processed successfully',
          purchase_id: 125,
          cashback_amount: 30.00,
          newly_unlocked_achievements: [],
          newly_unlocked_badges: [
            {
              id: 4,
              name: 'Bronze Shopper',
              description: 'Made your first purchase',
              icon_url: null
            }
          ]
        }
      }).as('badgeOnlyPurchase');

      cy.get('button').contains('Random Purchase').click();
      cy.wait('@badgeOnlyPurchase');

      // Should show toast notification for badge (not full notification)
      // This depends on how the app handles badge-only rewards
      cy.get('button').contains('Random Purchase').should('be.enabled');
    });
  });

  describe('Purchase Error Handling', () => {
    it('should handle purchase failure gracefully', () => {
      cy.intercept('POST', '/api/users/*/purchase', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Insufficient funds'
        }
      }).as('failedPurchase');

      cy.get('button').contains('Random Purchase').click();
      cy.wait('@failedPurchase');

      // Should show error message (toast or other notification)
      // The exact implementation depends on how errors are displayed
      
      // Button should return to enabled state
      cy.get('button').contains('Random Purchase').should('be.enabled');
      cy.get('button').should('not.contain', 'Processing...');
      
      // Should not show achievement notification
      cy.contains('Achievement Unlocked!').should('not.exist');
    });


    it('should prevent multiple simultaneous purchases', () => {
      // Intercept with delay to test rapid clicking
      cy.intercept('POST', '/api/users/*/purchase', (req) => {
        req.reply((res) => {
          res.setDelay(1000);
          res.send({
            statusCode: 200,
            body: {
              success: true,
              message: 'Purchase processed successfully',
              purchase_id: 126,
              cashback_amount: 20.00,
              newly_unlocked_achievements: [],
              newly_unlocked_badges: []
            }
          });
        });
      }).as('slowPurchase');

      const purchaseButton = cy.get('button').contains('Random Purchase');
      
      // Click multiple times rapidly
      purchaseButton.click();
      purchaseButton.click();
      purchaseButton.click();

      // Should show processing state and be disabled
      cy.get('button').contains('Processing...').should('be.disabled');

      cy.wait('@slowPurchase');
      
      // Button should return to enabled
      cy.get('button').contains('Random Purchase').should('be.enabled');
    });
  });

  describe('Data Refresh After Purchase', () => {
    it('should refresh dashboard data after successful purchase', () => {
      // Set up intercepts to track data refresh
      cy.intercept('POST', '/api/users/*/purchase', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Purchase processed successfully',
          purchase_id: 127,
          cashback_amount: 25.00,
          newly_unlocked_achievements: [],
          newly_unlocked_badges: []
        }
      }).as('purchase');

      // Intercept the refetch calls that should happen after purchase
      cy.intercept('GET', '/api/users/*/achievements').as('refreshDashboardData');
      cy.intercept('GET', '/api/users/*/dashboard-stats').as('refreshDashboardStats');

      cy.get('button').contains('Random Purchase').click();
      cy.wait('@purchase');

      // Should trigger data refresh (React Query invalidation)
      cy.wait('@refreshDashboardData');
      cy.wait('@refreshDashboardStats');

      // Dashboard should remain functional with updated data
      cy.contains('All Achievements').should('be.visible');
      cy.contains('Current Badge').should('be.visible');
    });
  });

  describe('Achievement Simulation Flow', () => {
    it('should simulate achievement successfully', () => {
      cy.intercept('POST', '/api/users/*/simulate-achievement', {
        statusCode: 200,
        body: {
          success: true,
          achievement: {
            id: 5,
            name: 'Achievement Simulator',
            description: 'You used the achievement simulator'
          },
          badges: [
            {
              id: 5,
              name: 'Tester Badge',
              description: 'Awarded for testing features',
              icon_url: null
            }
          ]
        }
      }).as('simulateSuccess');

      const simulateButton = cy.get('button').contains('Simulate Achievement');
      
      simulateButton.should('be.enabled');
      simulateButton.click();

      cy.wait('@simulateSuccess');

      // Should show achievement notification
      cy.contains('Achievement Unlocked!').should('be.visible');
      cy.contains('Achievement Simulator').should('be.visible');
      cy.contains('Tester Badge').should('be.visible');

      // Button should return to normal
      cy.get('button').contains('Simulate Achievement').should('be.enabled');
    });

    it('should handle simulation failure', () => {
      cy.intercept('POST', '/api/users/*/simulate-achievement', {
        statusCode: 400,
        body: {
          success: false,
          message: 'No achievements available to simulate'
        }
      }).as('simulateFailure');

      cy.get('button').contains('Simulate Achievement').click();
      cy.wait('@simulateFailure');

      // Should handle gracefully
      cy.get('button').contains('Simulate Achievement').should('be.enabled');
      cy.contains('Achievement Unlocked!').should('not.exist');
    });
  });

  describe('Cross-Browser Purchase Flow', () => {
    it('should work consistently across viewports', () => {
      // Test mobile
      cy.mobile();
      cy.get('button').contains('Random Purchase').should('be.visible').should('be.enabled');
      
      // Test tablet
      cy.tablet();
      cy.get('button').contains('Random Purchase').should('be.visible').should('be.enabled');
      
      // Test desktop
      cy.desktop();
      cy.get('button').contains('Random Purchase').should('be.visible').should('be.enabled');
    });
  });
});