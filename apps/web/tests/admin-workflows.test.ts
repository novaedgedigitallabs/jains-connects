import { describe, expect, it } from 'vitest';
import { correctionActionsForStatus, reportActionsForStatus } from '../lib/admin-workflows';

describe('admin workflow controls', () => {
  it('exposes only legal correction transitions', () => {
    expect(correctionActionsForStatus('SUBMITTED').map((action) => action.status)).toEqual([
      'IN_REVIEW',
      'NEEDS_CHANGES',
      'APPROVED',
      'REJECTED',
      'WITHDRAWN',
    ]);
    expect(correctionActionsForStatus('IN_REVIEW').map((action) => action.status)).toEqual([
      'NEEDS_CHANGES',
      'APPROVED',
      'REJECTED',
      'WITHDRAWN',
    ]);
    expect(correctionActionsForStatus('NEEDS_CHANGES').map((action) => action.status)).toEqual([
      'SUBMITTED',
      'IN_REVIEW',
      'WITHDRAWN',
    ]);
    expect(correctionActionsForStatus('APPROVED')).toEqual([]);
    expect(correctionActionsForStatus('REJECTED').map((action) => action.status)).toEqual([
      'SUBMITTED',
    ]);
    expect(correctionActionsForStatus('WITHDRAWN')).toEqual([]);
  });

  it('keeps report reopen controls available only from resolvable states', () => {
    expect(reportActionsForStatus('OPEN').map((action) => action.status)).toEqual([
      'IN_REVIEW',
      'ACTIONED',
      'DISMISSED',
    ]);
    expect(reportActionsForStatus('IN_REVIEW').map((action) => action.status)).toEqual([
      'OPEN',
      'ACTIONED',
      'DISMISSED',
    ]);
    expect(reportActionsForStatus('ACTIONED').map((action) => action.status)).toEqual(['OPEN']);
    expect(reportActionsForStatus('DISMISSED').map((action) => action.status)).toEqual(['OPEN']);
  });
});
