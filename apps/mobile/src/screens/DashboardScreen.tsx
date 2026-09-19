import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { BadgeShift } from '../badge/presentation';
import { formatElapsed } from '../badge/presentation';
import type { PlanTier } from '../navigation/routes';
import { useTheme } from '../theme';
import { XCard } from '../components/XCard';
import { XButton } from '../components/XButton';
import { StatusBadge } from '../components/StatusBadge';
import { BottomNav } from '../components/BottomNav';

interface DashboardScreenProps {
  tier: PlanTier;
  userName: string;
  ccnl: string;
  livello: string;
  lastAnalysis: {
    month: string;
    critici: number;
    warning: number;
    ok: number;
  };
  badgeShift: BadgeShift | null;
  badgeLoading: boolean;
  badgeError: string | null;
  onBadgeStart: () => void;
  onBadgeStop: () => void;
  onNavigate: (screen: string) => void;
  onNavTab: (tab: 'home' | 'calendar' | 'archive' | 'settings') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  tier,
  userName,
  ccnl,
  livello,
  lastAnalysis,
  badgeShift,
  badgeLoading,
  badgeError,
  onBadgeStart,
  onBadgeStop,
  onNavigate,
  onNavTab,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!badgeShift) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [badgeShift]);

  const quickActions = [
    { label: 'Carica cedolino', icon: '📄', screen: 'carica' },
    { label: tier === 'pro' ? 'Gestisci Badge' : 'Badge Pro', icon: '⏱', screen: 'badge' },
    { label: 'Apri calendario', icon: '🗓', screen: 'calendario' },
    { label: 'Confronta mesi', icon: '📊', screen: 'confronto' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.h3, { color: colors.text }]}>
              Ciao, {userName}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {ccnl} — Livello {livello}
            </Text>
          </View>
          <StatusBadge label={tier.toUpperCase()} type={tier === 'pro' ? 'pro' : 'freemium'} />
        </View>

        {/* Last Analysis Card */}
        <XCard elevated style={styles.analysisCard}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            ULTIMA ANALISI
          </Text>
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.sm }]}>
            {lastAnalysis.month}
          </Text>

          <View style={styles.semaforiRow}>
            <View style={styles.semaforoItem}>
              <Text style={[styles.semaforoNumber, { color: colors.danger }]}>
                {lastAnalysis.critici}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Criticità</Text>
            </View>
            <View style={styles.semaforoItem}>
              <Text style={[styles.semaforoNumber, { color: colors.warning }]}>
                {lastAnalysis.warning}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Avvisi</Text>
            </View>
            <View style={styles.semaforoItem}>
              <Text style={[styles.semaforoNumber, { color: colors.success }]}>
                {lastAnalysis.ok}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Controlli OK</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onNavigate('report')}
            style={[styles.reportBtn, { backgroundColor: colors.primaryMuted }]}
          >
            <Text style={[typography.button, { color: colors.primary }]}>
              Apri report →
            </Text>
          </TouchableOpacity>
        </XCard>

        <XCard highlight style={styles.badgeCard}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>BADGE</Text>
          {tier === 'pro' ? (
            badgeShift ? (
              <>
                <Text style={[styles.badgeElapsed, { color: colors.primary }]}>{formatElapsed(badgeShift.startedAt, now)}</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Turno iniziato alle {new Date(badgeShift.startedAt).toLocaleTimeString('it-IT')}</Text>
                <XButton title="Termina turno" variant="danger" onPress={onBadgeStop} loading={badgeLoading} style={styles.badgeButton} />
              </>
            ) : (
              <>
                <Text style={[typography.h4, { color: colors.text, marginTop: spacing.sm }]}>Nessun turno aperto</Text>
                <XButton title="Inizia turno" onPress={onBadgeStart} loading={badgeLoading} style={styles.badgeButton} />
              </>
            )
          ) : (
            <>
              <Text style={[typography.h4, { color: colors.text, marginTop: spacing.sm }]}>Timbrature disponibili con Pro</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Il piano Free non può avviare o terminare turni.</Text>
              <XButton title="Scopri Pro" variant="outline" onPress={() => onNavigate('badge')} style={styles.badgeButton} />
            </>
          )}
          {tier === 'pro' && (
            <TouchableOpacity onPress={() => onNavigate('badge')} style={styles.historyLink}>
              <Text style={[typography.button, { color: colors.primary }]}>Apri storico timbrature →</Text>
            </TouchableOpacity>
          )}
          {badgeError && (
            <Text style={[typography.bodySmall, { color: colors.danger, marginTop: spacing.sm }]}>{badgeError}</Text>
          )}
        </XCard>

        {/* Quick Actions */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl }]}>
          Azioni rapide
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onNavigate(action.screen)}
              style={[styles.actionItem, { backgroundColor: colors.surface }]}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="home" onChange={onNavTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  analysisCard: {
    marginTop: 8,
  },
  badgeCard: {
    marginTop: 12,
  },
  badgeElapsed: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  badgeButton: {
    marginTop: 14,
  },
  historyLink: {
    alignItems: 'center',
    paddingTop: 14,
  },
  semaforiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 16,
  },
  semaforoItem: {
    alignItems: 'center',
  },
  semaforoNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  reportBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  actionItem: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actionIcon: {
    fontSize: 28,
  },
});
