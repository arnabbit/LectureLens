import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';
import { gemini } from '@/services/gemini';

export default function SettingsScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gemini.getApiKey().then((key) => {
      if (key) setApiKey(key);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await gemini.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={M3.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={M3.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>GEMINI API KEY</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={(t) => { setApiKey(t); setSaved(false); }}
            placeholder="Paste your Gemini API key"
            placeholderTextColor={M3.outline}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>
            Required for the AI chat feature on problem pages.
          </Text>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            {saved ? (
              <MaterialCommunityIcons name="check" size={20} color={M3.onPrimary} />
            ) : null}
            <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: M3.primary },

  content: { paddingHorizontal: 24 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: M3.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurface,
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: M3.outlineVariant,
    padding: 16,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: M3.outline,
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: M3.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.onPrimary },
});
