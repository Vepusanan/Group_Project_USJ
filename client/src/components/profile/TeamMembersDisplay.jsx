import React from "react";
import {
  formatTeamMembersForDisplay,
  parseTeamMembersFromProfile,
} from "../../../../shared/teamMembers.mjs";

const TeamMembersDisplay = ({ value, className = "text-content-secondary text-sm leading-relaxed" }) => {
  const rows = parseTeamMembersFromProfile(value).filter((row) => row.name || row.role);
  const lines = formatTeamMembersForDisplay(value);

  if (!rows.length) return null;

  const isStructured = rows.some((row) => row.name && row.role);

  if (isStructured) {
    return (
      <ul className={`${className} space-y-2 list-none`}>
        {rows.map((row) => (
          <li key={row._key} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-content">{row.name}</span>
            {row.role && (
              <span className="text-content-muted">{row.role}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className={`${className} whitespace-pre-line`}>
      {lines?.join("\n")}
    </p>
  );
};

export default TeamMembersDisplay;
