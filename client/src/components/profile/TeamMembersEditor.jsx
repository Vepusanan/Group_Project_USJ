import React from "react";
import { Plus, Trash2, User } from "lucide-react";
import { EMPTY_MEMBER } from "../../../../shared/teamMembers.mjs";

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-surface-alt border border-line text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light/60 transition-all";

const iconInputCls = `${inputCls} pl-10`;

/**
 * Controlled editor for structured team members (name + role).
 * Each field is bound independently so name and role cannot overwrite each other.
 */
const TeamMembersEditor = ({
  members,
  onChange,
  nameInputClass = iconInputCls,
  roleInputClass = inputCls,
  addLabel = "Add team member",
  maxMembers = 12,
}) => {
  const rows = Array.isArray(members) && members.length ? members : [EMPTY_MEMBER()];

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    if (rows.length >= maxMembers) return;
    onChange([...rows, EMPTY_MEMBER()]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      onChange([EMPTY_MEMBER()]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {rows.map((member, index) => {
        const nameId = `team-member-name-${member._key}`;
        const roleId = `team-member-role-${member._key}`;

        return (
          <div key={member._key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div>
              <label htmlFor={nameId} className="sr-only">
                Team member {index + 1} name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted w-4 h-4" />
                <input
                  id={nameId}
                  name={`team_member_name_${index}`}
                  type="text"
                  autoComplete="name"
                  placeholder="Full name"
                  value={member.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  className={nameInputClass}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor={roleId} className="sr-only">
                  Team member {index + 1} role
                </label>
                <input
                  id={roleId}
                  name={`team_member_role_${index}`}
                  type="text"
                  autoComplete="organization-title"
                  placeholder="Role (e.g., CTO)"
                  value={member.role}
                  onChange={(e) => updateRow(index, { role: e.target.value })}
                  className={roleInputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-2.5 rounded-lg text-content-muted hover:text-error hover:bg-error/10 transition-all shrink-0"
                aria-label={`Remove team member ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
      {rows.length < maxMembers && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
};

export default TeamMembersEditor;
