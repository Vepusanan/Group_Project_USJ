import {
  formatCoolingEnd,
  isInConnectionCooling,
} from "./connectionCooling.js";

/**
 * Relationship validity rules for profile interactions.
 * Mirrors server-side connection rules (investor ↔ startup only).
 */

export const PROFILE_OWNER_TYPES = {
  STARTUP: "startup",
  INVESTOR: "investor",
};

const VALID_PAIRS = new Set([
  `${PROFILE_OWNER_TYPES.STARTUP}:${PROFILE_OWNER_TYPES.INVESTOR}`,
  `${PROFILE_OWNER_TYPES.INVESTOR}:${PROFILE_OWNER_TYPES.STARTUP}`,
]);

export const RELATIONSHIP_KIND = {
  SELF: "self",
  GUEST: "guest",
  INVALID: "invalid",
  ELIGIBLE: "eligible",
  PENDING_SENT: "pending_sent",
  PENDING_RECEIVED: "pending_received",
  CONNECTED: "connected",
  DECLINED_COOLING: "declined_cooling",
};

/**
 * Whether two user types can form a connection (cross-type only).
 */
export function isValidConnectionPair(viewerUserType, profileOwnerType) {
  if (!viewerUserType || !profileOwnerType) return false;
  return VALID_PAIRS.has(`${viewerUserType}:${profileOwnerType}`);
}

/**
 * Resolve interaction permissions between the viewing user and a profile owner.
 */
export function getProfileRelationship({
  viewerUserId = null,
  viewerUserType = null,
  profileUserId = null,
  profileOwnerType,
  connectionStatus = null,
  connectionRequesterId = null,
  connectionDeclinedAt = null,
}) {
  const normalizedStatus = connectionStatus || null;
  const isAuthenticated = Boolean(viewerUserId);
  const isOwn =
    isAuthenticated &&
    profileUserId &&
    String(viewerUserId) === String(profileUserId);

  if (isOwn) {
    return {
      kind: RELATIONSHIP_KIND.SELF,
      isValid: false,
      canViewPrivate: true,
      showPrivateLock: false,
      showInteractionActions: false,
      canInitiateConnection: false,
      canRespondToConnection: false,
      canCancelPending: false,
      canMessage: false,
      showPrivateBadge: false,
    };
  }

  if (!isAuthenticated) {
    return {
      kind: RELATIONSHIP_KIND.GUEST,
      isValid: false,
      canViewPrivate: false,
      showPrivateLock: false,
      showInteractionActions: false,
      canInitiateConnection: false,
      canRespondToConnection: false,
      canCancelPending: false,
      canMessage: false,
      showPrivateBadge: false,
    };
  }

  const pairIsValid = isValidConnectionPair(viewerUserType, profileOwnerType);

  if (!pairIsValid) {
    return {
      kind: RELATIONSHIP_KIND.INVALID,
      isValid: false,
      canViewPrivate: false,
      showPrivateLock: false,
      showInteractionActions: false,
      canInitiateConnection: false,
      canRespondToConnection: false,
      canCancelPending: false,
      canMessage: false,
      showPrivateBadge: false,
    };
  }

  const isConnected = normalizedStatus === "accepted";
  const isPending = normalizedStatus === "pending";
  const isDeclined = normalizedStatus === "declined";
  const inDeclineCooling =
    isDeclined && isInConnectionCooling(connectionDeclinedAt);
  const isReceivedRequest =
    isPending &&
    connectionRequesterId &&
    String(connectionRequesterId) !== String(viewerUserId);

  if (inDeclineCooling) {
    return {
      kind: RELATIONSHIP_KIND.DECLINED_COOLING,
      isValid: true,
      canViewPrivate: false,
      showPrivateLock: true,
      showInteractionActions: true,
      canInitiateConnection: false,
      canRespondToConnection: false,
      canCancelPending: false,
      canMessage: false,
      showPrivateBadge: true,
      coolingEndsLabel: formatCoolingEnd(connectionDeclinedAt),
    };
  }

  if (isConnected) {
    return {
      kind: RELATIONSHIP_KIND.CONNECTED,
      isValid: true,
      canViewPrivate: true,
      showPrivateLock: false,
      showInteractionActions: true,
      canInitiateConnection: false,
      canRespondToConnection: false,
      canCancelPending: false,
      canMessage: true,
      showPrivateBadge: false,
    };
  }

  if (isPending) {
    return {
      kind: isReceivedRequest
        ? RELATIONSHIP_KIND.PENDING_RECEIVED
        : RELATIONSHIP_KIND.PENDING_SENT,
      isValid: true,
      canViewPrivate: false,
      showPrivateLock: true,
      showInteractionActions: true,
      canInitiateConnection: false,
      canRespondToConnection: isReceivedRequest,
      canCancelPending: false,
      canMessage: false,
      showPrivateBadge: true,
    };
  }

  return {
    kind: RELATIONSHIP_KIND.ELIGIBLE,
    isValid: true,
    canViewPrivate: false,
    showPrivateLock: true,
    showInteractionActions: true,
    canInitiateConnection: true,
    canRespondToConnection: false,
    canCancelPending: false,
    canMessage: false,
    showPrivateBadge: true,
  };
}

/** Fully private sections (funding, investment details, documents). */
export function shouldShowPrivateSection(relationship) {
  return relationship.canViewPrivate || relationship.showPrivateLock;
}
