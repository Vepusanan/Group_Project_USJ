import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/apiService";

const DashboardPage = () => {
  const location = useLocation();
  const message = location.state?.message;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    unreadMessages: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      const [
        connectionsRes,
        pendingSentRes,
        pendingReceivedRes,
        conversationsRes,
      ] = await Promise.all([
        apiService.getConnections(),
        apiService.getPendingSentConnections(),
        apiService.getPendingReceivedConnections(),
        apiService.getConversations(),
      ]);

      const connections = connectionsRes.success
        ? connectionsRes.data?.data || []
        : [];
      const pendingSent = pendingSentRes.success
        ? pendingSentRes.data?.data || []
        : [];
      const pendingReceived = pendingReceivedRes.success
        ? pendingReceivedRes.data?.data || []
        : [];
      const conversations = conversationsRes.success
        ? conversationsRes.data?.conversations || []
        : [];

      const acceptedConnections = connections.filter(
        (item) => item.normalized_status === "accepted",
      );
      const unreadMessages = conversations.reduce(
        (sum, convo) => sum + Number(convo.unread_count || 0),
        0,
      );

      setStats({
        totalConnections: acceptedConnections.length,
        pendingRequests: pendingSent.length + pendingReceived.length,
        unreadMessages,
      });

      const connectionActivity = acceptedConnections
        .slice(0, 3)
        .map((item) => ({
          id: `connection-${item.id}`,
          text: `Connected with ${item.other_user_name || "a user"}`,
          date: item.updated_at || item.created_at,
        }));

      const messageActivity = conversations.slice(0, 3).map((item) => ({
        id: `conversation-${item.conversation_id}`,
        text: `Conversation with ${item.other_user_name || "a user"}`,
        date: item.last_message_at || item.updated_at || item.created_at,
      }));

      const mergedActivity = [...connectionActivity, ...messageActivity]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentActivity(mergedActivity);
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const isInvestor = user?.userType === "investor";

  const quickLinks = isInvestor
    ? [
        {
          to: "/startups",
          title: "Discover Startups",
          desc: "Browse startups and send connection requests.",
        },
        {
          to: "/connections",
          title: "My Connections",
          desc: "Track pending and accepted startup connections.",
        },
        {
          to: "/messages",
          title: "Messages",
          desc: "Chat with your accepted connections.",
        },
      ]
    : [
        {
          to: "/analytics",
          title: "Analytics Dashboard",
          desc: "Track investor engagement with your profile and pitch deck.",
        },
        {
          to: "/investors",
          title: "Discover Investors",
          desc: "Find investors who match your stage and industry.",
        },
        {
          to: "/connections",
          title: "My Connections",
          desc: "Review incoming requests and your network.",
        },
        {
          to: "/messages",
          title: "Messages",
          desc: "Chat with your accepted connections.",
        },
      ];

  const statCards = useMemo(
    () => [
      { title: "Total Connections", value: stats.totalConnections },
      { title: "Pending Requests", value: stats.pendingRequests },
      { title: "Unread Messages", value: stats.unreadMessages },
    ],
    [stats],
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {message && (
          <div className="mb-6 bg-success/10 border border-success/30 rounded-lg p-4">
            <p className="text-success text-center">{message}</p>
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-content mb-2">Dashboard</h1>
          <p className="text-content-secondary text-lg mb-8">
            Welcome back{user?.fullName ? `, ${user.fullName}` : ""}. Continue
            from the sections below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="bg-surface  rounded-2xl p-6 border border-line"
              >
                <p className="text-sm text-content-secondary">{card.title}</p>
                <p className="text-3xl font-bold text-content mt-1">
                  {loading ? "..." : card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="bg-surface  rounded-2xl p-6 border border-line hover:border-primary-light/40 hover:bg-surface-alt transition-colors"
              >
                <h2 className="text-xl font-semibold text-content mb-2">
                  {item.title}
                </h2>
                <p className="text-content-secondary text-sm">{item.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 bg-surface  rounded-2xl p-6 border border-line">
            <h2 className="text-xl font-semibold text-content mb-3">
              Recent Activity
            </h2>
            {loading ? (
              <p className="text-content-secondary">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-content-secondary">No recent activity yet.</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-line bg-surface-alt p-3"
                  >
                    <p className="text-sm text-content">{item.text}</p>
                    <p className="text-xs text-content-muted mt-1">
                      {item.date
                        ? new Date(item.date).toLocaleString()
                        : "Recent"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
