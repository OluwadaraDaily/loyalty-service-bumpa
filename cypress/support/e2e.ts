// Cypress E2E support file

import './commands';

// Import commands.js using ES2015 syntax:
// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log to reduce noise
if (Cypress.config('hideXHR')) {
  const app = window.top;
  
  if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
    const style = app.document.createElement('style');
    style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
    style.setAttribute('data-hide-command-log-request', '');
    app.document.head.appendChild(style);
  }
}

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // This is useful for handling expected errors or third-party script errors
  
  // Don't fail on ResizeObserver errors (common with React components)
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  // Don't fail on network errors in development
  if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
    return false;
  }
  
  // Allow the error to fail the test for other cases
  return true;
});

// Custom viewport commands
declare global {
  namespace Cypress {
    interface Chainable {
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