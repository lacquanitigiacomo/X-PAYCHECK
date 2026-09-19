import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Header } from '../components/Header';
import { XCard } from '../components/XCard';
import { StatusBadge } from '../components/StatusBadge';

interface ReportAnalisiScreenProps {
  onBack: () => void;
  onCorreggiDati: () => void;
  onGeneraAnalisi: () => void;
  analysisData: {
    month: string;
    ccnl: string;
    livello: string;
    stato: string;
    critici: number;
    warning: number;
    ok: number;
    anomalie: Array<{
      id: string;
      titolo: string;
      descrizione: string;
      severita: 'CRITICO' | 'WARNING';
      delta?: string;
    }>;
  };
}

export const ReportAnalisiScreen: React.FC<ReportAnalisiScreenProps> = ({
  onBack,
  onCorreggiDati,
  onGeneraAnalisi,
  analysisData,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={`Analisi — ${analysisData.month}`}
        subtitle={`${analysisData.ccnl} — Livello ${analysisData.livello}`}
        onBack={onBack}
        rightAction={<StatusBadge label={analysisData.stato} type="error" />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <XCard elevated style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Text style={[styles.summaryNumber, { color: colors.danger }]}>
                {analysisData.critici}
              </Text>
              <Text style={[typography.caption, { color: colors.danger }]}>Criticità</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
              <Text style={[styles.summaryNumber, { color: colors.warning }]}>
                {analysisData.warning}
              </Text>
              <Text style={[typography.caption, { color: colors.warning }]}>Avvisi</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Text style={[styles.summaryNumber, { color: colors.success }]}>
                {analysisData.ok}
              </Text>
              <Text style={[typography.caption, { color: colors.success }]}>OK</Text>
            </View>
          </View>
        </XCard>

        {/* Anomalie */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          Anomalie critiche
        </Text>

        {analysisData.anomalie.map((anomalia) => (
          <XCard
            key={anomalia.id}
            highlight={anomalia.severita === 'CRITICO'}
            style={styles.anomaliaCard}
          >
            <View style={styles.anomaliaHeader}>
              <Text style={[typography.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>
                {anomalia.titolo}
              </Text>
              {anomalia.delta && (
                <Text style={[typography.bodySmall, { color: colors.danger, fontWeight: '700' }]}>
                  {anomalia.delta}
                </Text>
              )}
            </View>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              {anomalia.descrizione}
            </Text>
            <TouchableOpacity style={styles.maggiorazioneLink}>
              <Text style={[typography.bodySmall, { color: colors.primary }]}>
                Maggiorazione notturna ›
              </Text>
            </TouchableOpacity>
          </XCard>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCorreggiDati}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
          >
            <Text style={[typography.button, { color: colors.text }]}>Correggi dati</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGeneraAnalisi}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[typography.button, { color: colors.textInverse }]}>Genera e analizza</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  anomaliaCard: {
    marginVertical: 6,
  },
  anomaliaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maggiorazioneLink: {
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
