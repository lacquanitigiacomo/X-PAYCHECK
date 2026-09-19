import type { AccountState } from '../auth/types';
import { resolvePendingPlanCancellationDestination } from '../navigation/routes';

type PendingPlanCancellationDependencies = {
  cancelOnServer: () => Promise<AccountState>;
  resetToPlanChoice: (account: AccountState) => Promise<void>;
};

export async function cancelPendingPlan(
  dependencies: PendingPlanCancellationDependencies,
): Promise<AccountState> {
  const account = await dependencies.cancelOnServer();
  if (!resolvePendingPlanCancellationDestination(account)) {
    throw new Error('Lo stato piano restituito dal server non è valido');
  }
  await dependencies.resetToPlanChoice(account);
  return account;
}
