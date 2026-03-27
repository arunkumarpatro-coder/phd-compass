import React, { useState, useEffect } from 'react';
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
import { SOP, SOPStep } from '../../src/types';

const CATEGORIES: { id: SOP['category']; label: string; color: string }[] = [
  { id: 'lab_protocol', label: 'Lab Protocol', color: '#1A8A7D' },
  { id: 'data_processing', label: 'Data Processing', color: '#4A7A9B' },
  { id: 'analysis', label: 'Analysis', color: '#8B6B9E' },
  { id: 'administrative', label: 'Administrative', color: '#6B6B66' },
];

export default function SOPsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SOP['category']>('lab_protocol');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await Storage.getSOPs();
    setSOPs(data);
  };

  const saveSops = async (updated: SOP[]) => {
    setSOPs(updated);
    await Storage.saveSOPs(updated);
  };

  const addSOP = () => {
    if (!newTitle.trim()) return;
    const sop: SOP = {
      id: H.generateId(), title: newTitle.trim(), category: newCategory,
      steps: [], lastUpdated: new Date().toISOString(), version: 1,
    };
    saveSops([...sops, sop]);
    setNewTitle(''); setShowAdd(false);
    setExpandedId(sop.id);
  };

  const updateTitle = (id: string, title: string) => {
    saveSops(sops.map(s => s.id === id ? { ...s, title, lastUpdated: new Date().toISOString() } : s));
  };

  const updateCategory = (id: string, category: SOP['category']) => {
    saveSops(sops.map(s => s.id === id ? { ...s, category, lastUpdated: new Date().toISOString() } : s));
  };

  const addStep = (sopId: string) => {
    saveSops(sops.map(s => {
      if (s.id !== sopId) return s;
      const step: SOPStep = { order: s.steps.length + 1, instruction: '', notes: '' };
      return { ...s, steps: [...s.steps, step], lastUpdated: new Date().toISOString() };
    }));
  };

  const updateStep = (sopId: string, stepIdx: number, field: keyof SOPStep, value: string) => {
    saveSops(sops.map(s => {
      if (s.id !== sopId) return s;
      const steps = s.steps.map((st, i) => i === stepIdx ? { ...st, [field]: value } : st);
      return { ...s, steps, lastUpdated: new Date().toISOString() };
    }));
  };

  const removeStep = (sopId: string, stepIdx: number) => {
    saveSops(sops.map(s => {
      if (s.id !== sopId) return s;
      const steps = s.steps.filter((_, i) => i !== stepIdx).map((st, i) => ({ ...st, order: i + 1 }));
      return { ...s, steps, lastUpdated: new Date().toISOString() };
    }));
  };

  const moveStep = (sopId: string, stepIdx: number, dir: -1 | 1) => {
    saveSops(sops.map(s => {
      if (s.id !== sopId) return s;
      const steps = [...s.steps];
      const newIdx = stepIdx + dir;
      if (newIdx < 0 || newIdx >= steps.length) return s;
      [steps[stepIdx], steps[newIdx]] = [steps[newIdx], steps[stepIdx]];
      return { ...s, steps: steps.map((st, i) => ({ ...st, order: i + 1 })), lastUpdated: new Date().toISOString() };
    }));
  };

  const deleteSOP = (id: string) => {
    Alert.alert('Delete SOP', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveSops(sops.filter(s => s.id !== id)) },
    ]);
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 20, fontWeight: '700', color: colors.textMain },
    settingsBtn: { padding: 8 },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    sopCard: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
    sopHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sopTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textMain },
    categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    categoryText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
    lastUpdated: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    expandedSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
    titleInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16, fontWeight: '600', color: colors.textMain, marginBottom: 10, minHeight: 44 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, minHeight: 32 },
    catChipText: { fontSize: 12, fontWeight: '600' },
    stepsTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    stepCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 8 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    stepNumText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
    stepInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 8, fontSize: 14, color: colors.textMain, marginTop: 6, minHeight: 40, textAlignVertical: 'top' },
    stepNotesInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 8, fontSize: 13, color: colors.textMuted, marginTop: 4, minHeight: 36, textAlignVertical: 'top' },
    stepActions: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
    actionBtn: { padding: 4 },
    addStepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingVertical: 10, marginTop: 4, minHeight: 44, gap: 6 },
    addStepText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, gap: 6 },
    deleteText: { fontSize: 13, color: '#D44', fontWeight: '600' },
    addSOPBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12, minHeight: 48 },
    addSOPText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    addForm: { backgroundColor: colors.cardSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12 },
    addFormTitle: { fontSize: 16, fontWeight: '600', color: colors.textMain, marginBottom: 12 },
    addInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.textMain, marginBottom: 10, minHeight: 44 },
    addFormBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
    addConfirmBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44 },
    addCancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44 },
    emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  });

  return (
    <SafeAreaView style={s.safe} testID="sops-screen">
      <View style={s.header}>
        <Text style={s.title}>SOPs</Text>
        <TouchableOpacity testID="settings-btn-sops" style={s.settingsBtn} onPress={() => router.push('/settings')}>
          <Feather name="settings" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {showAdd && (
          <View style={s.addForm} testID="add-sop-form">
            <Text style={s.addFormTitle}>New SOP</Text>
            <TextInput testID="add-sop-title" style={s.addInput} placeholder="SOP title..." placeholderTextColor={colors.textMuted} value={newTitle} onChangeText={setNewTitle} />
            <View style={s.catRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.id} testID={`add-sop-cat-${c.id}`} style={[s.catChip, { borderColor: newCategory === c.id ? c.color : colors.border, backgroundColor: newCategory === c.id ? c.color + '18' : 'transparent' }]} onPress={() => setNewCategory(c.id)}>
                  <Text style={[s.catChipText, { color: newCategory === c.id ? c.color : colors.textMuted }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.addFormBtns}>
              <TouchableOpacity testID="confirm-add-sop-btn" style={s.addConfirmBtn} onPress={addSOP}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Create SOP</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="cancel-add-sop-btn" style={s.addCancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {sops.length === 0 && !showAdd && <Text style={s.emptyText}>No SOPs yet. Create one to get started.</Text>}

        {sops.map(sop => {
          const isExpanded = expandedId === sop.id;
          const catInfo = getCategoryInfo(sop.category);
          return (
            <View key={sop.id} style={s.sopCard} testID={`sop-card-${sop.id}`}>
              <TouchableOpacity testID={`sop-toggle-${sop.id}`} style={s.sopHeader} onPress={() => setExpandedId(isExpanded ? null : sop.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sopTitle}>{sop.title}</Text>
                  <Text style={s.lastUpdated}>Updated: {new Date(sop.lastUpdated).toLocaleDateString()}</Text>
                </View>
                <View style={[s.categoryBadge, { backgroundColor: catInfo.color }]}>
                  <Text style={s.categoryText}>{catInfo.label}</Text>
                </View>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={s.expandedSection}>
                  <TextInput testID={`sop-title-edit-${sop.id}`} style={s.titleInput} value={sop.title} onChangeText={v => updateTitle(sop.id, v)} onBlur={() => {}} />

                  <View style={s.catRow}>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity key={c.id} testID={`sop-cat-${sop.id}-${c.id}`} style={[s.catChip, { borderColor: sop.category === c.id ? c.color : colors.border, backgroundColor: sop.category === c.id ? c.color + '18' : 'transparent' }]} onPress={() => updateCategory(sop.id, c.id)}>
                        <Text style={[s.catChipText, { color: sop.category === c.id ? c.color : colors.textMuted }]}>{c.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.stepsTitle}>Steps</Text>
                  {sop.steps.map((step, idx) => (
                    <View key={idx} style={s.stepCard}>
                      <View style={s.stepHeader}>
                        <View style={s.stepNum}><Text style={s.stepNumText}>{step.order}</Text></View>
                        <View style={s.stepActions}>
                          {idx > 0 && (
                            <TouchableOpacity testID={`step-up-${sop.id}-${idx}`} style={s.actionBtn} onPress={() => moveStep(sop.id, idx, -1)}>
                              <Feather name="arrow-up" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                          )}
                          {idx < sop.steps.length - 1 && (
                            <TouchableOpacity testID={`step-down-${sop.id}-${idx}`} style={s.actionBtn} onPress={() => moveStep(sop.id, idx, 1)}>
                              <Feather name="arrow-down" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity testID={`step-delete-${sop.id}-${idx}`} style={s.actionBtn} onPress={() => removeStep(sop.id, idx)}>
                            <Feather name="trash-2" size={16} color="#D44" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TextInput testID={`step-instruction-${sop.id}-${idx}`} style={s.stepInput} placeholder="Step instruction..." placeholderTextColor={colors.textMuted} multiline value={step.instruction} onChangeText={v => updateStep(sop.id, idx, 'instruction', v)} />
                      <TextInput testID={`step-notes-${sop.id}-${idx}`} style={s.stepNotesInput} placeholder="Notes (optional)..." placeholderTextColor={colors.textMuted} multiline value={step.notes} onChangeText={v => updateStep(sop.id, idx, 'notes', v)} />
                    </View>
                  ))}

                  <TouchableOpacity testID={`add-step-${sop.id}`} style={s.addStepBtn} onPress={() => addStep(sop.id)}>
                    <Feather name="plus" size={16} color={colors.primary} />
                    <Text style={s.addStepText}>Add Step</Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID={`delete-sop-${sop.id}`} style={s.deleteBtn} onPress={() => deleteSOP(sop.id)}>
                    <Feather name="trash-2" size={14} color="#D44" />
                    <Text style={s.deleteText}>Delete SOP</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {!showAdd && (
          <TouchableOpacity testID="add-sop-btn" style={s.addSOPBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addSOPText}>+ New SOP</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
