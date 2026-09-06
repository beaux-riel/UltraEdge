/** Race-first field guide. All preparation links open the saved local plan. */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ImageBackground, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text, H1, H2, H3, BodySmall, Button } from '../components/ui';
import { useEvents } from '../context/EventContext';
import { useMover } from '../context/MoverContext';
import { parseDateOnly, daysUntilDate } from '../lib/dateOnly';
import StorageLoadNotice from '../components/StorageLoadNotice';

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const { events, loading, error, refreshEvents } = useEvents();
  const { profile } = useMover();
  const [refreshing, setRefreshing] = useState(false);
  const active = events.filter(e => !['completed', 'cancelled'].includes(e.status));
  const upcoming = active.filter(e => e.event_date && (daysUntilDate(e.event_date) ?? -1) >= 0)
    .sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? ''));
  const featured = upcoming[0] ?? active.find(e => !e.event_date) ?? active[0] ?? events[0];
  const [raceTitle, ...raceSubtitle] = featured?.name.split(' — ') ?? [];
  const days = featured?.event_date ? daysUntilDate(featured.event_date) : null;
  const openPlan = () => featured && navigation.navigate('EventDetail', { eventId: featured.id });
  const date = featured?.event_date ? parseDateOnly(featured.event_date) : null;
  const onRefresh = async () => {
    setRefreshing(true);
    try { await refreshEvents(); } finally { setRefreshing(false); }
  };
  const actions: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; press: () => void }[] = featured ? [
    { icon: 'map-outline', title: featured.gpx_file_url ? 'Review your course' : 'Add your course', detail: featured.gpx_file_url ? 'Open the route and elevation profile' : 'Import the official GPX into your plan', press: openPlan },
    { icon: 'flag-outline', title: 'Plan your aid stops', detail: 'Checkpoints, cutoffs and supplies', press: () => navigation.navigate('Checkpoints', { eventId: featured.id }) },
    { icon: 'people-outline', title: 'Bring your crew', detail: 'Assign support roles for this race', press: () => navigation.navigate('SelectCrew', { eventId: featured.id }) },
  ] : [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.parchment }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />}>
      <View style={[styles.masthead, { paddingTop: insets.top + 16 }]}>
        <View style={styles.brand}>
          <Ionicons name="trail-sign" size={26} color={colors.forest} />
          <Text variant="label" maxFontSizeMultiplier={1.2} style={{ color: colors.bark, letterSpacing: 2.4, fontSize: 15 }}>ULTRAEDGE</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')}
          style={[styles.profile, { borderColor: colors.forest }]}>
          <Text variant="h3" maxFontSizeMultiplier={1.2}>{(profile?.display_name || 'U').slice(0, 1).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      {loading || error ? <StorageLoadNotice loading={loading} error={error} onRetry={refreshEvents} /> : <>
        <ImageBackground source={require('../../assets/alpine-backdrop.png')} style={[styles.hero, { backgroundColor: colors.hero }]} imageStyle={{ opacity: 0.7 }} accessible={false}>
          <LinearGradient colors={['rgba(17,22,25,0.12)', 'rgba(17,22,25,0.7)', '#111619']} style={styles.heroContent}>
            <Text variant="bodySmall" style={{ color: colors.heroText, marginBottom: 16 }}>
              {featured ? (days !== null && days >= 0 ? 'Your next start line' : 'Your race field guide') : 'The preparation starts here'}
            </Text>
            <H1 style={[styles.heroTitle, { color: colors.heroText }, fontScale > 1.5 && { fontSize: 28, lineHeight: 33, letterSpacing: -0.5 }]}>{raceTitle ?? 'Go further.\nArrive prepared.'}</H1>
            {raceSubtitle.length > 0 && <BodySmall style={{ color: colors.heroText, marginTop: 12 }}>{raceSubtitle.join(' — ')}</BodySmall>}
            <BodySmall style={{ color: '#CDD4CF', marginTop: 16 }}>
              {featured ? `${date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date to confirm'}${days !== null && days < 0 ? ' · Past event' : days === 0 ? ' · Today' : days !== null ? ` · ${days} days to go` : ''}` : 'Your route, crew and kit. One clear race plan.'}
            </BodySmall>
            {featured && <View style={styles.metrics}>
              <View style={styles.metric}><Ionicons name="navigate-outline" size={17} color={colors.accent} /><Text style={{ color: colors.heroText }}>{featured.total_distance != null ? `${Number(featured.total_distance.toFixed(1))} ${featured.distance_unit === 'kilometers' ? 'km' : 'mi'}` : 'Distance to confirm'}</Text></View>
              <View style={styles.metric}><Ionicons name="map-outline" size={17} color={colors.accent} /><BodySmall style={{ color: colors.heroText }}>{featured.gpx_file_url ? 'GPX attached' : 'Route to add'}</BodySmall></View>
            </View>}
            <Button onPress={featured ? openPlan : () => navigation.navigate('CreateEvent')} fullWidth style={{ marginTop: 24 }}>
              {featured ? 'Open race plan  →' : 'Create your first race plan  →'}
            </Button>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.content}>
          {featured && <View style={styles.section}>
            <H2 style={{ marginBottom: 8 }}>Make it race-ready</H2>
            {actions.map(action => <TouchableOpacity key={action.title} accessibilityRole="button" onPress={action.press} activeOpacity={0.65} style={[styles.action, { borderBottomColor: colors.border }]}>
              <View style={[styles.actionIcon, { borderColor: colors.forest }]}><Ionicons name={action.icon} size={23} color={colors.forest} /></View>
              <View style={{ flex: 1 }}><H3>{action.title}</H3><BodySmall color="secondary" style={{ marginTop: 4 }}>{action.detail}</BodySmall></View>
              <Ionicons name="chevron-forward" size={20} color={colors.stone} />
            </TouchableOpacity>)}
          </View>}
          <View style={[styles.utilities, { borderColor: colors.border }]}>
            <TouchableOpacity accessibilityRole="button" style={styles.utility} onPress={() => navigation.navigate('Gear')}><Ionicons name="bag-handle-outline" size={22} color={colors.bark} /><Text>Gear</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.utility} onPress={() => navigation.navigate('DropBags', featured ? { eventId: featured.id } : {})}><Ionicons name="cube-outline" size={22} color={colors.bark} /><Text>Drop bags</Text></TouchableOpacity>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}><H2>Your events</H2><Button variant="tertiary" size="sm" onPress={() => navigation.navigate('Events')}>View all</Button></View>
            {events.filter(e => e.id !== featured?.id).slice(0, 2).map(event => <TouchableOpacity key={event.id} accessibilityRole="button" onPress={() => navigation.navigate('EventDetail', { eventId: event.id })} style={[styles.event, { borderBottomColor: colors.border }]}><H3 style={{ flex: 1 }}>{event.name}</H3><Ionicons name="arrow-forward" size={22} color={colors.forest} /></TouchableOpacity>)}
            <Button variant="secondary" fullWidth onPress={() => navigation.navigate('CreateEvent')} style={{ marginTop: 16 }}>Create New Event</Button>
          </View>
        </View>
      </>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  masthead: { paddingHorizontal: 24, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profile: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 360 }, heroContent: { padding: 24, paddingTop: 38, flex: 1, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 46, lineHeight: 49, fontWeight: '800', letterSpacing: -1.7 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22 }, metric: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  content: { paddingHorizontal: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { marginTop: 26 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 14, borderBottomWidth: 1, minHeight: 80 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  utilities: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, paddingVertical: 18, marginTop: 8 },
  utility: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexGrow: 1, minHeight: 48 },
  event: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12, borderBottomWidth: 1 },
});
