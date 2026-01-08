import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface TransitionResult {
  success: boolean;
  transitions_made?: number;
  substatuses_cleared?: number;
  timestamp?: string;
  error?: string;
}

// Global cooldown to prevent duplicate executions across component instances
let globalLastRun = 0;

export function useAutoLeadTransitions(options?: { 
  runOnMount?: boolean;
  intervalMinutes?: number;
  showToasts?: boolean;
}) {
  const { runOnMount = false, intervalMinutes = 5, showToasts = false } = options || {};
  const { currentOrganization } = useOrganization();
  
  // All useState hooks first (consistent order)
  const [lastResult, setLastResult] = useState<TransitionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  
  // All useRef hooks second (consistent order)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  // Sync isRunning state with ref for use in callback
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const runTransitions = useCallback(async (): Promise<TransitionResult> => {
    if (isRunningRef.current) {
      return { success: false, error: 'Already running' };
    }

    const now = Date.now();
    // Global cooldown of 30 seconds between all instances
    if (now - globalLastRun < 30000) {
      return { success: false, error: 'Global cooldown active' };
    }

    globalLastRun = now;
    setIsRunning(true);
    
    try {
      console.log('🔄 Running auto-lead-transitions...');
      
      const { data, error } = await supabase.functions.invoke('auto-lead-transitions', {
        body: { organization_id: currentOrganization?.id }
      });

      if (error) {
        console.error('Error running auto-lead-transitions:', error);
        const result: TransitionResult = { success: false, error: error.message };
        setLastResult(result);
        return result;
      }

      const result: TransitionResult = {
        success: true,
        transitions_made: data?.transitions_made || 0,
        substatuses_cleared: data?.substatuses_cleared || 0,
        timestamp: new Date().toISOString()
      };

      setLastResult(result);
      setLastRunAt(new Date());

      console.log('✅ Auto-lead-transitions completed:', result);

      // Show toast only if there were actual changes and showToasts is enabled
      if (showToasts && (result.transitions_made > 0 || result.substatuses_cleared > 0)) {
        toast.info(`Transições automáticas: ${result.transitions_made} leads movidos, ${result.substatuses_cleared} substatus limpos`);
      }

      return result;
    } catch (err) {
      console.error('Exception running auto-lead-transitions:', err);
      const result: TransitionResult = { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
      setLastResult(result);
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [currentOrganization?.id, isRunning, showToasts]);

  // Run on mount if requested
  useEffect(() => {
    if (runOnMount && currentOrganization?.id) {
      // Small delay to avoid running immediately on every navigation
      const timeout = setTimeout(() => {
        runTransitions();
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [runOnMount, currentOrganization?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up interval for periodic execution
  useEffect(() => {
    if (intervalMinutes > 0 && currentOrganization?.id) {
      intervalRef.current = setInterval(() => {
        runTransitions();
      }, intervalMinutes * 60 * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [intervalMinutes, currentOrganization?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    runTransitions,
    lastResult,
    isRunning,
    lastRunAt
  };
}
