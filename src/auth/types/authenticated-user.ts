/**
 * Shape of the authenticated user object attached to the Express request
 * by the JWT strategy after token validation succeeds.
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
}
