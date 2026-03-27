import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import * as Storage from '../src/utils/storage';
import { JournalEntry, PILLARS } from '../src/types';

export default function SettingsScreen() {
  const { colors, isDark, themeSetting, setTheme } = useTheme();
  const router = useRouter();
  const [reminderTime, setReminderTime] = useState('20:00');

  useEffect(() => {
    Storage.getSettings().then(s => setReminderTime(s.reminderTime));
  }, []);

  const handleBackup = async () => {
    try {
      const data = await Storage.exportAllData();
      const json = JSON.stringify(data, null, 2);
      const filename = `phd_compass_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        Alert.alert('Backup Complete', `Saved as ${filename}`);
      } else {
        Alert.alert('Backup', 'File backup is available on web. Use the web version to export.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create backup.');
    }
  };

  const handleRestore = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const data = JSON.parse(evt.target?.result as string);
            await Storage.importAllData(data);
            Alert.alert('Restore Complete', 'All data has been restored. Please restart the app.');
          } catch {
            Alert.alert('Error', 'Invalid backup file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      Alert.alert('Restore', 'File restore is available on web.');
    }
  };

  const handleExportPDF = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Export', 'PDF export is available on web.');
      return;
    }
    const entries = await Storage.getJournalEntries();
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
    const html = generateJournalPDF(sorted);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your journal entries, reviews, milestones, SOPs, and vision data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: async () => {
            await Storage.clearAllData();
            Alert.alert('Done', 'All data cleared. Restart the app to reinitialize.');
          },
        },
      ]
    );
  };

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: 'sun' | 'moon' | 'monitor' }[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'monitor' },
  ];

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: '700', color: colors.textMain },
    closeBtn: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
    themeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, minHeight: 44 },
    themeBtnText: { fontSize: 14, fontWeight: '600' },
    reminderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    reminderText: { flex: 1, fontSize: 15, color: colors.textMain },
    reminderTime: { fontSize: 15, fontWeight: '600', color: colors.primary },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 48 },
    actionBtnLast: { borderBottomWidth: 0 },
    actionText: { flex: 1, fontSize: 15, color: colors.textMain },
    actionIcon: {},
    aboutText: { fontSize: 14, color: colors.textMuted, lineHeight: 22, padding: 14 },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D44', minHeight: 48 },
    dangerText: { fontSize: 15, fontWeight: '600', color: '#D44' },
  });

  return (
    <SafeAreaView style={s.safe} testID="settings-screen">
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
        <TouchableOpacity testID="settings-close-btn" style={s.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Theme */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Theme</Text>
          <View style={s.themeRow}>
            {themeOptions.map(o => (
              <TouchableOpacity key={o.value} testID={`theme-${o.value}`} style={[s.themeBtn, { borderColor: themeSetting === o.value ? colors.primary : colors.border, backgroundColor: themeSetting === o.value ? colors.primaryLight : 'transparent' }]} onPress={() => setTheme(o.value)}>
                <Feather name={o.icon} size={16} color={themeSetting === o.value ? colors.primary : colors.textMuted} />
                <Text style={[s.themeBtnText, { color: themeSetting === o.value ? colors.primary : colors.textMuted }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reminder</Text>
          <View style={s.card}>
            <View style={s.reminderRow}>
              <Feather name="bell" size={18} color={colors.textMuted} />
              <Text style={s.reminderText}>Journal reminder time</Text>
              <Text style={s.reminderTime}>{reminderTime}</Text>
            </View>
          </View>
        </View>

        {/* Backup & Restore */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Backup & Restore</Text>
          <View style={s.card}>
            <TouchableOpacity testID="backup-btn" style={s.actionBtn} onPress={handleBackup}>
              <Feather name="download" size={18} color={colors.primary} />
              <Text style={s.actionText}>Download Backup (JSON)</Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity testID="restore-btn" style={s.actionBtn} onPress={handleRestore}>
              <Feather name="upload" size={18} color={colors.primary} />
              <Text style={s.actionText}>Restore from Backup</Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity testID="export-pdf-btn" style={[s.actionBtn, s.actionBtnLast]} onPress={handleExportPDF}>
              <Feather name="file-text" size={18} color={colors.primary} />
              <Text style={s.actionText}>Export Journal as PDF</Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <View style={s.card}>
            <Text style={s.aboutText}>
              PhD Compass v1.0.0{'\n\n'}
              A personal research reflection system. All data stored locally on your device — private and offline-ready.{'\n\n'}
              Built for a MEMS PhD student researching low cycle fatigue behavior of Wire DED-printed NAB alloys.
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: '#D44' }]}>Danger Zone</Text>
          <TouchableOpacity testID="clear-data-btn" style={s.dangerBtn} onPress={handleClearData}>
            <Feather name="trash-2" size={18} color="#D44" />
            <Text style={s.dangerText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function generateJournalPDF(entries: JournalEntry[]): string {
  const months: Record<string, JournalEntry[]> = {};
  entries.forEach(e => {
    const m = e.date.slice(0, 7);
    if (!months[m]) months[m] = [];
    months[m].push(e);
  });

  let body = '';
  Object.entries(months).forEach(([month, ents]) => {
    body += `<h2 style="color:#1A8A7D;border-bottom:2px solid #E8E5DD;padding-bottom:8px">${month}</h2>`;
    ents.forEach(e => {
      const pillars = e.pillarTags.map(p => PILLARS[p]?.short || '').join(', ');
      body += `<div style="margin-bottom:24px;page-break-inside:avoid"><h3>${e.dayOfWeek}, ${e.date}</h3>`;
      body += `<div style="margin:4px 0"><strong>Worked on:</strong> ${e.workedOn || '—'}</div>`;
      body += `<div style="margin:4px 0"><strong>Learned:</strong> ${e.learned || '—'}</div>`;
      body += `<div style="margin:4px 0"><strong>Surprised/Confused:</strong> ${e.surprisedConfused || '—'}</div>`;
      body += `<div style="margin:4px 0"><strong>Honest check:</strong> ${e.honestCheck || '—'}</div>`;
      body += `<div style="margin:4px 0"><strong>Tomorrow:</strong> ${e.tomorrowIntention || '—'}</div>`;
      if (pillars) body += `<div style="margin:4px 0"><strong>Pillars:</strong> ${pillars}</div>`;
      if (e.skillTrack) body += `<div style="margin:4px 0"><strong>Skill Track:</strong> ${e.skillTrack}</div>`;
      body += `</div>`;
    });
  });

  return `<!DOCTYPE html><html><head><title>PhD Compass — Journal Export</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#2D2D2A;line-height:1.6;font-size:14px}h1{color:#1A8A7D}h3{margin:0;color:#2D2D2A}@media print{body{margin:0;padding:20px}}</style></head><body><h1>PhD Compass — Journal</h1><p style="color:#6B6B66">Exported: ${new Date().toLocaleDateString()}</p>${body}</body></html>`;
}
