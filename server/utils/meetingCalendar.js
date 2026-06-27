const pad = (value) => String(value).padStart(2, "0");

const toIcsUtc = (value) => {
  const date = new Date(value);
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
};

const escapeIcs = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const FORMAT_LABELS = {
  VIDEO_CALL: "Video call",
  PHONE_CALL: "Phone call",
  IN_PERSON: "In person",
};

export const buildMeetingIcs = ({
  meeting,
  organizerName,
  attendeeName,
  connectionsUrl,
}) => {
  const start = toIcsUtc(meeting.proposed_at);
  const endDate = new Date(meeting.proposed_at);
  endDate.setUTCHours(endDate.getUTCHours() + 1);
  const end = toIcsUtc(endDate);
  const formatLabel = FORMAT_LABELS[meeting.format] || meeting.format;
  const description = [
    `Format: ${formatLabel}`,
    meeting.message ? `Message: ${meeting.message}` : null,
    connectionsUrl ? `Connections: ${connectionsUrl}` : null,
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StartupConnect//Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:meeting-${meeting.id}@startup-connect`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(meeting.agenda)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    organizerName ? `ORGANIZER;CN=${escapeIcs(organizerName)}:mailto:noreply@startupconnect.local` : null,
    attendeeName ? `ATTENDEE;CN=${escapeIcs(attendeeName)}:mailto:noreply@startupconnect.local` : null,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
};
