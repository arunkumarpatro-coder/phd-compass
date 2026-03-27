import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as Storage from '../../src/utils/storage';
import * as H from '../../src/utils/helpers';
import { JournalEntry, WeeklyReview, PILLARS, SKILL_TRACKS } from '../../src/types';

type ReviewTab = 'weekly' | 'monthly' | 'quarterly';

function emptyReview(week: string, type: ReviewTab): WeeklyReview {
  return {
    id: H.generateId(), week, type,
    pillarScores: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 },
    skillTrackSessions: { research: 0, coding: 0, entrepreneurial: 0 },
    groundingReflection: '', neglectedPillar: '', avoidedThisWeek: '', nextWeekCommitment: '',
    explainNow: '', progressOrBusy: '', foolingMyself: '',
    rightProblem: '', intuitionCheck: '', fulcrumAsset: '', updatedVision: '',
    createdAt: new Date().toISOString(),
  };
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<ReviewTab>('weekly');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);
  const [saved, setSaved] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const now = new Date();
  const weekStr = H.getWeekNumber(now);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    const [allEntries, allReviews] = await Promise.all([Storage.getJournalEntries(), Storage.getReviews()]);
    setEntries(allEntries);

    const weekEntries = H.getEntriesForWeek(allEntries, now) as JournalEntry[];

    // Calculate scores
    const pillarScores: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
    const skillSessions = { research: 0, coding: 0, entrepreneurial: 0 };
    weekEntries.forEach(e => {
      e.pillarTags.forEach(p => { pillarScores[`P${p}`] = (pillarScores[`P${p}`] || 0) + 1; });
      if (e.skillTrack) skillSessions[e.skillTrack]++;
    });

    // Check existing review
    const existing = allReviews.find(r => r.week === weekStr && r.type === tab);
    if (existing) {
      setReview({ ...existing, pillarScores, skillTrackSessions: skillSessions });
    } else {
      const r = emptyReview(weekStr, tab);
      r.pillarScores = pillarScores;
      r.skillTrackSessions = skillSessions;
      setReview(r);
    }

    setPastReviews(allReviews.filter(r => r.type === tab && r.week !== weekStr).sort((a, b) => b.week.localeCompare(a.week)));

    // Show banner if Friday+ and 3+ entries and no review
    const dayOfWeek = now.getDay();
    setShowBanner(dayOfWeek >= 5 && weekEntries.length >= 3 && !existing);
  };

  const updateField = (field: string, value: string) => {
    if (!review) return;
    setReview({ ...review, [field]: value });
  };

  const saveReview = async () => {
    if (!review) return;
    await Storage.saveReview(review);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadData();
  };

  const exportPDF = () => {
    if (Platform.OS !== 'web' || !review) return;
    const html = generateReviewHTML(review, entries);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const weekEntries = (H.getEntriesForWeek(entries, now) as JournalEntry[]).sort((a, b) => a.date.localeCompare(b.date));

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
    banner: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerText: { fontSize: 13, color: colors.primary, flex: 1 },
    savedText: { fontSize: 12, color: colors.primary, textAlign: 'center', paddingVertical: 4 },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    weekRange: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
    card: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
    entryDate: { fontSize: 14, fontWeight: '600', color: colors.textMain },
    entryPreview: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    // Pillar scorecard
    scorecardRow: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8, marginBottom: 8 },
    scorecardBar: { flex: 1, alignItems: 'center' },
    barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
    barLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    barValue: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    warningBox: { backgroundColor: colors.accentWarningBg, borderWidth: 1, borderColor: colors.accentWarning, borderRadius: 8, padding: 10, marginTop: 8 },
    warningText: { fontSize: 13, color: colors.accentWarning },
    skillSummary: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
    skillItem: { alignItems: 'center' },
    skillLabel: { fontSize: 12, color: colors.textMuted },
    skillValue: { fontSize: 18, fontWeight: '700', color: colors.textMain },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.textMain, lineHeight: 24, textAlignVertical: 'top', minHeight: 60 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20, minHeight: 48 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    exportBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 44 },
    exportBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    pastTitle: { fontSize: 16, fontWeight: '600', color: colors.textMain, marginTop: 32, marginBottom: 12 },
    pastCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
    pastWeek: { fontSize: 14, fontWeight: '600', color: colors.textMain },
    pastDate: { fontSize: 12, color: colors.textMuted },
    emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  });

  const maxBarValue = review ? Math.max(...Object.values(review.pillarScores), 1) : 1;

  return (
    <SafeAreaView style={s.safe} testID="review-screen">
      <View style={s.header}>
        <Text style={s.title}>Review</Text>
        <TouchableOpacity testID="settings-btn-review" style={s.settingsBtn} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        {(['weekly', 'monthly', 'quarterly'] as ReviewTab[]).map(t => (
          <TouchableOpacity key={t} testID={`review-tab-${t}`} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {saved && <Text style={s.savedText}>Saved</Text>}

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {showBanner && tab === 'weekly' && (
          <View style={s.banner} testID="review-ready-banner">
            <Feather name="check-circle" size={16} color={colors.primary} />
            <Text style={s.bannerText}>Your weekly review is ready!</Text>
          </View>
        )}

        <Text style={s.weekRange}>{H.getWeekDateRange(now)} ({weekStr})</Text>

        {/* This week's entries */}
        <Text style={s.sectionLabel}>This Week&apos;s Entries</Text>
        {weekEntries.length === 0 ? (
          <Text style={s.emptyText}>No entries this week yet.</Text>
        ) : (
          weekEntries.map(e => (
            <View key={e.id} style={s.card}>
              <Text style={s.entryDate}>{e.dayOfWeek}, {e.date}</Text>
              <Text style={s.entryPreview} numberOfLines={2}>{e.workedOn || '—'}</Text>
            </View>
          ))
        )}

        {/* Pillar Scorecard */}
        {review && (
          <>
            <Text style={s.sectionLabel}>Pillar Scorecard</Text>
            <View style={s.scorecardRow}>
              {PILLARS.map(p => {
                const val = review.pillarScores[p.short] || 0;
                const height = Math.max(4, (val / maxBarValue) * 70);
                const isZero = val === 0;
                return (
                  <View key={p.id} style={s.scorecardBar} testID={`pillar-bar-${p.id}`}>
                    <View style={[s.barFill, {
                      height,
                      backgroundColor: isZero ? 'transparent' : p.color,
                      borderWidth: isZero ? 1 : 0,
                      borderColor: colors.border,
                      borderStyle: 'dashed',
                    }]} />
                    <Text style={[s.barLabel, { color: p.color }]}>{p.short}</Text>
                    <Text style={s.barValue}>{val}</Text>
                  </View>
                );
              })}
            </View>

            {review.pillarScores.P0 === 0 && (
              <View style={s.warningBox} testID="p0-warning">
                <Text style={s.warningText}>Deep Grounding (P0) not touched this week</Text>
              </View>
            )}
            {PILLARS.filter(p => (review.pillarScores[p.short] || 0) === 0 && p.id !== 0).map(p => (
              <View key={p.id} style={[s.warningBox, { marginTop: 4 }]}>
                <Text style={[s.warningText, { fontSize: 12 }]}>{p.short} ({p.label}) not touched this week</Text>
              </View>
            ))}

            {/* Skill Track Summary */}
            <Text style={s.sectionLabel}>Skill Tracks</Text>
            <View style={s.skillSummary}>
              {SKILL_TRACKS.map(t => (
                <View key={t.id} style={s.skillItem}>
                  <Text style={s.skillValue}>{review.skillTrackSessions[t.id]}</Text>
                  <Text style={s.skillLabel}>{t.label}</Text>
                </View>
              ))}
            </View>

            {/* Weekly Reflection Prompts */}
            <Text style={s.sectionLabel}>Reflection</Text>

            <Text style={s.fieldLabel}>What foundational concept did I engage with deeply this week?</Text>
            <TextInput testID="review-grounding" style={s.input} placeholder="Can I explain it without notes? If not, that's a red flag." placeholderTextColor={colors.textMuted} multiline value={review.groundingReflection} onChangeText={v => updateField('groundingReflection', v)} />

            <Text style={s.fieldLabel}>Which pillar did I neglect most? Why?</Text>
            <TextInput testID="review-neglected" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.neglectedPillar} onChangeText={v => updateField('neglectedPillar', v)} />

            <Text style={s.fieldLabel}>What did I avoid this week that I know I should face?</Text>
            <TextInput testID="review-avoided" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.avoidedThisWeek} onChangeText={v => updateField('avoidedThisWeek', v)} />

            <Text style={s.fieldLabel}>One commitment for next week tied to a neglected pillar:</Text>
            <TextInput testID="review-commitment" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.nextWeekCommitment} onChangeText={v => updateField('nextWeekCommitment', v)} />

            {/* Monthly prompts */}
            {(tab === 'monthly' || tab === 'quarterly') && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 24 }]}>Monthly Reflection</Text>
                <Text style={s.fieldLabel}>What can I explain now that I could not last month?</Text>
                <TextInput testID="review-explain-now" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.explainNow} onChangeText={v => updateField('explainNow', v)} />
                <Text style={s.fieldLabel}>Am I making progress or just busy? What is the evidence?</Text>
                <TextInput testID="review-progress-busy" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.progressOrBusy} onChangeText={v => updateField('progressOrBusy', v)} />
                <Text style={s.fieldLabel}>Where am I fooling myself?</Text>
                <TextInput testID="review-fooling" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.foolingMyself} onChangeText={v => updateField('foolingMyself', v)} />
              </>
            )}

            {/* Quarterly prompts */}
            {tab === 'quarterly' && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 24 }]}>Quarterly Reflection</Text>
                <Text style={s.fieldLabel}>Am I on the right problem?</Text>
                <TextInput testID="review-right-problem" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.rightProblem} onChangeText={v => updateField('rightProblem', v)} />
                <Text style={s.fieldLabel}>Physical intuition check: Pick a phenomenon, predict outcome before checking data.</Text>
                <TextInput testID="review-intuition" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.intuitionCheck} onChangeText={v => updateField('intuitionCheck', v)} />
                <Text style={s.fieldLabel}>Is any of my work becoming a fulcrum asset?</Text>
                <TextInput testID="review-fulcrum" style={s.input} placeholderTextColor={colors.textMuted} multiline value={review.fulcrumAsset} onChangeText={v => updateField('fulcrumAsset', v)} />
              </>
            )}

            <TouchableOpacity testID="save-review-btn" style={s.saveBtn} onPress={saveReview}>
              <Text style={s.saveBtnText}>Save {tab.charAt(0).toUpperCase() + tab.slice(1)} Review</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <TouchableOpacity testID="export-review-btn" style={s.exportBtn} onPress={exportPDF}>
                <Feather name="download" size={16} color={colors.primary} />
                <Text style={s.exportBtnText}>Download as PDF</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Past reviews */}
        {pastReviews.length > 0 && (
          <>
            <Text style={s.pastTitle}>Past {tab.charAt(0).toUpperCase() + tab.slice(1)} Reviews</Text>
            {pastReviews.map(r => (
              <View key={r.id} style={s.pastCard}>
                <Text style={s.pastWeek}>{r.week}</Text>
                <Text style={s.pastDate}>{r.groundingReflection ? r.groundingReflection.slice(0, 80) + '...' : 'No reflection recorded'}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function generateReviewHTML(review: WeeklyReview, entries: JournalEntry[]): string {
  const pillarRows = PILLARS.map(p => `<tr><td style="padding:4px 8px;font-weight:600;color:${p.color}">${p.short}: ${p.label}</td><td style="padding:4px 8px">${review.pillarScores[p.short] || 0} days</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><title>PhD Compass - ${review.type} Review ${review.week}</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#2D2D2A;line-height:1.6}h1{color:#1A8A7D;border-bottom:2px solid #E8E5DD;padding-bottom:8px}h2{color:#1A8A7D;margin-top:24px}table{border-collapse:collapse;width:100%}td{border:1px solid #E8E5DD}.field{margin:12px 0}.label{font-weight:600;color:#6B6B66;text-transform:uppercase;font-size:12px;letter-spacing:1px}.value{margin-top:4px}</style></head><body><h1>${review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review — ${review.week}</h1><h2>Pillar Scorecard</h2><table>${pillarRows}</table><h2>Skill Tracks</h2><p>Research: ${review.skillTrackSessions.research} | Coding: ${review.skillTrackSessions.coding} | Entrepreneurial: ${review.skillTrackSessions.entrepreneurial}</p><h2>Reflections</h2><div class="field"><div class="label">Foundational concept</div><div class="value">${review.groundingReflection || '—'}</div></div><div class="field"><div class="label">Neglected pillar</div><div class="value">${review.neglectedPillar || '—'}</div></div><div class="field"><div class="label">Avoided this week</div><div class="value">${review.avoidedThisWeek || '—'}</div></div><div class="field"><div class="label">Next week commitment</div><div class="value">${review.nextWeekCommitment || '—'}</div></div>${review.explainNow ? `<div class="field"><div class="label">Can explain now</div><div class="value">${review.explainNow}</div></div>` : ''}${review.progressOrBusy ? `<div class="field"><div class="label">Progress or busy</div><div class="value">${review.progressOrBusy}</div></div>` : ''}${review.foolingMyself ? `<div class="field"><div class="label">Fooling myself</div><div class="value">${review.foolingMyself}</div></div>` : ''}${review.rightProblem ? `<div class="field"><div class="label">Right problem</div><div class="value">${review.rightProblem}</div></div>` : ''}${review.intuitionCheck ? `<div class="field"><div class="label">Intuition check</div><div class="value">${review.intuitionCheck}</div></div>` : ''}${review.fulcrumAsset ? `<div class="field"><div class="label">Fulcrum asset</div><div class="value">${review.fulcrumAsset}</div></div>` : ''}</body></html>`;
}
