/**
 * Hook to get current authenticated user information from backend session
 */

import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface CurrentUser {
  userId: string;
  isLoading: boolean;
}

/**
 * Hook to access current authenticated user information
 * Fetches from backend session endpoint
 * 
 * @returns Current user object with userId and loading state
 * 
 * @example
 * ```tsx
 * const { userId, isLoading } = useCurrentUser();
 * if (isLoading) return <div>Loading...</div>;
 * ```
 */
export function useCurrentUser(): CurrentUser {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    let mounted = true;

    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/session/current`, {
          method: 'GET',
          credentials: 'include', // Important: include session cookie
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated - redirect to login
            console.warn('User not authenticated, redirecting to login');
            window.location.href = '/login';
            return;
          }
          throw new Error(`Failed to fetch current user: ${response.status}`);
        }

        const data = await response.json();
        
        if (mounted) {
          setUserId(data.userId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        if (mounted) {
          // On error, redirect to login
          window.location.href = '/login';
        }
      }
    }

    fetchCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);
  
  return { userId, isLoading };
}
