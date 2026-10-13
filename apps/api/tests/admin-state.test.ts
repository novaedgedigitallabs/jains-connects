import { describe, expect, it } from 'vitest';
import { assertPublicationState, assertVerificationTransition } from '../src/admin/state.js';

describe('admin state transitions', () => {
  it('requires review before a pending record can be published', () => {
    expect(() => assertPublicationState('PENDING', 'PUBLISHED')).toThrow(/Only verified/);
    expect(() => assertPublicationState('VERIFIED', 'PUBLISHED')).not.toThrow();
  });

  it('does not allow rejected records to jump directly to verified', () => {
    expect(() => assertVerificationTransition('REJECTED', 'VERIFIED')).toThrow(/cannot change/);
    expect(() => assertVerificationTransition('REJECTED', 'NEEDS_REVIEW')).not.toThrow();
  });
});
