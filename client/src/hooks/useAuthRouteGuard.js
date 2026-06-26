import { useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import {
  getAuthState,
  resolveAuthRouteDecision,
} from "../utils/authStateMachine.js";

const isAuthPending = (isLoading) => isLoading;

/**
 * State-machine route guard — all auth routing decisions flow through here.
 * @param {string} guardMode
 */
export function useAuthRouteGuard(guardMode) {
  const { user, authState, redirectPath, isLoading } = useAuth();
  const { pathname } = useLocation();

  const machine = useMemo(
    () => getAuthState({ user, authState, redirectPath }),
    [user, authState, redirectPath],
  );

  const decision = useMemo(
    () => resolveAuthRouteDecision(machine, pathname, guardMode),
    [machine, pathname, guardMode],
  );

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_AUTH_DEBUG === "1" &&
      !isAuthPending(isLoading)
    ) {
      console.info("[auth/guard]", {
        userId: machine.user?.id,
        pathname,
        guardMode,
        authStatus: machine.status,
        emailVerified: machine.emailVerified,
        onboardingComplete: machine.onboardingComplete,
        decision,
      });
    }
  }, [machine, pathname, guardMode, decision, isLoading]);

  return {
    pending: isAuthPending(isLoading),
    machine,
    decision,
  };
}
