export const generateICal = (events = [], propertyTitle = "Property") => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Your Website//Unified Property Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(propertyTitle)}`,
  ];

  for (const event of events) {
    if (!event.start || !event.end) continue;

    const start = formatICalDate(event.start);
    const end = formatICalDate(event.end);

    const uid =
      event.uid ||
      `${start}-${end}-${Math.random().toString(36).substring(2, 12)}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatICalDateTime(new Date())}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeICalText(event.summary || "Reserved")}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
};


// ==========================================
// DATE ONLY
// ==========================================

const formatICalDate = (value) => {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
};


// ==========================================
// DATETIME
// ==========================================

const formatICalDateTime = (value) => {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return "";
  }

  return (
    date.getUTCFullYear() +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    String(date.getUTCDate()).padStart(2, "0") +
    "T" +
    String(date.getUTCHours()).padStart(2, "0") +
    String(date.getUTCMinutes()).padStart(2, "0") +
    String(date.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
};


// ==========================================
// ICAL TEXT ESCAPE
// ==========================================

const escapeICalText = (value = "") => {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
};