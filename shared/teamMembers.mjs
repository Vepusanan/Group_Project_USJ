const EMPTY_MEMBER = () => ({
  _key: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  name: "",
  role: "",
});

/**
 * Parse key_team_members from API/DB into editable rows.
 * Supports JSON [{ name, role }] and legacy free-text strings.
 */
export function parseTeamMembersFromProfile(value) {
  if (value == null || value === "") {
    return [EMPTY_MEMBER()];
  }

  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (typeof item === "string") {
          return { ...EMPTY_MEMBER(), name: item.trim() };
        }
        if (item && typeof item === "object") {
          return {
            ...EMPTY_MEMBER(),
            name: String(item.name ?? "").trim(),
            role: String(item.role ?? "").trim(),
          };
        }
        return null;
      })
      .filter((row) => row && (row.name || row.role));

    return rows.length ? rows : [EMPTY_MEMBER()];
  }

  if (typeof value === "object") {
    return parseTeamMembersFromProfile([value]);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [EMPTY_MEMBER()];

    try {
      const parsed = JSON.parse(trimmed);
      return parseTeamMembersFromProfile(parsed);
    } catch {
      return [{ ...EMPTY_MEMBER(), name: trimmed }];
    }
  }

  return [EMPTY_MEMBER()];
}

/**
 * Serialize editable rows for API storage (key_team_members TEXT / JSON).
 */
export function serializeTeamMembers(rows) {
  if (!Array.isArray(rows)) return null;

  const normalized = rows
    .map((row) => ({
      name: String(row?.name ?? "").trim(),
      role: String(row?.role ?? "").trim(),
    }))
    .filter((row) => row.name || row.role);

  if (!normalized.length) return null;
  return JSON.stringify(normalized);
}

/**
 * Format team members for read-only display.
 */
export function formatTeamMembersForDisplay(value) {
  const rows = parseTeamMembersFromProfile(value);
  const filled = rows.filter((row) => row.name || row.role);
  if (!filled.length) return null;

  return filled.map((row) => {
    if (row.name && row.role) return `${row.name} — ${row.role}`;
    return row.name || row.role;
  });
}

export { EMPTY_MEMBER };
