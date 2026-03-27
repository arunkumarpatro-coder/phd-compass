import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as Storage from '../../src/utils/storage';
import * as H from '../../src/utils/helpers';
import { JournalEntry, Milestone, Course, SKILL_TRACKS } from '../../src/types';

type Section = 'dashboard' | 'milestones' | 'coursework';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [section, setSection] = useState<Section>('dashboard');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [e, m, c] = await Promise.all([Storage.getJournalEntries(), Storage.getMilestones(), Storage.getCourses()]);
    setEntries(e); setMilestones(m); setCourses(c);
  };

  // Dashboard calculations
  const now = new Date();
  const weekEntries = H.getEntriesForWeek(entries, now) as JournalEntry[];
  const weekSessions = { research: 0, coding: 0, entrepreneurial: 0 };
  weekEntries.forEach(e => { if (e.skillTrack) weekSessions[e.skillTrack]++; });
  const totalSessions = { research: 0, coding: 0, entrepreneurial: 0 };
  entries.forEach(e => { if (e.skillTrack) totalSessions[e.skillTrack]++; });

  // Last 4 weeks data
  const last4Weeks = [3, 2, 1, 0].map(wk => {
    const ref = H.getWeeksAgo(wk);
    const we = H.getEntriesForWeek(entries, ref) as JournalEntry[];
    const s = { research: 0, coding: 0, entrepreneurial: 0, label: `W${4 - wk}` };
    we.forEach(e => { if (e.skillTrack) s[e.skillTrack]++; });
    return s;
  });

  const cycleStatus = (m: Milestone) => {
    const order: Milestone['status'][] = ['not_started', 'in_progress', 'completed'];
    const idx = order.indexOf(m.status);
    const next = order[(idx + 1) % 3];
    const updated = milestones.map(x => x.id === m.id ? { ...x, status: next, dateCompleted: next === 'completed' ? new Date().toISOString() : null } : x);
    setMilestones(updated);
    Storage.saveMilestones(updated);
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const ms: Milestone = { id: H.generateId(), title: newMilestone.trim(), status: 'not_started', notes: '', dateCompleted: null, order: milestones.length };
    const updated = [...milestones, ms];
    setMilestones(updated); Storage.saveMilestones(updated); setNewMilestone('');
  };

  const updateMilestoneNotes = (id: string, notes: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, notes } : m);
    setMilestones(updated); Storage.saveMilestones(updated);
  };

  const addCourse = () => {
    if (!newCourse.trim()) return;
    const c: Course = { id: H.generateId(), title: newCourse.trim(), keyConcepts: '' };
    const updated = [...courses, c];
    setCourses(updated); Storage.saveCourses(updated); setNewCourse('');
  };

  const updateCourseNotes = (id: string, keyConcepts: string) => {
    const updated = courses.map(c => c.id === id ? { ...c, keyConcepts } : c);
    setCourses(updated); Storage.saveCourses(updated);
  };

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: '700', color: colors.textMain },
    settingsBtn: { padding: 8 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, minHeight: 36 },
    tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    tabTextActive: { color: '#FFF' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    // Dashboard
    card: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textMain, marginBottom: 8 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    progressLabel: { fontSize: 14, fontWeight: '600', color: colors.textMain, width: 36, textAlign: 'right' },
    totalText: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
    chartSection: { marginTop: 8 },
    chartTitle: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 12 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4 },
    chartWeek: { flex: 1, alignItems: 'center', gap: 2 },
    chartBar: { width: 12, borderRadius: 3, minHeight: 2 },
    chartLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: colors.textMuted },
    // Milestones
    banner: { backgroundColor: colors.accentWarningBg, borderWidth: 1, borderColor: colors.accentWarning, borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerText: { fontSize: 13, color: colors.accentWarning, flex: 1, lineHeight: 18 },
    milestoneCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'column' },
    milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    milestoneTitle: { flex: 1, fontSize: 15, color: colors.textMain, lineHeight: 20 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minHeight: 28, justifyContent: 'center' },
    statusText: { fontSize: 11, fontWeight: '600' },
    milestoneNotes: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.textMain, marginTop: 10, minHeight: 60, textAlignVertical: 'top' },
    completedDate: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
    addRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    addInput: { flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.textMain, minHeight: 44 },
    addBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', minHeight: 44 },
    addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    // Coursework
    courseCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
    courseTitle: { fontSize: 15, fontWeight: '600', color: colors.textMain, flex: 1 },
    courseNotesInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.textMain, marginTop: 10, minHeight: 80, textAlignVertical: 'top' },
    courseNotesLabel: { fontSize: 12, color: colors.textMuted, marginTop: 10, marginBottom: 4 },
  });

  const statusColor = (status: string) => {
    if (status === 'completed') return { bg: colors.primaryLight, text: colors.primary, label: 'Completed' };
    if (status === 'in_progress') return { bg: colors.accentWarningBg, text: colors.accentWarning, label: 'In Progress' };
    return { bg: colors.border + '40', text: colors.textMuted, label: 'Not Started' };
  };

  return (
    <SafeAreaView style={s.safe} testID="progress-screen">
      <View style={s.header}>
        <Text style={s.title}>Progress</Text>
        <TouchableOpacity testID="settings-btn-progress" style={s.settingsBtn} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {(['dashboard', 'milestones', 'coursework'] as Section[]).map(t => (
          <TouchableOpacity key={t} testID={`progress-tab-${t}`} style={[s.tab, section === t && s.tabActive]} onPress={() => setSection(t)}>
            <Text style={[s.tabText, section === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {section === 'dashboard' && (
          <>
            {SKILL_TRACKS.map(track => {
              const target = track.id === 'entrepreneurial' ? 1 : 3;
              const current = weekSessions[track.id];
              const pct = Math.min(current / target, 1);
              return (
                <View key={track.id} style={s.card} testID={`skill-card-${track.id}`}>
                  <Text style={s.cardTitle}>{track.label}</Text>
                  <View style={s.progressRow}>
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: track.color }]} />
                    </View>
                    <Text style={s.progressLabel}>{current}/{target}</Text>
                  </View>
                  <Text style={s.totalText}>Total since start: {totalSessions[track.id]} sessions</Text>
                </View>
              );
            })}

            <View style={[s.card, s.chartSection]} testID="weekly-chart">
              <Text style={s.chartTitle}>Last 4 Weeks</Text>
              <View style={s.chartRow}>
                {last4Weeks.map((wk, i) => (
                  <View key={i} style={s.chartWeek}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                      {SKILL_TRACKS.map(t => (
                        <View key={t.id} style={[s.chartBar, { height: Math.max(2, (wk[t.id] / 3) * 70), backgroundColor: t.color }]} />
                      ))}
                    </View>
                    <Text style={s.chartLabel}>{wk.label}</Text>
                  </View>
                ))}
              </View>
              <View style={s.legendRow}>
                {SKILL_TRACKS.map(t => (
                  <View key={t.id} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: t.color }]} />
                    <Text style={s.legendText}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {section === 'milestones' && (
          <>
            <View style={s.banner} testID="nab-warning-banner">
              <Feather name="alert-triangle" size={16} color={colors.accentWarning} />
              <Text style={s.bannerText}>Cast and printed NAB data must never be averaged together — fundamentally different starting microstructures.</Text>
            </View>
            {milestones.map(m => {
              const sc = statusColor(m.status);
              const isExpanded = expandedMilestone === m.id;
              return (
                <View key={m.id} style={s.milestoneCard} testID={`milestone-${m.id}`}>
                  <View style={s.milestoneRow}>
                    <TouchableOpacity onPress={() => setExpandedMilestone(isExpanded ? null : m.id)} style={{ flex: 1 }}>
                      <Text style={s.milestoneTitle}>{m.title}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`milestone-status-${m.id}`} style={[s.statusBadge, { backgroundColor: sc.bg }]} onPress={() => cycleStatus(m)}>
                      <Text style={[s.statusText, { color: sc.text }]}>{sc.label}</Text>
                    </TouchableOpacity>
                  </View>
                  {m.dateCompleted && <Text style={s.completedDate}>Completed: {new Date(m.dateCompleted).toLocaleDateString()}</Text>}
                  {isExpanded && (
                    <TextInput
                      testID={`milestone-notes-${m.id}`}
                      style={s.milestoneNotes}
                      placeholder="Add notes..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      value={m.notes}
                      onChangeText={v => updateMilestoneNotes(m.id, v)}
                    />
                  )}
                </View>
              );
            })}
            <View style={s.addRow}>
              <TextInput testID="add-milestone-input" style={s.addInput} placeholder="New milestone..." placeholderTextColor={colors.textMuted} value={newMilestone} onChangeText={setNewMilestone} />
              <TouchableOpacity testID="add-milestone-btn" style={s.addBtn} onPress={addMilestone}>
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {section === 'coursework' && (
          <>
            {courses.map(c => {
              const isExpanded = expandedCourse === c.id;
              return (
                <View key={c.id} style={s.courseCard} testID={`course-${c.id}`}>
                  <TouchableOpacity testID={`course-toggle-${c.id}`} style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setExpandedCourse(isExpanded ? null : c.id)}>
                    <Text style={s.courseTitle}>{c.title}</Text>
                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  {isExpanded && (
                    <>
                      <Text style={s.courseNotesLabel}>Key Concepts Learned</Text>
                      <TextInput
                        testID={`course-notes-${c.id}`}
                        style={s.courseNotesInput}
                        placeholder="Add concepts as you learn them..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={c.keyConcepts}
                        onChangeText={v => updateCourseNotes(c.id, v)}
                      />
                    </>
                  )}
                </View>
              );
            })}
            <View style={s.addRow}>
              <TextInput testID="add-course-input" style={s.addInput} placeholder="New course..." placeholderTextColor={colors.textMuted} value={newCourse} onChangeText={setNewCourse} />
              <TouchableOpacity testID="add-course-btn" style={s.addBtn} onPress={addCourse}>
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
