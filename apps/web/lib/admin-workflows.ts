export type WorkflowAction = {
  status: string;
  label: string;
  variant?: 'secondary' | 'danger';
};

const correctionActions: Record<string, readonly WorkflowAction[]> = {
  SUBMITTED: [
    { status: 'IN_REVIEW', label: 'Start review' },
    { status: 'NEEDS_CHANGES', label: 'Need changes', variant: 'secondary' },
    { status: 'APPROVED', label: 'Accept suggestion' },
    { status: 'REJECTED', label: 'Reject', variant: 'danger' },
    { status: 'WITHDRAWN', label: 'Withdraw', variant: 'danger' },
  ],
  IN_REVIEW: [
    { status: 'NEEDS_CHANGES', label: 'Need changes', variant: 'secondary' },
    { status: 'APPROVED', label: 'Accept suggestion' },
    { status: 'REJECTED', label: 'Reject', variant: 'danger' },
    { status: 'WITHDRAWN', label: 'Withdraw', variant: 'danger' },
  ],
  NEEDS_CHANGES: [
    { status: 'SUBMITTED', label: 'Resubmit' },
    { status: 'IN_REVIEW', label: 'Start review' },
    { status: 'WITHDRAWN', label: 'Withdraw', variant: 'danger' },
  ],
  APPROVED: [],
  REJECTED: [{ status: 'SUBMITTED', label: 'Resubmit' }],
  WITHDRAWN: [],
};

const reportActions: Record<string, readonly WorkflowAction[]> = {
  OPEN: [
    { status: 'IN_REVIEW', label: 'Start review' },
    { status: 'ACTIONED', label: 'Mark actioned' },
    { status: 'DISMISSED', label: 'Dismiss', variant: 'secondary' },
  ],
  IN_REVIEW: [
    { status: 'OPEN', label: 'Reopen', variant: 'secondary' },
    { status: 'ACTIONED', label: 'Mark actioned' },
    { status: 'DISMISSED', label: 'Dismiss', variant: 'secondary' },
  ],
  ACTIONED: [{ status: 'OPEN', label: 'Reopen', variant: 'secondary' }],
  DISMISSED: [{ status: 'OPEN', label: 'Reopen', variant: 'secondary' }],
};

export function correctionActionsForStatus(status: string): readonly WorkflowAction[] {
  return correctionActions[status] ?? [];
}

export function reportActionsForStatus(status: string): readonly WorkflowAction[] {
  return reportActions[status] ?? [];
}
