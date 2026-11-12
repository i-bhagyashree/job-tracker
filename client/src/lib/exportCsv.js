import { JOB_TYPES, WORK_MODES, labelOf, statusOf } from './constants';

const COLUMNS = [
  ['Company', (a) => a.company],
  ['Role', (a) => a.role],
  ['Status', (a) => statusOf(a.status).label],
  ['Priority', (a) => a.priority],
  ['Job type', (a) => labelOf(JOB_TYPES, a.jobType)],
  ['Work mode', (a) => (a.workMode ? labelOf(WORK_MODES, a.workMode) : '')],
  ['Location', (a) => a.location],
  ['Stipend / Salary', (a) => a.salary],
  ['Applied on', (a) => a.appliedDate?.slice(0, 10)],
  ['Interview on', (a) => a.interviewDate?.slice(0, 10)],
  ['Follow up on', (a) => a.followUpDate?.slice(0, 10)],
  ['Contact', (a) => a.contactName],
  ['Contact email', (a) => a.contactEmail],
  ['Job URL', (a) => a.jobUrl],
  ['Notes', (a) => a.notes],
  ['Checklist', (a) => (a.tasks || []).map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n')],
];

const escape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(apps) {
  const rows = [COLUMNS.map(([h]) => h), ...apps.map((a) => COLUMNS.map(([, get]) => get(a)))];
  const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\n'); // BOM so Excel reads ₹ correctly
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `job-applications-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  link.click();
  URL.revokeObjectURL(url);
}
