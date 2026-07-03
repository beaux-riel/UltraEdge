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
import { useGear } from '../context/GearContext';
import { useDropBags } from '../context/DropBagContext';
import {
  exportRacePlan,
  loadGpxXmlForEvent,
  RacePlanCrewMember,
  RacePlanDropBag,
  RacePlanGearItem,
} from '../lib/racePlanPdf';

// Per-event relationship records (same storage as EventDetailScreen).
const EVENT_GEAR_KEY = '@ultraedge/event-gear';
const EVENT_CREW_KEY = '@ultraedge/event-crew';

interface EventGearAllocation {
  eventId: string;
  gearItemId: string;
  isWorn: boolean;
  isCarried: boolean;
  quantity: number;
  notes?: string;
}

interface EventCrewAssignment {
  eventId: string;
  crewMemberId: string;
  notes?: string;
}

interface ExportRacePlanButtonProps {
  eventId: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

async function readJson<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function ExportRacePlanButton({ eventId, fullWidth = true, style }: ExportRacePlanButtonProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const { getEvent } = useEvents();
  const { getCheckpointsByEventId, getCheckpointById } = useCheckpoints();
  const { getCrewMember } = useCrewMembers();
  const { getGearItem } = useGear();
  const { getDropBagsByEvent } = useDropBags();

  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    if (generating) {return;}

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
        if (!member) {continue;}
        const roleLabel =
          member.role === 'other' && member.customRole
            ? member.customRole
            : ROLE_CONFIG[member.role]?.label ?? 'Crew';
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
        if (!item) {continue;}
        gear.push({
          name: item.name,
          brand: item.brand ?? null,
          category: item.category,
          quantity: allocation.quantity || 1,
          isWorn: allocation.isWorn,
          isCarried: allocation.isCarried,
          notes: allocation.notes ?? item.notes ?? null,
        });
      }

      // Drop bags with their checkpoint locations.
      const dropBags: RacePlanDropBag[] = getDropBagsByEvent(eventId).map(bag => ({
        name: bag.name,
        checkpointName: bag.checkpointId
          ? getCheckpointById(eventId, bag.checkpointId)?.name ?? null
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

      await exportRacePlan({ event, checkpoints, crew, gear, dropBags, gpxXml });
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
