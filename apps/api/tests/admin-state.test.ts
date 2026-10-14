import { describe, expect, it } from 'vitest';
import {
  assertCorrectionTransition,
  assertPublicationState,
  assertReportResolution,
  assertReportTransition,
  assertVerificationTransition,
} from '../src/admin/state.js';

describe('admin state transitions', () => {
  it('requires review before a pending record can be published', () => {
    expect(() => assertPublicationState('PENDING', 'PUBLISHED')).toThrow(/Only verified/);
    expect(() => assertPublicationState('VERIFIED', 'PUBLISHED')).not.toThrow();
  });

  it('does not allow rejected records to jump directly to verified', () => {
    expect(() => assertVerificationTransition('REJECTED', 'VERIFIED')).toThrow(/cannot change/);
    expect(() => assertVerificationTransition('REJECTED', 'NEEDS_REVIEW')).not.toThrow();
  });

  it('requires report resolution and prevents invalid terminal transitions', () => {
    expect(() => assertReportResolution('ACTIONED', undefined)).toThrow(/resolution code/);
    expect(() => assertReportResolution('DISMISSED', 'DUPLICATE')).not.toThrow();
    expect(() => assertReportTransition('ACTIONED', 'DISMISSED')).toThrow(/cannot change/);
    expect(() => assertReportTransition('ACTIONED', 'OPEN')).not.toThrow();
  });

  it('keeps correction decisions explicit and terminal', () => {
    expect(() => assertCorrectionTransition('SUBMITTED', 'APPROVED')).not.toThrow();
    expect(() => assertCorrectionTransition('APPROVED', 'SUBMITTED')).toThrow(/cannot change/);
    expect(() => assertCorrectionTransition('NEEDS_CHANGES', 'SUBMITTED')).not.toThrow();
  });
});
