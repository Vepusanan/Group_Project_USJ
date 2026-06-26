import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTeamMembersFromProfile,
  serializeTeamMembers,
  formatTeamMembersForDisplay,
} from "../../shared/teamMembers.mjs";

test("parseTeamMembersFromProfile reads JSON name/role pairs", () => {
  const rows = parseTeamMembersFromProfile(
    JSON.stringify([{ name: "John Doe", role: "CTO" }]),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "John Doe");
  assert.equal(rows[0].role, "CTO");
});

test("serializeTeamMembers preserves distinct name and role", () => {
  const payload = serializeTeamMembers([
    { name: "John Doe", role: "CTO" },
  ]);
  assert.equal(payload, JSON.stringify([{ name: "John Doe", role: "CTO" }]));
});

test("parseTeamMembersFromProfile supports legacy free text", () => {
  const rows = parseTeamMembersFromProfile("CTO: 10 yrs ML at Google");
  assert.equal(rows[0].name, "CTO: 10 yrs ML at Google");
  assert.equal(rows[0].role, "");
});

test("formatTeamMembersForDisplay renders name and role", () => {
  const lines = formatTeamMembersForDisplay(
    [{ name: "John Doe", role: "CTO" }],
  );
  assert.deepEqual(lines, ["John Doe — CTO"]);
});
