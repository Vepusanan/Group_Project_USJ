import {
  createConnectionRequest,
  getConnectionsForUser,
  getPendingReceivedRequestsForUser,
  getPendingSentRequestsForUser,
  getPendingRequestsForStartup,
  getUserById,
  getUserProfileDetailsForConnection,
  removeConnectionById,
  updateConnectionStatus,
} from "../repositories/ConnectionRepository.js";
import {
  sendConnectionAcceptedEmail,
  sendConnectionRequestEmail,
} from "../utils/emailServices.js";
import { buildProfileUrl } from "../utils/connectionProfileUrl.js";
import { getIntentMapForInvestor } from "../repositories/InvestorIntentRepository.js";
import { ensurePipelineCardForConnection } from "../repositories/DealPipelineRepository.js";
import { deleteProfileIntent } from "../repositories/InvestorProfileIntentRepository.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { touchUserActivity } from "../repositories/UserActivityRepository.js";

const notifyConnectionRequest = async ({
  requesterId,
  targetUserId,
  message,
}) => {
  try {
    const [requesterProfile, target] = await Promise.all([
      getUserProfileDetailsForConnection(requesterId),
      getUserById(targetUserId),
    ]);

    if (!target?.email) return;

    await sendConnectionRequestEmail(target.email, target.full_name, {
      requesterName: requesterProfile?.full_name || "A user",
      requesterPhotoUrl: requesterProfile?.photo_url || null,
      profileUrl: buildProfileUrl(
        requesterProfile?.user_type,
        requesterProfile?.profile_id,
      ),
      message: message || null,
    });
  } catch (emailError) {
    console.error(
      "Failed to send connection request email:",
      emailError.message,
    );
  }
};

const notifyConnectionAccepted = async ({ connection, responderUserId }) => {
  try {
    const investorUserId = connection.investor_id;
    const startupUserId = connection.startup_id;
    const participantIds = [investorUserId, startupUserId];

    await Promise.all(
      participantIds.map(async (participantId) => {
        const [participant, otherId] =
          String(participantId) === String(investorUserId)
            ? [
                await getUserById(investorUserId),
                startupUserId,
              ]
            : [
                await getUserById(startupUserId),
                investorUserId,
              ];

        if (!participant?.email) return;

        const otherProfile = await getUserProfileDetailsForConnection(otherId);
        const isRequester =
          String(connection.requester_id) === String(participantId);
        const isResponder = String(responderUserId) === String(participantId);

        await sendConnectionAcceptedEmail(
          participant.email,
          participant.full_name,
          {
            otherPartyName: otherProfile?.full_name || "a user",
            profileUrl: buildProfileUrl(
              otherProfile?.user_type,
              otherProfile?.profile_id,
            ),
            isRequester,
            isResponder,
          },
        );
      }),
    );
  } catch (emailError) {
    console.error(
      "Failed to send connection accepted email:",
      emailError.message,
    );
  }
};

export const createConnection = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const targetUserId = req.body.userId || req.body.targetUserId;
    const message = req.body.message;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: "Target user ID is required",
      });
    }

    const connection = await createConnectionRequest({
      requesterId,
      targetUserId,
      message,
    });

    await touchUserActivity(requesterId);

    notifyConnectionRequest({
      requesterId,
      targetUserId,
      message: connection.request_message,
    });

    return res.status(201).json({
      success: true,
      message: "Connection request sent",
      data: connection,
    });
  } catch (error) {
    const codeToStatus = {
      USER_NOT_FOUND: 404,
      SELF_CONNECTION: 400,
      INVALID_USER_TYPES: 400,
      INVALID_INITIATOR: 403,
      ALREADY_CONNECTED: 409,
      REQUEST_PENDING: 409,
      COOLING_PERIOD: 409,
    };

    const payload = {
      success: false,
      error: error.message || "Failed to create connection request",
    };

    if (error.coolingEndsAt) {
      payload.coolingEndsAt = error.coolingEndsAt;
    }

    return res.status(codeToStatus[error.code] || 500).json(payload);
  }
};

export const listConnections = async (req, res) => {
  try {
    const connections = await getConnectionsForUser(req.user.id);

    let enriched = connections;
    if (req.user.user_type === "investor") {
      const intentMap = await getIntentMapForInvestor(req.user.id);
      enriched = connections.map((conn) => {
        if (conn.other_user_type !== "startup") return conn;
        const intent = intentMap.get(String(conn.id));
        return {
          ...conn,
          intent_level: intent?.intent_level || null,
        };
      });
    }

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch connections",
    });
  }
};

export const listPendingRequests = async (req, res) => {
  try {
    const pending = await getPendingRequestsForStartup(req.user.id);
    return res.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending requests",
    });
  }
};

export const listPendingSentRequests = async (req, res) => {
  try {
    const pending = await getPendingSentRequestsForUser(req.user.id);
    return res.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending sent requests",
    });
  }
};

export const listPendingReceivedRequests = async (req, res) => {
  try {
    const pending = await getPendingReceivedRequestsForUser(req.user.id);
    return res.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending received requests",
    });
  }
};

export const respondToConnection = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const { status } = req.body;

    const updated = await updateConnectionStatus({
      connectionId,
      userId: req.user.id,
      status,
    });

    if (updated.status === "accepted" || updated.status === "connected") {
      notifyConnectionAccepted({
        connection: updated,
        responderUserId: req.user.id,
      });

      try {
        const startupProfile = await getStartupProfileByUserId(updated.startup_id);
        if (startupProfile) {
          await ensurePipelineCardForConnection({
            investorUserId: updated.investor_id,
            connectionId: updated.id,
            startupProfileId: startupProfile.startup_profile_id,
            stage: "CONNECTED",
          });
          await deleteProfileIntent(
            updated.investor_id,
            startupProfile.startup_profile_id,
          );
        }
      } catch (pipelineErr) {
        console.error("Failed to sync pipeline on connection accept:", pipelineErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Connection request ${updated.status}`,
      data: updated,
    });
  } catch (error) {
    const codeToStatus = {
      INVALID_STATUS: 400,
      NOT_FOUND: 404,
      FORBIDDEN: 403,
    };

    return res.status(codeToStatus[error.code] || 500).json({
      success: false,
      error: error.message || "Failed to update connection request",
    });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const result = await removeConnectionById({
      connectionId: req.params.id,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      message: "Connection removed",
      data: result,
    });
  } catch (error) {
    const codeToStatus = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      PENDING_CANNOT_DELETE: 403,
    };

    return res.status(codeToStatus[error.code] || 500).json({
      success: false,
      error: error.message || "Failed to remove connection",
    });
  }
};
