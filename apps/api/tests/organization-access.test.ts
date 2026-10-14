import { describe, expect, it } from 'vitest';
import {
  assertRepresentativeEdit,
  assertRepresentativeTempleEdit,
} from '../src/organizations/access.js';

describe('organization-scoped field permissions', () => {
  it('allows approved owners/managers to edit only public fields', () => {
    expect(() => assertRepresentativeEdit('OWNER', ['name', 'slug', 'description'])).not.toThrow();
    expect(() => assertRepresentativeEdit('MANAGER', ['publicEmail', 'websiteUrl'])).not.toThrow();
    expect(() => assertRepresentativeEdit('OWNER', ['verificationStatus'])).toThrow(/cannot edit/);
    expect(() => assertRepresentativeEdit('MANAGER', ['publicationStatus'])).toThrow(/cannot edit/);
  });

  it('restricts editor identity changes and prevents viewer writes', () => {
    expect(() => assertRepresentativeEdit('EDITOR', ['description', 'publicPhone'])).not.toThrow();
    expect(() => assertRepresentativeEdit('EDITOR', ['slug'])).toThrow(/cannot edit/);
    expect(() => assertRepresentativeEdit('VIEWER', ['description'])).toThrow(/cannot edit/);
  });

  it('keeps temple association and lifecycle fields server-controlled', () => {
    expect(() => assertRepresentativeTempleEdit('EDITOR', ['darshanInformation'])).not.toThrow();
    expect(() => assertRepresentativeTempleEdit('OWNER', ['organizationId'])).toThrow(
      /cannot edit/,
    );
    expect(() => assertRepresentativeTempleEdit('MANAGER', ['publicationStatus'])).toThrow(
      /cannot edit/,
    );
  });
});
