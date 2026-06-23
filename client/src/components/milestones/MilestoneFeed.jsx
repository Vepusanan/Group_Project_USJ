import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import engagementService from "../../services/engagementService";

const CATEGORY_LABELS = {
  PRODUCT_LAUNCH: "Product Launch",
  REVENUE_MILESTONE: "Revenue Milestone",
  NEW_CUSTOMER: "New Customer Acquisition",
  STRATEGIC_PARTNERSHIP: "Strategic Partnership",
  TEAM_EXPANSION: "Team Expansion",
  FUNDING_ACHIEVEMENT: "Funding Achievement",
  OTHER: "Other",
};

const MilestoneFeed = ({ startupProfileId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await engagementService.listMilestones(startupProfileId);
      setMilestones(result.success ? result.data || [] : []);
      setLoading(false);
    })();
  }, [startupProfileId]);

  if (loading) {
    return (
      <SectionCard title="Milestone updates" icon={Megaphone} accent="blue">
        <p className="text-sm text-content-muted">Loading activity...</p>
      </SectionCard>
    );
  }

  if (!milestones.length) return null;

  return (
    <SectionCard title="Milestone updates" icon={Megaphone} accent="blue">
      <div className="space-y-4">
        {milestones.map((m) => (
          <div key={m.id} className="rounded-xl border border-line bg-surface-alt p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {CATEGORY_LABELS[m.category] || m.category}
              </span>
              <span className="text-[10px] text-content-muted">
                {m.milestone_date
                  ? new Date(m.milestone_date).toLocaleDateString()
                  : new Date(m.created_at).toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-semibold text-content">{m.headline}</h3>
            <p className="text-sm text-content-secondary mt-1">{m.description}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default MilestoneFeed;
