import { describe, expect, it } from 'vitest';
import {
  assertRepresentativeClaimTransition,
  assertRepresentativeResourceEditable,
} from '../src/organizations/access.js';

describe('bounded representative membership rules', () => {
  it('allows only legal claim transitions and keeps terminal claims terminal', () => {
    expect(() => assertRepresentativeClaimTransition('PENDING', 'APPROVED')).not.toThrow();
    expect(() => assertRepresentativeClaimTransition('NEEDS_MORE_INFO', 'REJECTED')).not.toThrow();
    expect(() => assertRepresentativeClaimTransition('APPROVED', 'REVOKED')).not.toThrow();
    expect(() => assertRepresentativeClaimTransition('REJECTED', 'APPROVED')).toThrow(
      /cannot change/,
    );
    expect(() => assertRepresentativeClaimTransition('REVOKED', 'APPROVED')).toThrow(
      /cannot change/,
    );
    expect(() => assertRepresentativeClaimTransition('APPROVED', 'APPROVED')).toThrow(
      /cannot change/,
    );
  });

  it('denies edits to rejected, suspended, and archived resources', () => {
    for (const resource of [
      { verificationStatus: 'REJECTED', publicationStatus: 'UNPUBLISHED' },
      { verificationStatus: 'SUSPENDED', publicationStatus: 'UNPUBLISHED' },
      { verificationStatus: 'VERIFIED', publicationStatus: 'ARCHIVED' },
    ]) {
      expect(() => assertRepresentativeResourceEditable(resource, 'organization')).toThrow(
        /cannot be edited/,
      );
    }
    expect(() =>
      assertRepresentativeResourceEditable(
        { verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'UNPUBLISHED' },
        'temple',
      ),
    ).not.toThrow();
  });
});
