import { AppError } from '../http/errors.js';

export type OrganizationMembershipRole = 'OWNER' | 'MANAGER' | 'EDITOR' | 'VIEWER';

export type RepresentativeClaimStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO' | 'REVOKED';

const representativeEditFields = [
  'name',
  'slug',
  'organizationType',
  'description',
  'publicEmail',
  'publicPhone',
  'websiteUrl',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
] as const;

const representativeTempleEditFields = [
  'name',
  'slug',
  'traditionOrLineage',
  'description',
  'history',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
  'timezone',
  'publicEmail',
  'publicPhone',
  'websiteUrl',
  'darshanInformation',
] as const;

export function canEditOrganization(role: OrganizationMembershipRole): boolean {
  return role !== 'VIEWER';
}

export function canEditField(role: OrganizationMembershipRole, field: string): boolean {
  if (!representativeEditFields.includes(field as (typeof representativeEditFields)[number])) {
    return false;
  }
  return (
    role === 'OWNER' ||
    role === 'MANAGER' ||
    (role === 'EDITOR' && field !== 'slug' && field !== 'organizationType')
  );
}

export function canEditTempleField(role: OrganizationMembershipRole, field: string): boolean {
  if (
    !representativeTempleEditFields.includes(
      field as (typeof representativeTempleEditFields)[number],
    )
  ) {
    return false;
  }
  return role === 'OWNER' || role === 'MANAGER' || (role === 'EDITOR' && field !== 'slug');
}

const representativeClaimTransitions: Record<
  RepresentativeClaimStatus,
  readonly RepresentativeClaimStatus[]
> = {
  PENDING: ['APPROVED', 'REJECTED', 'NEEDS_MORE_INFO'],
  NEEDS_MORE_INFO: ['APPROVED', 'REJECTED'],
  APPROVED: ['REVOKED'],
  REJECTED: [],
  REVOKED: [],
};

export function assertRepresentativeClaimTransition(
  current: RepresentativeClaimStatus,
  next: RepresentativeClaimStatus,
): void {
  if (current === next || !representativeClaimTransitions[current].includes(next)) {
    throw new AppError(
      409,
      'INVALID_CLAIM_TRANSITION',
      `Representative claim cannot change from ${current} to ${next}`,
    );
  }
}

export function isEligiblePublicOrganization(
  verificationStatus: string,
  publicationStatus: string,
): boolean {
  return verificationStatus === 'VERIFIED' && publicationStatus === 'PUBLISHED';
}

export function assertRepresentativeResourceEditable(
  resource: { verificationStatus: string; publicationStatus: string },
  resourceLabel: 'organization' | 'temple',
): void {
  if (
    resource.verificationStatus === 'REJECTED' ||
    resource.verificationStatus === 'SUSPENDED' ||
    resource.publicationStatus === 'ARCHIVED'
  ) {
    throw new AppError(
      409,
      'REPRESENTATIVE_EDIT_NOT_ALLOWED',
      `This ${resourceLabel} cannot be edited while rejected, suspended, or archived`,
    );
  }
}

export function assertRepresentativeEdit(role: OrganizationMembershipRole, fields: string[]): void {
  if (!canEditOrganization(role)) {
    throw new AppError(
      403,
      'ORGANIZATION_ACCESS_DENIED',
      'This membership cannot edit the organization',
    );
  }
  const forbidden = fields.find((field) => !canEditField(role, field));
  if (forbidden) {
    throw new AppError(
      403,
      'ORGANIZATION_FIELD_FORBIDDEN',
      `This membership cannot edit ${forbidden}`,
    );
  }
}

export function assertRepresentativeTempleEdit(
  role: OrganizationMembershipRole,
  fields: string[],
): void {
  if (!canEditOrganization(role)) {
    throw new AppError(
      403,
      'ORGANIZATION_ACCESS_DENIED',
      'This membership cannot edit temple records',
    );
  }
  const forbidden = fields.find((field) => !canEditTempleField(role, field));
  if (forbidden) {
    throw new AppError(
      403,
      'ORGANIZATION_FIELD_FORBIDDEN',
      `This membership cannot edit ${forbidden}`,
    );
  }
}
