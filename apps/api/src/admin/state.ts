import { AppError } from '../http/errors.js';

export type VerificationState = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'NEEDS_REVIEW';

export type PublicationState = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type ReportState = 'OPEN' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED';

export type CorrectionState =
  'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

const verificationTransitions: Record<VerificationState, readonly VerificationState[]> = {
  PENDING: ['VERIFIED', 'REJECTED', 'NEEDS_REVIEW'],
  VERIFIED: ['NEEDS_REVIEW', 'SUSPENDED'],
  REJECTED: ['NEEDS_REVIEW'],
  SUSPENDED: ['NEEDS_REVIEW', 'VERIFIED'],
  NEEDS_REVIEW: ['VERIFIED', 'REJECTED', 'SUSPENDED'],
};

export function assertVerificationTransition(
  current: VerificationState,
  next: VerificationState,
): void {
  if (current === next) {
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      'The record already has this verification state',
    );
  }

  if (!verificationTransitions[current].includes(next)) {
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      `Verification cannot change from ${current} to ${next}`,
    );
  }
}

export function assertPublicationState(
  verificationStatus: VerificationState,
  next: PublicationState,
): void {
  if (next === 'PUBLISHED' && verificationStatus !== 'VERIFIED') {
    throw new AppError(
      409,
      'PUBLICATION_REQUIRES_VERIFICATION',
      'Only verified records can be published',
    );
  }
}

const reportTransitions: Record<ReportState, readonly ReportState[]> = {
  OPEN: ['IN_REVIEW', 'ACTIONED', 'DISMISSED'],
  IN_REVIEW: ['OPEN', 'ACTIONED', 'DISMISSED'],
  ACTIONED: ['OPEN'],
  DISMISSED: ['OPEN'],
};

export function assertReportTransition(current: ReportState, next: ReportState): void {
  if (current === next || !reportTransitions[current].includes(next)) {
    throw new AppError(
      409,
      'INVALID_REPORT_TRANSITION',
      `Report cannot change from ${current} to ${next}`,
    );
  }
}

export function assertReportResolution(
  status: ReportState,
  resolutionCode: string | null | undefined,
): void {
  if ((status === 'ACTIONED' || status === 'DISMISSED') && !resolutionCode?.trim()) {
    throw new AppError(
      400,
      'RESOLUTION_REQUIRED',
      'A resolution code is required for this report status',
    );
  }
}

const correctionTransitions: Record<CorrectionState, readonly CorrectionState[]> = {
  SUBMITTED: ['IN_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  IN_REVIEW: ['NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
  NEEDS_CHANGES: ['SUBMITTED', 'IN_REVIEW', 'WITHDRAWN'],
  APPROVED: [],
  REJECTED: ['SUBMITTED'],
  WITHDRAWN: [],
};

export function assertCorrectionTransition(current: CorrectionState, next: CorrectionState): void {
  if (current === next || !correctionTransitions[current].includes(next)) {
    throw new AppError(
      409,
      'INVALID_CORRECTION_TRANSITION',
      `Correction cannot change from ${current} to ${next}`,
    );
  }
}
