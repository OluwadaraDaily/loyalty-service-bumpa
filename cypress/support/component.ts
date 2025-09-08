// Cypress Component Testing support file

import './commands';
import { mount } from 'cypress/react18';

// Import global styles
import '../../resources/css/app.css';

// Augment the Cypress namespace to include type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Global component test configuration
beforeEach(() => {
  // Mock window.matchMedia for components that use it
  cy.window().then((win) => {
    Object.defineProperty(win, 'matchMedia', {
      writable: true,
      value: cy.stub().returns({
        matches: false,
        addListener: cy.stub(),
        removeListener: cy.stub(),
      }),
    });
  });
});