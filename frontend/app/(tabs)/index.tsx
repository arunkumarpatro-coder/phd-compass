import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as Storage from '../../src/utils/storage';
import * as H from '../../src/utils/helpers';
import { JournalEntry, PILLARS, SKILL_TRACKS } from '../../src/types';

export default function JournalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<'entry' | 'history'>('entry');
  const [showWelcome, setShowWelcome] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const today = new Date();
  const todayStr = H.formatDate(today);

  const blankEntry = (): JournalEntry => ({
    id: H.generateId(),
    date: todayStr,
    dayOfWeek: H.getDayOfWeek(today),
    workedOn: '',
    learned: '',
    surprisedConfused: '',
    honestCheck: '',
    tomorrowIntention: '',
    pillarTags: [],
    skillTrack: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [entry, setEntry] = useState<JournalEntry>(blankEntry());
  const entryRef = useRef(entry);
  entryRef.current = entry;

  useEffect(() => {
    loadData();
    const timer = setInterval(() => doSave(entryRef.current), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const all = await Storage.getJournalEntries();
    setEntries(all);
    setStreak(H.calculateStreak(all));
    const todayEntry = all.find(e => e.date === todayStr);
    if (todayEntry) {
      setEntry(todayEntry);
      entryRef.current = todayEntry;
    }
    const settings = await Storage.getSettings();
    if (!settings.welcomeDismissed) setShowWelcome(true);
  };

  const doSave = useCallback(async (e: JournalEntry) => {
    const has = e.workedOn || e.learned || e.surprisedConfused || e.honestCheck || e.tomorrowIntention || e.pillarTags.length > 0 || e.skillTrack;
    if (!has) return;
    await Storage.saveJournalEntry(e);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const all = await Storage.getJournalEntries();
    setEntries(all);
    setStreak(H.calculateStreak(all));
  }, []);

  const updateField = (field: string, value: unknown) => {
    setEntry(prev => {
      const updated = { ...prev, [field]: value, updatedAt: new Date().toISOString() };
      entryRef.current = updated;
      return updated;
    });
  };

  const togglePillar = (id: number) => {
    setEntry(prev => {
      const tags = prev.pillarTags.includes(id) ? prev.pillarTags.filter(t => t !== id) : [...prev.pillarTags, id];
      const updated = { ...prev, pillarTags: tags, updatedAt: new Date().toISOString() };
      entryRef.current = updated;
      return updated;
    });
  };

  const selectSkillTrack = (track: JournalEntry['skillTrack']) => {
    setEntry(prev => {
      const updated = { ...prev, skillTrack: prev.skillTrack === track ? null : track, updatedAt: new Date().toISOString() };
      entryRef.current = updated;
      return updated;
    });
  };

  const dismissWelcome = async (goToVision?: boolean) => {
    setShowWelcome(false);
    const s = await Storage.getSettings();
    await Storage.saveSettings({ ...s, welcomeDismissed: true });
    if (goToVision) router.push('/vision');
  };

  const filteredEntries = entries
    .filter(e => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return e.date.includes(q) || e.workedOn.toLowerCase().includes(q) || e.learned.toLowerCase().includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerLeft: { flex: 1 },
    dateText: { fontSize: 18, fontWeight: '600', color: colors.textMain },
    subDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
    streakText: { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    savedText: { fontSize: 12, color: colors.primary, textAlign: 'center', paddingVertical: 4 },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.textMain, lineHeight: 24, textAlignVertical: 'top' },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pillarChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, minWidth: 44, alignItems: 'center' },
    pillarChipText: { fontSize: 12, fontWeight: '600' },
    trackChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, minWidth: 44, alignItems: 'center' },
    trackChipText: { fontSize: 13, fontWeight: '600' },
    historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 24, minHeight: 44 },
    historyBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
    settingsBtn: { padding: 8 },
    // History
    searchInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.textMain, marginBottom: 12 },
    entryCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
    entryDate: { fontSize: 14, fontWeight: '600', color: colors.textMain },
    entryDay: { fontSize: 12, color: colors.textMuted },
    entryPreview: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
    dotsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    trackBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
    trackBadgeText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
    // Welcome modal
    welcomeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    welcomeCard: { backgroundColor: colors.cardSurface, borderRadius: 16, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center' },
    welcomeTitle: { fontSize: 22, fontWeight: '700', color: colors.textMain, marginBottom: 8 },
    welcomeSubtitle: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    welcomeBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, minHeight: 44, width: '100%', alignItems: 'center', marginBottom: 10 },
    welcomeBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
    welcomeBtnSecondary: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, minHeight: 44, width: '100%', alignItems: 'center' },
    welcomeBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.primary },
    // Detail modal
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    detailCard: { flex: 1, backgroundColor: colors.background, marginTop: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    detailClose: { padding: 8 },
    detailField: { marginBottom: 16 },
    detailFieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailFieldValue: { fontSize: 16, color: colors.textMain, lineHeight: 24 },
    emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
    backRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
    backText: { fontSize: 15, fontWeight: '600', color: colors.primary, marginLeft: 4 },
  });

  if (mode === 'history') {
    return (
      <SafeAreaView style={s.safe} testID="journal-history-screen">
        <View style={s.header}>
          <TouchableOpacity testID="history-back-btn" style={s.backRow} onPress={() => setMode('entry')}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
            <Text style={s.backText}>Back to Today</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="settings-btn-history" style={s.settingsBtn} onPress={() => router.push('/settings')}>
            <Feather name="settings" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={[s.scrollContent, { flex: 1, padding: 20 }]}>
          <TextInput
            testID="history-search-input"
            style={s.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredEntries}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity testID={`entry-card-${item.date}`} style={s.entryCard} onPress={() => setSelectedEntry(item)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.entryDate}>{item.date}</Text>
                  <Text style={s.entryDay}>{item.dayOfWeek}</Text>
                </View>
                <Text style={s.entryPreview} numberOfLines={2}>{item.workedOn || 'No entry'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={s.dotsRow}>
                    {item.pillarTags.map(p => (
                      <View key={p} style={[s.dot, { backgroundColor: PILLARS[p]?.color }]} />
                    ))}
                  </View>
                  {item.skillTrack && (
                    <View style={[s.trackBadge, { backgroundColor: SKILL_TRACKS.find(t => t.id === item.skillTrack)?.color }]}>
                      <Text style={s.trackBadgeText}>{item.skillTrack}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.emptyText}>No entries found.</Text>}
          />
        </View>
        {selectedEntry && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedEntry(null)}>
            <View style={s.detailOverlay}>
              <View style={s.detailCard}>
                <View style={s.detailHeader}>
                  <View>
                    <Text style={s.dateText}>{selectedEntry.date}</Text>
                    <Text style={s.subDate}>{selectedEntry.dayOfWeek}</Text>
                  </View>
                  <TouchableOpacity testID="detail-close-btn" style={s.detailClose} onPress={() => setSelectedEntry(null)}>
                    <Feather name="x" size={24} color={colors.textMain} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {[
                    ['What I worked on', selectedEntry.workedOn],
                    ['What I learned', selectedEntry.learned],
                    ['What surprised or confused me', selectedEntry.surprisedConfused],
                    ['Honest self-check', selectedEntry.honestCheck],
                    ["Tomorrow's intention", selectedEntry.tomorrowIntention],
                  ].map(([label, val]) => (
                    <View key={label as string} style={s.detailField}>
                      <Text style={s.detailFieldLabel}>{label as string}</Text>
                      <Text style={s.detailFieldValue}>{(val as string) || '—'}</Text>
                    </View>
                  ))}
                  {selectedEntry.pillarTags.length > 0 && (
                    <View style={s.detailField}>
                      <Text style={s.detailFieldLabel}>Pillars</Text>
                      <View style={s.tagsRow}>
                        {selectedEntry.pillarTags.map(p => (
                          <View key={p} style={[s.pillarChip, { borderColor: PILLARS[p]?.color, backgroundColor: PILLARS[p]?.color + '18' }]}>
                            <Text style={[s.pillarChipText, { color: PILLARS[p]?.color }]}>{PILLARS[p]?.short}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {selectedEntry.skillTrack && (
                    <View style={s.detailField}>
                      <Text style={s.detailFieldLabel}>Skill Track</Text>
                      <View style={[s.trackChip, { borderColor: SKILL_TRACKS.find(t => t.id === selectedEntry.skillTrack)?.color, backgroundColor: SKILL_TRACKS.find(t => t.id === selectedEntry.skillTrack)?.color + '18', alignSelf: 'flex-start' }]}>
                        <Text style={[s.trackChipText, { color: SKILL_TRACKS.find(t => t.id === selectedEntry.skillTrack)?.color }]}>{selectedEntry.skillTrack}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} testID="journal-screen">
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.dateText}>Today</Text>
          <Text style={s.subDate}>{H.formatDisplayDate(today)}</Text>
        </View>
        {streak > 0 && (
          <View style={s.streakBadge} testID="streak-counter">
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={s.streakText}>{streak} day{streak !== 1 ? 's' : ''}</Text>
          </View>
        )}
        <TouchableOpacity testID="settings-btn" style={[s.settingsBtn, { marginLeft: 10 }]} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {saved && <Text style={s.savedText}>Saved</Text>}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Five entry fields */}
          <Text style={[s.fieldLabel, { marginTop: 0 }]}>What I worked on</Text>
          <TextInput
            testID="journal-worked-on"
            style={[s.input, { minHeight: 72 }]}
            placeholder="What did I actually do today?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={entry.workedOn}
            onChangeText={v => updateField('workedOn', v)}
            onBlur={() => doSave(entryRef.current)}
          />

          <Text style={s.fieldLabel}>What I learned</Text>
          <TextInput
            testID="journal-learned"
            style={[s.input, { minHeight: 56 }]}
            placeholder="Did my understanding deepen, or was I just busy?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={entry.learned}
            onChangeText={v => updateField('learned', v)}
            onBlur={() => doSave(entryRef.current)}
          />

          <Text style={s.fieldLabel}>What surprised or confused me</Text>
          <TextInput
            testID="journal-surprised"
            style={[s.input, { minHeight: 56 }]}
            placeholder="Anything unexpected?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={entry.surprisedConfused}
            onChangeText={v => updateField('surprisedConfused', v)}
            onBlur={() => doSave(entryRef.current)}
          />

          <Text style={s.fieldLabel}>Honest self-check</Text>
          <TextInput
            testID="journal-honest-check"
            style={[s.input, { minHeight: 56 }]}
            placeholder="Was I comfortable or challenged today?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={entry.honestCheck}
            onChangeText={v => updateField('honestCheck', v)}
            onBlur={() => doSave(entryRef.current)}
          />

          <Text style={s.fieldLabel}>Tomorrow&apos;s intention</Text>
          <TextInput
            testID="journal-tomorrow"
            style={[s.input, { minHeight: 44 }]}
            placeholder="One specific thing I will do tomorrow."
            placeholderTextColor={colors.textMuted}
            multiline
            value={entry.tomorrowIntention}
            onChangeText={v => updateField('tomorrowIntention', v)}
            onBlur={() => doSave(entryRef.current)}
          />

          {/* Pillar Tags */}
          <Text style={s.sectionTitle}>Pillars (optional)</Text>
          <View style={s.tagsRow}>
            {PILLARS.map(p => {
              const active = entry.pillarTags.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  testID={`pillar-tag-${p.id}`}
                  style={[s.pillarChip, { borderColor: active ? p.color : colors.border, backgroundColor: active ? p.color + '18' : 'transparent' }]}
                  onPress={() => togglePillar(p.id)}
                >
                  <Text style={[s.pillarChipText, { color: active ? p.color : colors.textMuted }]}>{p.short}: {p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Skill Track Tags */}
          <Text style={s.sectionTitle}>Skill Track (optional)</Text>
          <View style={s.tagsRow}>
            {SKILL_TRACKS.map(t => {
              const active = entry.skillTrack === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  testID={`skill-track-${t.id}`}
                  style={[s.trackChip, { borderColor: active ? t.color : colors.border, backgroundColor: active ? t.color + '18' : 'transparent' }]}
                  onPress={() => selectSkillTrack(t.id)}
                >
                  <Text style={[s.trackChipText, { color: active ? t.color : colors.textMuted }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* History Button */}
          <TouchableOpacity testID="view-history-btn" style={s.historyBtn} onPress={() => setMode('history')}>
            <Feather name="clock" size={16} color={colors.primary} />
            <Text style={s.historyBtnText}>View Past Entries ({entries.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Welcome Modal */}
      <Modal visible={showWelcome} transparent animationType="fade" onRequestClose={() => dismissWelcome()}>
        <View style={s.welcomeOverlay}>
          <View style={s.welcomeCard} testID="welcome-modal">
            <Feather name="compass" size={36} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={s.welcomeTitle}>Welcome to PhD Compass</Text>
            <Text style={s.welcomeSubtitle}>
              Your research reflection companion. Everything is stored on your device — private and offline-ready.
            </Text>
            <TouchableOpacity testID="welcome-start-journal-btn" style={s.welcomeBtn} onPress={() => dismissWelcome()}>
              <Text style={s.welcomeBtnText}>Start Journaling</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="welcome-set-vision-btn" style={s.welcomeBtnSecondary} onPress={() => dismissWelcome(true)}>
              <Text style={s.welcomeBtnSecondaryText}>Set My Vision</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
