import type {
  AccountProfileUpdateInput,
  BadgeCorrectionInput,
  PayslipUploadInput,
  PlanTier,
  ProBillingCycle,
  WorkProfileInput,
} from '@x-paycheck/shared';

export type PrototypeUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  picture?: string;
  tier: PlanTier;
  pendingTier: 'pro' | null;
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | null;
  checkoutStatus: 'not_required' | 'pending' | 'complete';
  onboardingComplete: boolean;
  workProfile: WorkProfileInput | null;
};

export type PrototypePayslip = Omit<PayslipUploadInput, 'confirmReplace'> & {
  id: string;
  userId: string;
  createdAt: string;
};

export type PrototypeBadgeCorrection = {
  previousStartedAt: string;
  previousEndedAt: string | null;
  reason: string;
  correctedAt: string;
};

export type PrototypeBadgeShift = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  corrections: PrototypeBadgeCorrection[];
};

const users = new Map<string, PrototypeUser>();
const payslipsByUser = new Map<string, PrototypePayslip[]>();
const badgeShiftsByUser = new Map<string, PrototypeBadgeShift[]>();

export const prototypeStore = {
  createUser(user: PrototypeUser) {
    users.set(user.id, user);
    return user;
  },

  findUserByEmail(email: string) {
    return [...users.values()].find(user => user.email === email);
  },

  getUser(id: string) {
    return users.get(id);
  },

  activatePro(id: string, billingCycle: ProBillingCycle) {
    const user = users.get(id);
    if (!user) return undefined;

    user.tier = 'pro';
    user.pendingTier = null;
    user.billingCycle = billingCycle;
    user.checkoutStatus = 'complete';
    return user;
  },

  updateProfile(id: string, profile: AccountProfileUpdateInput) {
    const user = users.get(id);
    if (!user) return undefined;

    user.name = profile.name;
    if (profile.picture === null) delete user.picture;
    else user.picture = profile.picture;
    return user;
  },

  cancelPendingPro(id: string) {
    const user = users.get(id);
    if (!user || user.pendingTier !== 'pro' || user.checkoutStatus !== 'pending') return undefined;

    user.tier = 'free';
    user.pendingTier = null;
    user.billingCycle = null;
    user.checkoutStatus = 'not_required';
    return user;
  },

  saveWorkProfile(id: string, workProfile: WorkProfileInput) {
    const user = users.get(id);
    if (!user) return undefined;

    user.workProfile = workProfile;
    user.onboardingComplete = true;
    return user;
  },

  listPayslips(userId: string) {
    return payslipsByUser.get(userId) ?? [];
  },

  savePayslip(payslip: PrototypePayslip, replaceExisting: boolean) {
    const existingPayslips = payslipsByUser.get(payslip.userId) ?? [];
    payslipsByUser.set(payslip.userId, replaceExisting ? [payslip] : [...existingPayslips, payslip]);
    return payslip;
  },

  getOpenBadgeShift(userId: string) {
    return badgeShiftsByUser.get(userId)?.find(shift => shift.endedAt === null);
  },

  listBadgeShifts(userId: string) {
    return badgeShiftsByUser.get(userId) ?? [];
  },

  startBadgeShift(shift: PrototypeBadgeShift) {
    const shifts = badgeShiftsByUser.get(shift.userId) ?? [];
    badgeShiftsByUser.set(shift.userId, [...shifts, shift]);
    return shift;
  },

  stopOpenBadgeShift(userId: string, endedAt: string) {
    const shift = this.getOpenBadgeShift(userId);
    if (!shift) return undefined;

    shift.endedAt = endedAt;
    return shift;
  },

  findBadgeShift(userId: string, shiftId: string) {
    return badgeShiftsByUser.get(userId)?.find(shift => shift.id === shiftId);
  },

  correctBadgeShift(userId: string, shiftId: string, correction: BadgeCorrectionInput, correctedAt: string) {
    const shift = this.findBadgeShift(userId, shiftId);
    if (!shift) return undefined;

    shift.corrections.push({
      previousStartedAt: shift.startedAt,
      previousEndedAt: shift.endedAt,
      reason: correction.reason,
      correctedAt,
    });
    shift.startedAt = correction.startedAt;
    shift.endedAt = correction.endedAt;
    return shift;
  },

  reset() {
    users.clear();
    payslipsByUser.clear();
    badgeShiftsByUser.clear();
  },
};
