// "Add to calendar" helpers for interview dates (all-day events, no external API needed)

const ymd = (d) => new Date(d).toISOString().slice(0, 10).replace(/-/g, '');
const nextDay = (d) => new Date(new Date(d).getTime() + 86_400_000);

const eventText = (app) => ({
  title: `Interview: ${app.company} – ${app.role}`,
  details: [app.jobUrl && `Job posting: ${app.jobUrl}`, app.contactName && `Contact: ${app.contactName}`, app.notes]
    .filter(Boolean)
    .join('\n'),
});

export function googleCalendarUrl(app, date) {
  const { title, details } = eventText(app);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${ymd(date)}/${ymd(nextDay(date))}`,
    details,
    location: app.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// .ics works with Apple Calendar, Outlook, etc.
export function downloadIcs(app, date) {
  const { title, details } = eventText(app);
  const esc = (s) => String(s).replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//JobTrackr//EN', 'BEGIN:VEVENT',
    `UID:${app._id || Date.now()}-interview@jobtrackr`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(date)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(date))}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details)}`,
    `LOCATION:${esc(app.location || '')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `interview-${app.company.replace(/\W+/g, '-').toLowerCase()}.ics`,
  });
  link.click();
  URL.revokeObjectURL(url);
}
