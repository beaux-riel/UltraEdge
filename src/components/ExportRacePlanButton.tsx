import { loadOperations } from '../lib/raceOperations';
/**
 * ExportRacePlanButton — generates a shareable race day plan PDF.
 *
 * Gathers the event's checkpoints, crew, gear allocations, and drop bags from
 * the app contexts (plus the per-event relationship records EventDetailScreen
 * keeps in AsyncStorage), loads the course GPX when present, and hands
 * everything to the racePlanPdf builder. Shows a loading state while the PDF
 * renders and an alert if anything fails.
 */

import React, { useState } from 'react';
import { Alert, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { Button } from './ui';
import { useEvents } from '../context/EventContext';
import { useCheckpoints } from '../context/CheckpointContext';
import { useCrewMembers, ROLE_CONFIG } from '../context/CrewContext';
import {
  EVENT_CREW_KEY,
  EventCrewAssignment,
} from '../lib/eventCrew';
import { useGear } from '../context/GearContext';
import { useDropBags } from '../context/DropBagContext';
import {
  exportRacePlan,
  loadGpxXmlForEvent,
  RacePlanCrewMember,
  RacePlanDropBag,
  RacePlanGearItem,
} from '../lib/racePlanPdf';

import { EVENT_GEAR_KEY, EventGearAllocation } from '../lib/eventGear';

interface ExportRacePlanButtonProps {
  eventId: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

async function readJson<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saved plan relationships could not be read.');
  return parsed as T[];
}

export function ExportRacePlanButton({ eventId, fullWidth = true, style }: ExportRacePlanButtonProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const events = useEvents();
  const { getEvent } = events;
  const checkpointsState = useCheckpoints();
  const { getCheckpointsByEventId, getCheckpointById } = checkpointsState;
  const crewState = useCrewMembers();
  const { getCrewMember } = crewState;
  const gearState = useGear();
  const { getGearItem } = gearState;
  const bagsState = useDropBags();
  const { getDropBagsByEvent } = bagsState;

  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    if (generating) {return;}

    if ([events, checkpointsState, crewState, gearState, bagsState].some(state => state.loading || state.error)) {
      Alert.alert('Plan Not Ready', 'All saved planning data must load successfully before exporting. Please reopen the plan and try again.');
      return;
    }

    const event = getEvent(eventId);
    if (!event) {
      Alert.alert('Export Failed', 'This event could not be found.');
      return;
    }

    setGenerating(true);
    try {
      const checkpoints = getCheckpointsByEventId(eventId);

      // Crew assigned to this event, resolved to display strings.
      const crewAssignments = (await readJson<EventCrewAssignment>(EVENT_CREW_KEY)).filter(
        assignment => assignment.eventId === eventId,
      );
      const crew: RacePlanCrewMember[] = [];
      for (const assignment of crewAssignments) {
        const member = getCrewMember(assignment.crewMemberId);
        if (!member) {throw new Error('An assigned crew member is missing. Review crew assignments before exporting.');}
        const roles = assignment.roles ?? [];
        const roleLabel =
          roles.length > 0
            ? roles
                .map(role =>
                  role === 'other' && assignment.customRole
                    ? assignment.customRole
                    : ROLE_CONFIG[role]?.label ?? 'Crew',
                )
                .join(' / ')
            : 'Crew';
        crew.push({
          name: member.name,
          role: roleLabel,
          phone: member.phone,
          email: member.email,
          notes: assignment.notes || member.notes,
        });
      }

      // Gear allocated to this event.
      const gearAllocations = (await readJson<EventGearAllocation>(EVENT_GEAR_KEY)).filter(
        allocation => allocation.eventId === eventId,
      );
      const gear: RacePlanGearItem[] = [];
      for (const allocation of gearAllocations) {
        const item = getGearItem(allocation.gearItemId);
        if (!item) {throw new Error('An allocated gear item is missing. Review gear assignments before exporting.');}
        gear.push({
          name: item.name,
          brand: item.brand ?? null,
          category: item.category,
          quantity: allocation.quantity || 1,
          isWorn: allocation.isWorn,
          isCarried: allocation.isCarried,
          isPacked: allocation.isPacked,
          notes: allocation.notes ?? item.notes ?? null,
        });
      }

      // Drop bags with their checkpoint locations.
      const dropBags: RacePlanDropBag[] = getDropBagsByEvent(eventId).map(bag => ({
        name: bag.name,
        checkpointName: bag.checkpointId
          ? getCheckpointById(eventId, bag.checkpointId)?.name ?? 'Checkpoint unavailable — confirm bag location'
          : null,
        items: bag.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes ?? null,
        })),
        notes: bag.notes,
      }));

      // Course GPX (best-effort; the PDF omits the route section when null).
      const gpxXml = await loadGpxXmlForEvent(eventId, event.gpx_file_url);

      if (event.gpx_file_url && !gpxXml) {
        const proceed = await new Promise<boolean>(resolve => Alert.alert(
          'Route Unavailable',
          'The course route could not be loaded. Export the plan without its route map?',
          [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Export Without Route', onPress: () => resolve(true) }],
          { cancelable: true, onDismiss: () => resolve(false) },
        ));
        if (!proceed) return;
      }
      const operations = await loadOperations(eventId);
      const operationsLogistics = operations.duties.map(duty => `${getCheckpointById(eventId, duty.checkpointId)?.name ?? 'Checkpoint'}: ${getCrewMember(duty.crewMemberId)?.name ?? 'Crew'} — ${duty.role.replace('_', ' ')}`);
      for (const vehicle of operations.vehicles) {
        operationsLogistics.push(`${vehicle.name} • Owner: ${vehicle.ownerId ? getCrewMember(vehicle.ownerId)?.name ?? 'Unassigned' : 'Unassigned'} • Crew: ${vehicle.crewIds.map(id => getCrewMember(id)?.name ?? 'Unassigned').join(', ') || 'None'} • Cargo: ${operations.cargo.filter(item => item.vehicleId === vehicle.id).map(item => item.label).join(', ') || 'None'}`);
      }
      operationsLogistics.push('Bag items travel with their bag unless a separate item allocation is listed.');
      await exportRacePlan({ event, checkpoints, crew, gear, dropBags, gpxXml, operations, operationsLogistics });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Export Failed', `Could not generate the race plan PDF. ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onPress={handleExport}
      loading={generating}
      fullWidth={fullWidth}
      style={style}
      icon={<Ionicons name="share-outline" size={18} color={colors.snow} />}
    >
      Export Race Plan
    </Button>
  );
}

export default ExportRacePlanButton;
