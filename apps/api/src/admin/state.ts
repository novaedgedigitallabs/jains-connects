import { AppError } from '../http/errors.js';

export type VerificationState = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'NEEDS_REVIEW';

export type PublicationState = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

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
