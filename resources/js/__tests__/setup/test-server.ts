import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// Setup request interception using the given handlers
export const server = setupServer(...handlers);