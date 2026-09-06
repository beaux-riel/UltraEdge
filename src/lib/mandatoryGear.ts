import { Event } from './database.types';
import { EventGearAllocation } from './eventGear';
export type GearRequirement = NonNullable<Event['mandatoryGear']>[number];
export function requirementStatus(
  requirement: GearRequirement,
  allocations: EventGearAllocation[],
  activeGearIds: string[],
) {
  const selected = allocations.filter(
    (a) =>
      requirement.gearIds.includes(a.gearItemId) &&
      activeGearIds.includes(a.gearItemId) &&
      (a.isCarried || a.isWorn),
  );
  const assigned = selected.reduce((sum, a) => sum + a.quantity, 0);
  const packed = selected
    .filter((a) => a.isPacked)
    .reduce((sum, a) => sum + a.quantity, 0);
  return {
    assigned,
    packed,
    missing: Math.max(0, requirement.quantity - packed),
    ready: packed >= requirement.quantity,
  };
}
