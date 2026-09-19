import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { PlanTier } from '../navigation/routes';
import type { PayslipMimeType, PayslipRecord, PayslipUploadBody } from '../payslips/retention';
import {
  getPayslipFileDataError,
  requiresReplacementConfirmation,
  withReplacementConfirmation,
} from '../payslips/retention';
import { Header } from '../components/Header';
import { XButton } from '../components/XButton';
import { XCard } from '../components/XCard';
import { XInput } from '../components/XInput';
import { useTheme } from '../theme';

type SelectedImage = {
  fileData: string;
  mimeType: PayslipMimeType;
  label: string;
};

type CaricaCedolinoScreenProps = {
  tier: PlanTier;
  items: readonly PayslipRecord[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  onBack: () => void;
  onSubmit: (upload: PayslipUploadBody) => Promise<boolean>;
  onUnavailable: () => void;
};

function supportedImageMimeType(mimeType: string | undefined): PayslipMimeType | null {
  if (mimeType === 'image/jpeg' || mimeType === 'image/png') return mimeType;
  return null;
}

export function CaricaCedolinoScreen({
  tier,
  items,
  loading,
  error,
  successMessage,
  onBack,
  onSubmit,
  onUnavailable,
}: CaricaCedolinoScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const existingPayslip = tier === 'free' ? items[0] : undefined;

  const chooseImage = async (source: 'camera' | 'library'): Promise<void> => {
    setLocalError(null);
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setLocalError(source === 'camera'
          ? 'Autorizza la fotocamera per scattare il cedolino.'
          : 'Autorizza l’accesso alle immagini per scegliere il cedolino.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8, mediaTypes: ['images'] })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8, mediaTypes: ['images'] });
      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = supportedImageMimeType(asset.mimeType);
      if (!asset.base64 || !mimeType) {
        setLocalError('Seleziona un’immagine JPEG o PNG leggibile.');
        return;
      }
      const sizeError = getPayslipFileDataError(asset.base64);
      if (sizeError) {
        setLocalError(sizeError);
        return;
      }

      setSelected({ fileData: asset.base64, mimeType, label: asset.fileName ?? 'Immagine cedolino' });
    } catch {
      setLocalError('Impossibile aprire la fotocamera o la galleria. Riprova.');
    }
  };

  const submit = async (confirmed: boolean): Promise<void> => {
    if (!selected) {
      setLocalError('Scatta o scegli un’immagine prima di continuare.');
      return;
    }
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      setLocalError('Il mese deve essere compreso tra 1 e 12.');
      return;
    }
    if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) {
      setLocalError('Inserisci un anno compreso tra 2000 e 2100.');
      return;
    }
    setLocalError(null);
    await onSubmit(withReplacementConfirmation({
      fileData: selected.fileData,
      mimeType: selected.mimeType,
      month: numericMonth,
      year: numericYear,
    }, confirmed));
  };

  const requestSubmit = (): void => {
    if (requiresReplacementConfirmation(tier, items) && existingPayslip) {
      Alert.alert(
        'Sostituire il cedolino corrente?',
        `Il cedolino ${existingPayslip.month}/${existingPayslip.year} verrà rimosso. Il piano Free conserva un solo mese.`,
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Sostituisci', style: 'destructive', onPress: () => { void submit(true); } },
        ],
      );
      return;
    }
    void submit(false);
  };

  const options = [
    { icon: '📷', title: 'Scatta foto', desc: 'Usa la fotocamera', action: () => { void chooseImage('camera'); } },
    { icon: '📄', title: 'Carica PDF', desc: 'Non ancora disponibile', action: onUnavailable },
    { icon: '🖼', title: 'Importa immagine', desc: 'JPEG o PNG dalla galleria', action: () => { void chooseImage('library'); } },
    { icon: '✏', title: 'Inserisci dati manualmente', desc: 'Non ancora disponibile', action: onUnavailable },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Nuova analisi" subtitle="Scegli un’immagine reale del cedolino" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {existingPayslip && (
          <XCard highlight style={styles.noticeCard}>
            <Text style={[typography.h4, { color: colors.text }]}>Cedolino Free corrente: {existingPayslip.month}/{existingPayslip.year}</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Un nuovo caricamento richiede conferma e sostituirà questo record solo se il server accetta il documento.</Text>
          </XCard>
        )}

        {options.map(opt => (
          <TouchableOpacity key={opt.title} onPress={opt.action} activeOpacity={0.7}>
            <XCard style={styles.optionCard} elevated>
              <View style={styles.optionRow}>
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{opt.title}</Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>{opt.desc}</Text>
                </View>
                <Text style={[typography.h3, { color: colors.textTertiary }]}>›</Text>
              </View>
            </XCard>
          </TouchableOpacity>
        ))}

        {selected && (
          <XCard style={styles.formCard}>
            <Text style={[typography.h4, { color: colors.text }]}>{selected.label}</Text>
            <View style={styles.dateRow}>
              <XInput label="Mese" value={month} onChangeText={setMonth} keyboardType="numeric" style={styles.dateInput} />
              <XInput label="Anno" value={year} onChangeText={setYear} keyboardType="numeric" style={styles.dateInput} />
            </View>
            <XButton title="Carica cedolino" onPress={requestSubmit} loading={loading} style={styles.submitButton} />
          </XCard>
        )}

        {(localError || error) && <Text style={[typography.bodySmall, styles.feedback, { color: colors.danger }]}>{localError ?? error}</Text>}
        {successMessage && <Text style={[typography.bodySmall, styles.feedback, { color: colors.success }]}>{successMessage}</Text>}
        <Text style={[typography.bodySmall, styles.privacy, { color: colors.textTertiary }]}>Il documento viene inviato solo all’API configurata per il profilo autenticato.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  noticeCard: { marginBottom: 12 },
  optionCard: { marginVertical: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionIcon: { fontSize: 28 },
  optionText: { flex: 1 },
  formCard: { marginTop: 16 },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dateInput: { flex: 1 },
  submitButton: { marginTop: 16 },
  feedback: { textAlign: 'center', marginTop: 16 },
  privacy: { textAlign: 'center', marginTop: 24 },
});
