import { branchHeaders } from '@/lib/branch-headers';

it('adds x-branch-id and, when known, x-brand-id', () => {
  expect(branchHeaders({ branchId: 'b1' })).toEqual({ 'x-branch-id': 'b1' });
  expect(branchHeaders({ branchId: 'b1', brandId: 'r1' })).toEqual({ 'x-branch-id': 'b1', 'x-brand-id': 'r1' });
  expect(branchHeaders({ branchId: 'b1', brandId: null })).toEqual({ 'x-branch-id': 'b1' });
});
