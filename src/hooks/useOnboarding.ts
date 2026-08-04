import { useState, useEffect, useCallback } from 'react';
import { LocalStorage } from '@/services/storage';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await LocalStorage.getOnboardingStatus();
      setHasSeenOnboarding(status);
    } catch {
      setHasSeenOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOnboarding = async () => {
    try {
      await LocalStorage.setOnboardingStatus(true);
      setHasSeenOnboarding(true);
    } catch (e) {
      console.error('Failed to update onboarding status', e);
    }
  };

  const resetOnboarding = async () => {
    try {
      await LocalStorage.setOnboardingStatus(false);
      setHasSeenOnboarding(false);
    } catch (e) {
      console.error('Failed to reset onboarding status', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    hasSeenOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding,
  };
}
