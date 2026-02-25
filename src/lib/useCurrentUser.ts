/**
 * Hook to get current authenticated user information
 * 
 * TODO: Wire this to actual authentication system
 * Currently returns a placeholder userId from sessionStorage or generated UUID
 * This should be replaced with actual user context from backend session/JWT
 */

import { useEffect, useState } from 'react';

export interface CurrentUser {
  userId: string;
}

/**
 * Get or generate a user ID for the current session
 * This is a placeholder implementation until proper authentication is wired
 */
function getUserId(): string {
  // TEMPORARY: Use hardcoded user ID from your database for development/testing
  // This matches the existing user in your users table
  const TEST_USER_ID = '9d539de8-de71-4db4-a205-2d8f745e6d8a';
  
  // Try to get from sessionStorage first
  let userId = sessionStorage.getItem('nullprofile_user_id');
  
  if (!userId) {
    // Use actual database user ID instead of generating random UUID
    // In production, this should come from backend authentication
    userId = TEST_USER_ID;
    sessionStorage.setItem('nullprofile_user_id', userId);
    console.warn('TODO: useCurrentUser is using hardcoded test user ID. Wire to actual auth system.');
  }
  
  return userId;
}

/**
 * Hook to access current user information
 * 
 * @returns Current user object with userId
 * 
 * @example
 * ```tsx
 * const { userId } = useCurrentUser();
 * ```
 */
export function useCurrentUser(): CurrentUser {
  const [userId] = useState<string>(getUserId);
  
  useEffect(() => {
    // Future: Subscribe to auth state changes
    // For now, userId is stable for the session
  }, []);
  
  return { userId };
}
