// app/dashboard/data/config.ts
// components/staff-components/types.ts
export interface Task {
  id: string;
  task: string;
  dept: string;
  statusText: string;
  statusClass: string;
  due: string;
  overdue: boolean;
  patient: string;
  assignee: string;
  mode: "wc" | "gm";
  notes: { ts: string; user: string; line: string }[];
  actions: string[];
  sourceDocument?: string;
}
  
  export interface Note {
    ts: string;
    user: string;
    line: string;
  }
  
  export const NOTE_PRESETS: Record<string, { type: string[]; more: string[] }> = {
    'Scheduling': { type: ['Update…', 'Left VM', 'Spoke w/ patient', 'Scheduled', 'Awaiting facility'], more: ['Details…', 'AM slot', 'Open MRI Fresno', 'Interpreter', 'Confirmed time'] },
    'RFA/IMR': { type: ['Update…', 'UR received', 'No response — escalate', 'IMR in prep', 'IMR submitted'], more: ['Details…', 'Day 4 reminder', 'Denial — evidence added', 'Certified → Scheduling'] },
    'Physician Review': { type: ['Update…', 'Reviewed', 'Sign‑off pending', 'Plan updated', 'Approved', 'Denied', 'Needs visit'], more: ['Details…', 'Findings noted', 'Refer', 'Discuss next visit', 'Pain score verified', 'PDMP checked', '30‑day supply'] },
    'Intake': { type: ['Update…', 'Records merged', 'DFR scheduled', 'Insurance verified'], more: ['Details…', 'Translator needed', 'Attorney on file', 'Copay confirmed'] },
    'Admin/Compliance': { type: ['Update…', 'Chart archived', 'Billing closed', 'Attorney notified'], more: ['Details…', 'Final balance $0', 'Records exported', 'Remove from Pulse'] },
    'Billing/Compliance': { type: ['Update…', 'Reviewed EOR', 'Appeal submitted', 'Paid in full'], more: ['Details…', 'Fee schedule applied', 'Need records', 'Contacted payer'] },
    'Legal/Attorney Liaison': { type: ['Update…', 'Verified firm', 'Updated contact', 'Substitution filed', 'Notice sent'], more: ['Details…', 'MPN checked', 'Conflict none', 'Repeat referral', 'Attorney portal updated'] },
    'Prior Authorization': { type: ['Update…', 'Submitted', 'Denied — appeal', 'Approved — proceed'], more: ['Details…', 'Plan faxed', 'Peer review pending', 'Member ID confirmed'] },
    'Intake/Registration': { type: ['Update…', 'Packet sent', 'Packet received', 'Eligibility uploaded'], more: ['Details…', 'Translator needed', 'Contact verified', 'Copay policy sent'] },
    'Referrals/Coordination': { type: ['Update…', 'Referral sent', 'Awaiting report', 'Report received'], more: ['Details…', 'Facility confirmed', 'Records attached', 'Follow-up scheduled'] },
    'Billing/Revenue Cycle': { type: ['Update…', 'EOB reviewed', 'Appeal submitted', 'Paid in full'], more: ['Details…', 'Missing docs requested', 'Contacted payer', 'Payment posted'] },
    'Quality & Compliance': { type: ['Update…', 'Report awaited', 'Report received', 'Closed'], more: ['Details…', 'Specialty', 'Reminder sent', 'Escalate to MD'] },
    'Patient Outreach': { type: ['Update…', 'Left VM', 'Patient reached', 'Resolved'], more: ['Details…', 'Callback window', 'Interpreter', 'Reschedule offered'] },
    'P2P': { type: ['Update…', 'Reviewed', 'Sign‑off pending', 'Plan updated', 'Approved', 'Denied', 'Needs visit'], more: ['Details…', 'Findings noted', 'Refer', 'Discuss next visit', 'Pain score verified', 'PDMP checked', '30‑day supply'] },
  };
  
  export const DEPARTMENTS_WC = ['Scheduling', 'RFA/IMR', 'Physician Review', 'Intake', 'Admin/Compliance', 'Billing/Compliance', 'Legal/Attorney Liaison'];
  export const DEPARTMENTS_GM = ['Scheduling', 'Prior Authorization', 'Physician Review', 'Intake/Registration', 'Referrals/Coordination', 'Billing/Revenue Cycle', 'Quality & Compliance', 'Patient Outreach'];
  
  export const PULSE_WC = {
    labels: ['New Patients (Month)', 'New Attorneys (Week)', 'RFAs Monitored', 'QME/IME Upcoming', 'Billing Disputes', 'Outside Consults'],
    vals: ['22', '3', '7', '2', '1', '4'],
    deptRows: [
      ['Scheduling', 9, 2, 6, 3],
      ['RFA/IMR', 7, 1, 5, 2],
      ['Physician Review', 4, 0, 2, 2],
      ['Intake', 3, 0, 3, 0],
      ['Admin/Compliance', 2, 0, 1, 1],
      ['Billing/Compliance', 1, 0, 0, 1],
      ['Legal/Attorney Liaison', 1, 0, 1, 0],
    ],
  };
  
  export const PULSE_GM = {
    labels: ['New Patients (Month)', 'Prior Auths Pending', 'Open Referrals', 'Specialist Reports Awaited', 'Tasks Overdue', 'Documents Processed Today'],
    vals: ['22', '5', '8', '6', '4', '19'],
    deptRows: [
      ['Scheduling', 8, 2, 6, 2],
      ['Prior Authorization', 5, 1, 4, 1],
      ['Physician Review', 4, 0, 2, 2],
      ['Intake/Registration', 3, 0, 3, 0],
      ['Referrals/Coordination', 6, 1, 4, 2],
      ['Billing/Revenue Cycle', 2, 0, 1, 1],
      ['Quality & Compliance', 2, 0, 2, 0],
      ['Patient Outreach', 3, 0, 2, 1],
    ],
  };
  
  export const initialTasks: Task[] = [
    // WC
    { id: 'tMRI', dept: 'Scheduling', overdue: true, task: 'Schedule MRI (Authorization)', statusText: 'Pending', statusClass: 'pending', due: 'Oct 12', patient: null, notes: [], assignee: null, mode: 'wc' },
    { id: 'tQME', dept: 'Scheduling', overdue: false, task: 'Track QME/IME Date + Request Report', statusText: 'Pending', statusClass: 'pending', due: '—', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 'tFAC', dept: 'Scheduling', overdue: false, task: 'Follow‑up on Scheduling Attempt', statusText: 'Pending', statusClass: 'pending', due: 'Oct 13', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 't2', dept: 'RFA/IMR', overdue: true, task: 'Monitor 5‑Day Rule — PT Lumbar', statusText: 'Pending', statusClass: 'pending', due: 'Oct 11', patient: 'Lopez, M', notes: [], assignee: null, mode: 'wc' },
    { id: 'tP2P', dept: 'P2P', overdue: false, task: 'Prepare Written P2P Response', statusText: 'Awaiting MD', statusClass: 'waiting', due: '3 days', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 'tREF', dept: 'Physician Review', overdue: false, task: 'Review Medication Refill Request', statusText: 'Pending', statusClass: 'pending', due: 'Today', patient: '—', notes: [], assignee: null, mode: undefined },
    { id: 'tRES', dept: 'Physician Review', overdue: false, task: 'Review Diagnostic Results + Update Chart', statusText: 'Pending', statusClass: 'pending', due: 'Oct 13', patient: '—', notes: [], assignee: null, mode: undefined },
    { id: 'tNEWREC', dept: 'Intake', overdue: false, task: 'Chart Prep – Integrate Outside Records', statusText: 'Pending', statusClass: 'pending', due: 'Same day', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 'tCR', dept: 'Admin/Compliance', overdue: true, task: 'Archive Patient / Notify Billing (C&R)', statusText: 'Pending', statusClass: 'pending', due: 'Immediate', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 'tNOR', dept: 'Legal/Attorney Liaison', overdue: false, task: 'Update Attorney Records + Verify MPN', statusText: 'Pending', statusClass: 'pending', due: '3 days', patient: '—', notes: [], assignee: null, mode: 'wc' },
    { id: 'tEOR', dept: 'Billing/Compliance', overdue: false, task: 'Review Fee Dispute / Balance Check', statusText: 'Pending', statusClass: 'pending', due: '3 days', patient: '—', notes: [], assignee: null, mode: 'wc' },
    // GM
    { id: 'gmSCH1', dept: 'Scheduling', overdue: false, task: 'Schedule New Patient Visit', statusText: 'Pending', statusClass: 'pending', due: 'Today', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmPA1', dept: 'Prior Authorization', overdue: false, task: 'Prior Auth — Medication', statusText: 'Pending', statusClass: 'pending', due: '2 days', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmIN1', dept: 'Intake/Registration', overdue: false, task: 'Complete Registration Packet', statusText: 'Pending', statusClass: 'pending', due: 'Today', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmREF1', dept: 'Referrals/Coordination', overdue: false, task: 'Coordinate Cardiology Referral', statusText: 'Pending', statusClass: 'pending', due: '3 days', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmRCM1', dept: 'Billing/Revenue Cycle', overdue: false, task: 'EOB Denial Follow‑up — Missing Documentation', statusText: 'Pending', statusClass: 'pending', due: '2 days', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmQ1', dept: 'Quality & Compliance', overdue: false, task: 'Specialist Report Awaited — Cardiology', statusText: 'Pending', statusClass: 'pending', due: 'Oct 20', patient: '—', notes: [], assignee: null, mode: 'gm' },
    { id: 'gmOUT1', dept: 'Patient Outreach', overdue: false, task: 'Outreach Follow‑up — Callback Needed', statusText: 'Pending', statusClass: 'pending', due: 'Today', patient: '—', notes: [], assignee: null, mode: 'gm' },
  ];
  
  export const paneToFilter: Record<string, (t: Task) => boolean> = {
    all: () => true,
    overdue: (t: Task) => t.overdue,
    md: (t: Task) => t.dept === 'Physician Review',
    p2p: (t: Task) => t.dept === 'P2P',
    scheduling: (t: Task) => t.dept === 'Scheduling' && t.mode !== 'gm',
    rfa: (t: Task) => t.dept === 'RFA/IMR',
    intake: (t: Task) => t.dept === 'Intake',
    admin: (t: Task) => t.dept === 'Admin/Compliance',
    legal: (t: Task) => t.dept === 'Legal/Attorney Liaison',
    billing: (t: Task) => t.dept === 'Billing/Compliance',
    'gm-scheduling': (t: Task) => t.dept === 'Scheduling' && t.mode === 'gm',
    'gm-priorauth': (t: Task) => t.dept === 'Prior Authorization',
    'gm-intake': (t: Task) => t.dept === 'Intake/Registration',
    'gm-referrals': (t: Task) => t.dept === 'Referrals/Coordination',
    'gm-billing': (t: Task) => t.dept === 'Billing/Revenue Cycle',
    'gm-quality': (t: Task) => t.dept === 'Quality & Compliance',
    'gm-outreach': (t: Task) => t.dept === 'Patient Outreach',
  };
  
  export const tabs = [
    { pane: 'all' as const, modes: ['wc', 'gm'], text: 'All' },
    { pane: 'overdue' as const, modes: ['wc', 'gm'], text: 'Overdue' },
    { pane: 'md' as const, modes: ['wc', 'gm'], text: 'Physician Review' },
    { pane: 'scheduling' as const, modes: ['wc'], text: 'Scheduling' },
    { pane: 'rfa' as const, modes: ['wc'], text: 'RFA/IMR' },
    { pane: 'p2p' as const, modes: ['wc'], text: 'P2P' },
    { pane: 'intake' as const, modes: ['wc'], text: 'Intake' },
    { pane: 'admin' as const, modes: ['wc'], text: 'Admin/Compliance' },
    { pane: 'legal' as const, modes: ['wc'], text: 'Legal/Attorney Liaison' },
    { pane: 'billing' as const, modes: ['wc'], text: 'Billing/Compliance' },
    { pane: 'gm-scheduling' as const, modes: ['gm'], text: 'Scheduling' },
    { pane: 'gm-priorauth' as const, modes: ['gm'], text: 'Prior Auth' },
    { pane: 'gm-intake' as const, modes: ['gm'], text: 'Intake/Registration' },
    { pane: 'gm-referrals' as const, modes: ['gm'], text: 'Referrals/Coordination' },
    { pane: 'gm-billing' as const, modes: ['gm'], text: 'Billing/Revenue Cycle' },
    { pane: 'gm-quality' as const, modes: ['gm'], text: 'Quality & Compliance' },
    { pane: 'gm-outreach' as const, modes: ['gm'], text: 'Patient Outreach' },
  ];















