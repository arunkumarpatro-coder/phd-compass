import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as Storage from '../../src/utils/storage';
import * as H from '../../src/utils/helpers';
import { Vision, PILLAR_DESCRIPTIONS } from '../../src/types';

export default function VisionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [vision, setVision] = useState<Vision>({
    legacyStatement: '', phdContribution: '', postPhdDirection: '',
    identityGap: {
      mindset: { current: '', required: '' },
      skillSet: { current: '', required: '' },
      knowledge: { current: '', required: '' },
      systems: { current: '', required: '' },
    },
    lastReviewed: '',
  });
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const visionRef = useRef(vision);
  visionRef.current = vision;

  useEffect(() => {
    Storage.getVision().then(v => { setVision(v); visionRef.current = v; });
    const timer = setInterval(() => doSave(visionRef.current), 30000);
    return () => clearInterval(timer);
  }, []);

  const doSave = async (v: Vision) => {
    const updated = { ...v, lastReviewed: new Date().toISOString() };
    await Storage.saveVision(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (path: string, value: string) => {
    setVision(prev => {
      let updated = { ...prev };
      const parts = path.split('.');
      if (parts.length === 1) {
        (updated as any)[parts[0]] = value;
      } else if (parts.length === 3) {
        updated = {
          ...prev,
          identityGap: {
            ...prev.identityGap,
            [parts[1]]: { ...prev.identityGap[parts[1] as keyof Vision['identityGap']], [parts[2]]: value },
          },
        };
      }
      updated.lastReviewed = new Date().toISOString();
      visionRef.current = updated;
      return updated;
    });
  };

  const daysAgo = H.daysSince(vision.lastReviewed);
  const needsReview = daysAgo > 30;

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: '700', color: colors.textMain },
    settingsBtn: { padding: 8 },
    savedText: { fontSize: 12, color: colors.primary, textAlign: 'center', paddingVertical: 4 },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    reviewBanner: { borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewBannerText: { fontSize: 13, flex: 1 },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textMain, marginBottom: 6, marginTop: 12 },
    inputLarge: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 18, fontWeight: '600', color: colors.textMain, lineHeight: 26, minHeight: 48 },
    input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.textMain, lineHeight: 24, textAlignVertical: 'top', minHeight: 56 },
    inputSmall: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.textMain, lineHeight: 20, textAlignVertical: 'top', minHeight: 48 },
    gapCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
    gapTitle: { fontSize: 16, fontWeight: '600', color: colors.textMain, marginBottom: 10 },
    gapLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    pillarCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
    pillarHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, minHeight: 48 },
    pillarDot: { width: 10, height: 10, borderRadius: 5 },
    pillarTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textMain },
    pillarDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 22, padding: 14, paddingTop: 0 },
  });

  const gapSections = [
    { key: 'mindset', title: 'Mindset', icon: 'target' as const },
    { key: 'skillSet', title: 'Skill Set', icon: 'tool' as const },
    { key: 'knowledge', title: 'Knowledge', icon: 'book' as const },
    { key: 'systems', title: 'Systems', icon: 'layers' as const },
  ];

  return (
    <SafeAreaView style={s.safe} testID="vision-screen">
      <View style={s.header}>
        <Text style={s.title}>Vision</Text>
        <TouchableOpacity testID="settings-btn-vision" style={s.settingsBtn} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {saved && <Text style={s.savedText}>Saved</Text>}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Last Reviewed Banner */}
          <View style={[s.reviewBanner, { backgroundColor: needsReview ? colors.accentWarningBg : colors.primaryLight, borderWidth: 1, borderColor: needsReview ? colors.accentWarning : colors.primary }]} testID="vision-review-banner">
            <Feather name={needsReview ? 'alert-circle' : 'check-circle'} size={16} color={needsReview ? colors.accentWarning : colors.primary} />
            <Text style={[s.reviewBannerText, { color: needsReview ? colors.accentWarning : colors.primary }]}>
              {vision.lastReviewed
                ? needsReview
                  ? `Time to revisit your vision (${daysAgo} days ago)`
                  : `Last reviewed: ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`
                : 'Start defining your north star'}
            </Text>
          </View>

          {/* North Star */}
          <Text style={[s.sectionLabel, { marginTop: 0 }]}>My North Star</Text>

          <Text style={s.fieldLabel}>The researcher I want to be known as...</Text>
          <TextInput
            testID="vision-legacy"
            style={s.inputLarge}
            placeholder="My legacy in one sentence..."
            placeholderTextColor={colors.textMuted}
            value={vision.legacyStatement}
            onChangeText={v => updateField('legacyStatement', v)}
            onBlur={() => doSave(visionRef.current)}
          />

          <Text style={s.fieldLabel}>My PhD will contribute...</Text>
          <TextInput
            testID="vision-contribution"
            style={[s.input, { minHeight: 80 }]}
            placeholder="The contribution of my dissertation..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={vision.phdContribution}
            onChangeText={v => updateField('phdContribution', v)}
            onBlur={() => doSave(visionRef.current)}
          />

          <Text style={s.fieldLabel}>After my PhD, I see myself...</Text>
          <TextInput
            testID="vision-post-phd"
            style={s.inputLarge}
            placeholder="Academia, industry R&D, or hybrid..."
            placeholderTextColor={colors.textMuted}
            value={vision.postPhdDirection}
            onChangeText={v => updateField('postPhdDirection', v)}
            onBlur={() => doSave(visionRef.current)}
          />

          {/* Identity Gap */}
          <Text style={s.sectionLabel}>Who I Must Become</Text>

          {gapSections.map(({ key, title, icon }) => (
            <View key={key} style={s.gapCard} testID={`gap-card-${key}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Feather name={icon} size={18} color={colors.primary} />
                <Text style={s.gapTitle}>{title}</Text>
              </View>
              <Text style={s.gapLabel}>Current State</Text>
              <TextInput
                testID={`gap-current-${key}`}
                style={s.inputSmall}
                placeholder={`Where I am now with ${title.toLowerCase()}...`}
                placeholderTextColor={colors.textMuted}
                multiline
                value={vision.identityGap[key as keyof Vision['identityGap']].current}
                onChangeText={v => updateField(`identityGap.${key}.current`, v)}
                onBlur={() => doSave(visionRef.current)}
              />
              <Text style={[s.gapLabel, { marginTop: 10 }]}>Required State</Text>
              <TextInput
                testID={`gap-required-${key}`}
                style={s.inputSmall}
                placeholder={`Where I need to be with ${title.toLowerCase()}...`}
                placeholderTextColor={colors.textMuted}
                multiline
                value={vision.identityGap[key as keyof Vision['identityGap']].required}
                onChangeText={v => updateField(`identityGap.${key}.required`, v)}
                onBlur={() => doSave(visionRef.current)}
              />
            </View>
          ))}

          {/* Pillars Reference */}
          <Text style={s.sectionLabel}>The Six Pillars</Text>

          {PILLAR_DESCRIPTIONS.map(p => {
            const isOpen = expandedPillar === p.id;
            const pillarColor = ['#1A8A7D', '#E06D63', '#4A7A9B', '#8B6B9E', '#C4820B', '#5B8C5A'][p.id];
            return (
              <View key={p.id} style={s.pillarCard} testID={`pillar-ref-${p.id}`}>
                <TouchableOpacity testID={`pillar-toggle-${p.id}`} style={s.pillarHeader} onPress={() => setExpandedPillar(isOpen ? null : p.id)}>
                  <View style={[s.pillarDot, { backgroundColor: pillarColor }]} />
                  <Text style={s.pillarTitle}>{p.title}</Text>
                  <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {isOpen && <Text style={s.pillarDesc}>{p.desc}</Text>}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
