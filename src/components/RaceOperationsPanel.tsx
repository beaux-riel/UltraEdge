import { DateTimeInput, DurationInput } from './StructuredTimeInput';
import LiveRacePanel from './LiveRacePanel';
import { makeLiveSnapshot } from '../lib/liveRaceModel';
import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Alert, Modal, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { useTheme } from '../theme';
import { Body, BodySmall, H2, H3, Button, Card, CardContent } from './ui';
import { Event, Checkpoint } from '../lib/database.types';
import { CrewMember } from '../context/CrewContext';
import { DropBag } from '../context/DropBagContext';
import { RaceOperations, emptyOperations, loadOperations, changeOperations, projectRace, projectedDistance, clockLabel, putTimeReport, raceStart, parseLocalRaceTime, TimeReport, StationDuty, durationMinutes } from '../lib/raceOperations';

interface Props { initialStation?: string; event: Event; checkpoints: Checkpoint[]; crew: CrewMember[]; bags: DropBag[]; gear: { id: string; name: string }[]; }
export default function RaceOperationsPanel({ event, checkpoints, crew, bags, gear, initialStation }: Props) {
  const { theme: { colors } } = useTheme();
  const [ops, setOps] = useState<RaceOperations>(emptyOperations(event.id));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [startText, setStartText] = useState('');
  const [open, setOpen] = useState(!!initialStation);
  const [tab, setTab] = useState<'planning' | 'timeline' | 'logistics'>('planning');
  const [station, setStation] = useState<string | null>(initialStation ?? null);
  const [finishGoal, setFinishGoal] = useState('');
  const [stop, setStop] = useState('0');
  const [variation, setVariation] = useState('10');
  const [vehicleName, setVehicleName] = useState('');
  const [previewHours, setPreviewHours] = useState('6');
  const [source, setSource] = useState<TimeReport['source']>('runner');
  const [reportAt, setReportAt] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { let active = true; setReady(false); loadOperations(event.id).then(value => { if (active) { setOps(value); setVariation(String(value.variation)); if (initialStation) setStop(String(value.stops[initialStation] ?? 0)); setReady(true); } }).catch(() => Alert.alert('Race plan unavailable', 'Reopen the race to retry.')); return () => { active = false; }; }, [event.id, open]);
  useEffect(() => { if (initialStation) { setStation(initialStation); setOpen(true); } }, [initialStation]);
  const save = async (change: (current: RaceOperations) => RaceOperations) => {
    if (!ready || saving.current) return;
    Keyboard.dismiss();
    saving.current = true;
    setBusy(true);
    try { setOps(await changeOperations(event.id, change)); }
    catch (error) { Alert.alert('Not saved', error instanceof Error ? error.message : 'Please try again.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const projection = projectRace(event, checkpoints, ops);
  const plan = projectRace(event, checkpoints, { ...ops, startAt: null, reports: [] });
  const finishGoalMinutes = durationMinutes(finishGoal);
  const goalMoving = finishGoalMinutes && plan ? finishGoalMinutes - plan.stopMinutes : null;
  const selected = checkpoints.find(cp => cp.id === station);
  const inputStyle = { color: colors.bark, backgroundColor: colors.parchment, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 48 };
  const field = (label: string, value: string, onChangeText: (value: string) => void, numeric = false) => <View style={{ gap: 6 }}><BodySmall>{label}</BodySmall><TextInput testID={`operations-${label}`} accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'decimal-pad' : 'default'} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={inputStyle} /></View>;
  const choice = (label: string, checked: boolean, action: () => void) => <TouchableOpacity key={label} disabled={busy || !ready} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={action} style={{ padding: 12, minHeight: 46, backgroundColor: checked ? colors.forest + '25' : colors.parchment, borderRadius: 8 }}><BodySmall>{checked ? '✓ ' : ''}{label}</BodySmall></TouchableOpacity>;
  const record = (kind: TimeReport['kind']) => {
    if (!selected) return;
    const at = reportAt.trim() ? parseLocalRaceTime(reportAt) : new Date().toISOString();
    save(current => putTimeReport(current, { checkpointId: selected.id, source, kind, at, recordedAt: new Date().toISOString() }, checkpoints, raceStart(event, current)));
  };
  const cargo = [
    ...bags.flatMap(bag => [{ key: `bag:${bag.id}`, label: `Bag: ${bag.name}` }, ...bag.items.map(item => ({ key: `item:${bag.id}:${item.id}`, label: `${bag.name} / ${item.name} ×${item.quantity}` }))]),
    ...gear.map(item => ({ key: `gear:${item.id}`, label: `Gear: ${item.name}` })),
  ];
  const elapsed = projection ? Math.max(0, Math.floor((now - projection.start) / 1000)) : 0;
  return <Card style={{ marginVertical: 16 }}><CardContent>
    <H2>Race operations</H2>
    <BodySmall style={{ marginVertical: 8 }}>{projection ? `Projected finish ${clockLabel(projection.finish)} • ${projection.stopMinutes} min at stations` : 'Set a start date/time, target HH:MM, total distance and ordered checkpoint distances to see ETAs.'}</BodySmall>
    <LiveRacePanel snapshot={() => makeLiveSnapshot(event, checkpoints, ops, [...ops.duties.map(d => `${checkpoints.find(cp=>cp.id===d.checkpointId)?.name}: ${crew.find(c=>c.id===d.crewMemberId)?.name} — ${d.role}`), ...ops.vehicles.map(v=>`${v.name} • Owner: ${crew.find(c=>c.id===v.ownerId)?.name??'Unassigned'} • Crew: ${v.crewIds.map(id=>crew.find(c=>c.id===id)?.name).join(', ')} • Cargo: ${ops.cargo.filter(c=>c.vehicleId===v.id).map(c=>c.label).join(', ')}`)])} />
    <Button disabled={!ready} onPress={() => { setTab('planning'); setOpen(true); }}>Plan aid-station stops</Button>
    <Button disabled={!ready} variant="secondary" onPress={() => { setTab('timeline'); setOpen(true); }}>Race day: record actual times</Button>
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: 24 }}>
        <View style={{ paddingHorizontal: 20, gap: 12 }}><H2>Race operations</H2><Button variant="tertiary" onPress={() => setOpen(false)}>Done</Button>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{choice('Race planning', tab === 'planning', () => setTab('planning'))}{choice('Race day', tab === 'timeline', () => setTab('timeline'))}{choice('Crew & vehicles', tab === 'logistics', () => setTab('logistics'))}</View>
        </View>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }}>
          {!ready ? <Body>Loading saved plan…</Body> : tab === 'planning' ? <>
            <H3>Plan aid-station stops</H3>
            <BodySmall>Choose each station and set the minutes you expect to spend there. These are planned durations, separate from race-day arrival and departure reports. All dates and times use this device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</BodySmall>
            {plan && <><Body>Moving: {plan.movingMinutes} min • Stops: {plan.stopMinutes} min</Body><Body>Planned finish: {clockLabel(plan.finish)}</Body><BodySmall>Average moving speed: {(event.total_distance! / (plan.movingMinutes / 60)).toFixed(2)} {event.distance_unit === 'miles' ? 'mi' : 'km'}/h. With the same moving pace, longer stops move the finish later.</BodySmall>
            <DurationInput label="Explore a finish-time goal (total elapsed)" value={finishGoal} onChange={setFinishGoal} />
            {finishGoal && (goalMoving && goalMoving > 0 ? <BodySmall>To finish within {finishGoal}, allow {goalMoving} moving minutes and average {(event.total_distance! / (goalMoving / 60)).toFixed(2)} {event.distance_unit === 'miles' ? 'mi' : 'km'}/h while moving. This is a calculator; edit the race’s target moving time to adopt it.</BodySmall> : <BodySmall>Enter a valid finish duration longer than the total planned stops.</BodySmall>)}
            </>}
            {!checkpoints.length && <BodySmall>Add checkpoints to this race to plan station stops.</BodySmall>}
            {[...checkpoints].sort((a,b) => a.order_index - b.order_index).map(cp => { const row=plan?.rows.find(r=>r.id===cp.id);const minutes=ops.stops[cp.id] ?? durationMinutes(cp.estimated_duration) ?? 0;return <View key={cp.id} style={{gap:8,paddingVertical:12,borderTopWidth:1,borderColor:colors.border}}><H3>{cp.name}</H3><BodySmall>{minutes} minutes planned stop{row ? ` • In ${clockLabel(row.arrival)} • Out ${clockLabel(row.departure)}` : ''}</BodySmall><Button disabled={busy} variant="secondary" onPress={()=>{setStation(cp.id);setStop(String(minutes));}}>Set planned stop</Button>{station===cp.id&&<>{field('Planned stop (minutes)',stop,setStop,true)}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[0,2,5,10].map(m=><Button key={m} variant="tertiary" onPress={()=>setStop(String(m))}>{m} min</Button>)}</View><Button disabled={busy||!stop.trim()} onPress={()=>save(current=>({...current,stops:{...current.stops,[cp.id]:Number(stop)}}))}>Save planned stop</Button></>}</View>;})}
          </> : tab === 'timeline' ? <>
            <BodySmall>Target time is moving time. Planned stops add to the finish. Projections use distance, not terrain. Times use this device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</BodySmall>
            {field('Best / slow variation (%)', variation, setVariation, true)}
            <Button disabled={busy} onPress={() => save(current => ({ ...current, variation: Number(variation) }))}>Save variation</Button>
            <H3>Race-day clock</H3>
            <Body>{ops.startAt ? `${Math.floor(elapsed / 3600)}h ${Math.floor(elapsed / 60) % 60}m ${elapsed % 60}s elapsed` : 'Race not started'}</Body>
            <Button disabled={busy || !!ops.startAt} onPress={() => Alert.alert('Start race clock?', 'Start now and use this time for live ETAs.', [{ text: 'Cancel' }, { text: 'Start', onPress: () => save(current => ({ ...current, startAt: new Date().toISOString() })) }])}>Start race now</Button>
            <DateTimeInput label="Actual start correction" value={startText} onChange={setStartText} />
            <Button disabled={busy || !startText.trim()} variant="tertiary" onPress={() => { try { const startAt = parseLocalRaceTime(startText); save(current => ({ ...current, startAt })); } catch (error) { Alert.alert('Invalid start', error instanceof Error ? error.message : 'Use YYYY-MM-DDTHH:MM.'); } }}>Set actual start</Button>
            <BodySmall>Offline on this device. Record runner and crew reports separately; each gets equal weight. Recording again replaces that source’s report.</BodySmall>
            {projection ? <>
              <H3>Course progress</H3>
              {field('Preview hours after start', previewHours, setPreviewHours, true)}
              <BodySmall>{(['best', 'arrival', 'slow'] as const).map(scenario => `${scenario === 'arrival' ? 'Expected' : scenario === 'best' ? 'Best' : 'Slow'}: ${projectedDistance(projection, event.total_distance!, projection.start + Math.max(0, Number(previewHours) || 0) * 3600000, scenario).toFixed(1)} ${event.distance_unit === 'miles' ? 'mi' : 'km'}`).join(' • ')}</BodySmall>
              {ops.startAt && <BodySmall>Expected now: {projectedDistance(projection, event.total_distance!, now).toFixed(1)} {event.distance_unit === 'miles' ? 'mi' : 'km'} • an estimate, not GPS tracking</BodySmall>}
              <H3>Finish projection</H3><Body>Best {clockLabel(projection.bestFinish)}{ '\n'}Expected {clockLabel(projection.finish)}{'\n'}Slow {clockLabel(projection.slowFinish)}</Body>
              <BodySmall>{projection.lastReport ? `Last report ${clockLabel(Date.parse(projection.lastReport))}` : 'No actual times yet — using the plan.'}</BodySmall>
              {projection.rows.filter(row => !station || station === row.id).map(row => <TouchableOpacity key={row.id} accessibilityRole="button" onPress={() => { setStation(row.id); setStop(String(row.stop)); setReportAt(''); }} style={{ borderTopWidth: 1, borderColor: colors.border, paddingVertical: 14, gap: 6 }}>
                <H3>{row.name}</H3><BodySmall>{row.distance.toFixed(1)} {event.distance_unit === 'miles' ? 'mi' : 'km'} • {row.stop} min stop</BodySmall>
                <Body>In {clockLabel(row.arrival)} • Out {clockLabel(row.departure)}</Body>
                <BodySmall>Best {clockLabel(row.best)} / Slow {clockLabel(row.slow)}{row.actualIn !== null ? '\nArrival recorded' : ''}{row.actualOut !== null ? ' • Departure recorded' : ''}</BodySmall>
                <BodySmall>{ops.duties.filter(duty => duty.checkpointId === row.id).map(duty => `${crew.find(member => member.id === duty.crewMemberId)?.name ?? 'Removed crew'}: ${duty.role.replace('_', ' ')}`).join(' • ') || 'No crew allocated'}</BodySmall>
                <BodySmall>Record actual arrival / departure</BodySmall>
              </TouchableOpacity>)}
            </> : <Body>Complete the race timing and checkpoint distances to calculate the timeline. You can still plan stops below.</Body>}
            {!projection && checkpoints.map(cp => choice(cp.name, station === cp.id, () => { setStation(cp.id); setStop(String(ops.stops[cp.id] ?? 0)); }))}
            {station && <Button variant="tertiary" onPress={() => setStation(null)}>Show all checkpoints</Button>}
            {selected && <View style={{ gap: 12, padding: 14, borderWidth: 1, borderColor: colors.forest, borderRadius: 12 }}>
              <H3>{selected.name}</H3><BodySmall>Record what happened here on race day. Edit planned durations in Race planning.</BodySmall>
              <H3>Time report</H3><View style={{ flexDirection: 'row', gap: 8 }}>{choice('Runner', source === 'runner', () => setSource('runner'))}{choice('Crew', source === 'crew', () => setSource('crew'))}</View>
              <DateTimeInput label="Actual checkpoint time" value={reportAt} onChange={setReportAt} nowLabel="Use the current time when recording" />
              <View style={{ flexDirection: 'row', gap: 8 }}>{(['in', 'out'] as const).map(kind => <Button key={kind} disabled={busy} onPress={() => { try { record(kind); } catch { Alert.alert('Invalid time', 'Use YYYY-MM-DDTHH:MM, or leave blank for now.'); } }}>Record {kind}</Button>)}</View>
              {ops.reports.filter(report => report.checkpointId === selected.id).map(report => <View key={`${report.source}:${report.kind}`}><BodySmall>{report.source} {report.kind}: {clockLabel(Date.parse(report.at))}</BodySmall><Button variant="tertiary" disabled={busy} onPress={() => save(current => ({ ...current, reports: current.reports.filter(row => !(row.checkpointId === report.checkpointId && row.source === report.source && row.kind === report.kind)) }))}>Remove {report.source} {report.kind}</Button></View>)}
              {(['in', 'out'] as const).map(kind => { const reports = ops.reports.filter(row => row.checkpointId === selected.id && row.kind === kind); return reports.length === 2 && Math.abs(Date.parse(reports[0].at) - Date.parse(reports[1].at)) > 10 * 60000 ? <BodySmall key={kind}>Reports differ by more than 10 minutes. Check the individual {kind} times before relying on the average.</BodySmall> : null; })}
            </View>}
          </> : <>
            <H3>Station duties</H3><BodySmall>Assignments are optional. A pacer assignment marks the beginning of their pacing leg.</BodySmall>
            {checkpoints.map(cp => <View key={cp.id} style={{ gap: 8 }}><H3>{cp.name}</H3>{!cp.has_crew_access && <BodySmall>Crew access is not confirmed for this checkpoint — verify with the race guide.</BodySmall>}{crew.map(member => <View key={member.id} style={{ gap: 6 }}><Body>{member.name}</Body><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(['support', 'first_aid', 'pacer'] as StationDuty['role'][]).map(role => choice(role.replace('_', ' '), ops.duties.some(d => d.checkpointId === cp.id && d.crewMemberId === member.id && d.role === role), () => save(current => { const matches = (d: StationDuty) => d.checkpointId === cp.id && d.crewMemberId === member.id && d.role === role; return { ...current, duties: current.duties.some(matches) ? current.duties.filter(d => !matches(d)) : [...current.duties, { checkpointId: cp.id, crewMemberId: member.id, role }] }; })))}</View></View>)}</View>)}
            {!crew.length && <BodySmall>Add crew to this race first to allocate station duties or vehicle seats.</BodySmall>}
            <H3>Vehicles</H3>{field('Vehicle name / identifier', vehicleName, setVehicleName)}
            <Button disabled={busy || !vehicleName.trim()} onPress={async () => { await save(current => ({ ...current, vehicles: [...current.vehicles, { id: `vehicle_${Date.now()}`, name: vehicleName.trim(), ownerId: null, crewIds: [] }] })); setVehicleName(''); }}>Add vehicle</Button>
            {ops.vehicles.map(vehicle => <View key={vehicle.id} style={{ gap: 10, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.border }}><H3>{vehicle.name}</H3><BodySmall>Owner (optional)</BodySmall>
              {crew.map(member => choice(member.name, vehicle.ownerId === member.id, () => save(current => ({ ...current, vehicles: current.vehicles.map(v => v.id === vehicle.id ? { ...v, ownerId: v.ownerId === member.id ? null : member.id } : v) }))))}
              <BodySmall>Travelling crew (one vehicle per person)</BodySmall>{crew.map(member => choice(member.name, vehicle.crewIds.includes(member.id), () => save(current => ({ ...current, vehicles: current.vehicles.map(v => ({ ...v, crewIds: v.id === vehicle.id && !v.crewIds.includes(member.id) ? [...v.crewIds, member.id] : v.crewIds.filter(id => id !== member.id) })) }))))}
              <BodySmall>Cargo • items inherit their bag’s vehicle unless allocated separately.</BodySmall>{cargo.map(item => choice(item.label, ops.cargo.some(c => c.key === item.key && c.vehicleId === vehicle.id), () => save(current => ({ ...current, cargo: current.cargo.some(c => c.key === item.key && c.vehicleId === vehicle.id) ? current.cargo.filter(c => c.key !== item.key) : [...current.cargo.filter(c => c.key !== item.key), { ...item, vehicleId: vehicle.id }] }))))}
              <Button variant="tertiary" disabled={busy} onPress={() => Alert.alert('Remove vehicle?', 'Its crew and cargo allocations will be cleared.', [{ text: 'Cancel' }, { text: 'Remove', onPress: () => save(current => ({ ...current, vehicles: current.vehicles.filter(v => v.id !== vehicle.id), cargo: current.cargo.filter(c => c.vehicleId !== vehicle.id) })) }])}>Remove vehicle</Button>
            </View>)}
          </>}
        </ScrollView>
      </View>
    </Modal>
  </CardContent></Card>;
}
