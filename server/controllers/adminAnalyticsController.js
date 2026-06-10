import {
  getUserRegistrationStats,
  getMonthlyActiveUsers,
  getVerificationStats,
  getConnectionsPerMonth,
  getPitchDeckSessionsPerMonth,
  getDataRoomActivityPerMonth,
  getFeatureAdoptionRates,
  getAiUsagePerMonth,
  getFraudReportRate,
} from "../repositories/AdminAnalyticsRepository.js";

export const getPlatformAnalytics = async (_req, res, next) => {
  try {
    const [
      users,
      mau,
      verification,
      connectionsPerMonth,
      pitchDeckSessionsPerMonth,
      dataRoomActivity,
      featureAdoption,
      aiUsage,
      fraudReportRate,
    ] = await Promise.all([
      getUserRegistrationStats(),
      getMonthlyActiveUsers(),
      getVerificationStats(),
      getConnectionsPerMonth(),
      getPitchDeckSessionsPerMonth(),
      getDataRoomActivityPerMonth(),
      getFeatureAdoptionRates(),
      getAiUsagePerMonth(),
      getFraudReportRate(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        mau,
        verification,
        connections_per_month: connectionsPerMonth,
        pitch_deck_sessions_per_month: pitchDeckSessionsPerMonth,
        data_room: dataRoomActivity,
        feature_adoption: featureAdoption,
        ai_usage: aiUsage,
        fraud_report_rate: fraudReportRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
