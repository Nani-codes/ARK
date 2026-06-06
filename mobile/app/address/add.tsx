import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  ADDRESS_TYPE_CONFIG,
  formatFullAddress,
  nominatimSearch,
  parseNominatim,
  type NominatimResult,
} from '@/lib/addressFormat';
import { colors, spacing, typography } from '@/lib/theme';
import type { AddressType } from '@/lib/types';
import { useAddressStore } from '@/stores/addresses';
import { useLocationStore } from '@/stores/location';

type FormFields = {
  flat: string;
  building: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  instructions: string;
};

const EMPTY_FORM: FormFields = {
  flat: '', building: '', street: '', landmark: '',
  city: '', state: '', pincode: '', instructions: '',
};

export default function AddAddressScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    prefillStreet?: string;
    prefillCity?: string;
  }>();

  const isEditing = Boolean(params.id);
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const setDeliveryAddress = useLocationStore((s) => s.setDeliveryAddress);

  const existing = isEditing ? addresses.find((a) => a.id === params.id) : undefined;

  const [form, setForm] = useState<FormFields>(() => {
    if (existing) {
      return {
        flat: existing.flat,
        building: existing.building ?? '',
        street: existing.street,
        landmark: existing.landmark ?? '',
        city: existing.city,
        state: existing.state,
        pincode: existing.pincode,
        instructions: existing.instructions ?? '',
      };
    }
    return {
      ...EMPTY_FORM,
      street: params.prefillStreet ?? '',
      city: params.prefillCity ?? '',
    };
  });

  const [label, setLabel] = useState<AddressType>(existing?.label ?? 'home');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [lat, setLat] = useState<number | undefined>(existing?.lat);
  const [lng, setLng] = useState<number | undefined>(existing?.lng);

  // ── Search ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    const results = await nominatimSearch(query, ctrl.signal);
    setSearching(false);
    setSuggestions(results);
  }, []);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim() || text.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => void runSearch(text), 400);
  };

  const applySuggestion = (r: NominatimResult) => {
    const parsed = parseNominatim(r);
    setForm((f) => ({ ...f, ...parsed, building: f.building, landmark: f.landmark, instructions: f.instructions }));
    setLat(parsed.lat);
    setLng(parsed.lng);
    setSearch('');
    setSuggestions([]);
  };

  // ── GPS ───────────────────────────────────────────────────────────
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert('Permission denied', 'Enable location permission to use this feature.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (!geo) return;

      setForm((f) => ({
        ...f,
        flat: geo.name ?? f.flat,
        street: [geo.street, geo.district ?? geo.subregion].filter(Boolean).join(', ') || f.street,
        city: geo.city ?? geo.subregion ?? f.city,
        state: geo.region ?? f.state,
        pincode: geo.postalCode ?? f.pincode,
      }));
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    } catch {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setGpsLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Partial<FormFields>>({});

  const validate = () => {
    const e: Partial<FormFields> = {};
    if (!form.flat.trim()) e.flat = 'Required';
    if (!form.street.trim()) e.street = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      label,
      flat: form.flat.trim(),
      building: form.building.trim() || undefined,
      street: form.street.trim(),
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      instructions: form.instructions.trim() || undefined,
      lat,
      lng,
      isDefault,
    };

    if (isEditing && params.id) {
      updateAddress(params.id, data);
      router.back(); // back to select
    } else {
      const id = addAddress(data);
      // Auto-select the new address and sync to location store
      selectAddress(id);
      const savedAddr = { ...data, id, isDefault: data.isDefault ?? false };
      setDeliveryAddress(formatFullAddress(savedAddr));
      // Go back to select screen; user taps "Deliver Here" to confirm
      router.back();
    }
  };

  const field = (
    key: keyof FormFields,
    label: string,
    opts?: { optional?: boolean; numeric?: boolean; multiline?: boolean }
  ) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}{!opts?.optional ? ' *' : ''}
      </Text>
      <TextInput
        style={[styles.fieldInput, opts?.multiline && styles.fieldMultiline, errors[key] && styles.fieldError]}
        value={form[key]}
        onChangeText={(t) => { setForm((f) => ({ ...f, [key]: t })); setErrors((e) => ({ ...e, [key]: undefined })); }}
        placeholder={opts?.optional ? 'Optional' : label}
        placeholderTextColor={colors.onSurfaceVariant}
        keyboardType={opts?.numeric ? 'numeric' : 'default'}
        multiline={opts?.multiline}
        numberOfLines={opts?.multiline ? 2 : 1}
        textAlignVertical={opts?.multiline ? 'top' : 'center'}
        autoCapitalize="words"
      />
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppHeader
          title={isEditing ? 'Edit Address' : 'Add New Address'}
          showBack
          showCart={false}
          showLocation={false}
        />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Search ─────────────────────────────────────────────── */}
          <View style={styles.searchCard}>
            <MaterialIcons name="search" size={20} color={colors.iconMuted} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={handleSearchChange}
              placeholder="Search for area, street, city…"
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="none"
            />
            {searching && <ActivityIndicator size="small" color={colors.secondary} />}
          </View>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.place_id}
                  style={styles.suggestion}
                  onPress={() => applySuggestion(s)}>
                  <MaterialIcons name="location-on" size={16} color={colors.iconMuted} />
                  <Text style={styles.suggestionText} numberOfLines={2}>{s.display_name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── GPS ────────────────────────────────────────────────── */}
          <Pressable
            style={[styles.gpsBtn, gpsLoading && styles.disabled]}
            onPress={handleGPS}
            disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator size="small" color={colors.secondary} />
              : <MaterialIcons name="my-location" size={18} color={colors.secondary} />}
            <Text style={styles.gpsBtnText}>
              {gpsLoading ? 'Detecting location…' : 'Use Current Location'}
            </Text>
          </Pressable>

          <View style={styles.divider} />

          {/* ── Form Fields ─────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>ADDRESS DETAILS</Text>
          <View style={styles.formGrid}>
            {field('flat', 'House / Flat / Door No')}
            {field('building', 'Building / Apartment', { optional: true })}
            {field('street', 'Street / Area')}
            {field('landmark', 'Landmark', { optional: true })}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>{field('city', 'City')}</View>
              <View style={{ flex: 1 }}>{field('state', 'State')}</View>
            </View>
            {field('pincode', 'Pincode', { numeric: true })}
            {field('instructions', 'Delivery Instructions', { optional: true, multiline: true })}
          </View>

          {/* ── Address Type ─────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.unit4 }]}>ADDRESS TYPE</Text>
          <View style={styles.typeRow}>
            {(['home', 'work', 'other'] as AddressType[]).map((t) => {
              const cfg = ADDRESS_TYPE_CONFIG[t];
              const active = label === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.typeChip, active && { borderColor: cfg.color, backgroundColor: cfg.color + '14' }]}
                  onPress={() => setLabel(t)}>
                  <MaterialIcons name={cfg.icon} size={18} color={active ? cfg.color : colors.iconMuted} />
                  <Text style={[styles.typeText, active && { color: cfg.color }]}>{cfg.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Default Toggle ───────────────────────────────────────── */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Set as Default Address</Text>
              <Text style={styles.toggleSub}>Use this address for all future orders</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.outlineVariant, true: colors.secondary }}
              thumbColor={colors.surface}
            />
          </View>

          <PrimaryButton
            label={isEditing ? 'Save Changes' : 'Save Address'}
            onPress={handleSave}
            style={{ marginTop: spacing.unit4 }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },

  // Search
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface, paddingVertical: 6 },

  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    marginTop: -spacing.unit2,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.unit2,
    padding: spacing.unit3,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  suggestionText: { ...typography.bodyMd, color: colors.onSurface, flex: 1, lineHeight: 20 },

  // GPS
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surface,
  },
  gpsBtnText: { ...typography.labelLg, color: colors.secondary },
  disabled: { opacity: 0.5 },

  divider: { height: 1, backgroundColor: colors.outlineVariant },

  sectionLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },

  // Form
  formGrid: { gap: spacing.unit3 },
  row: { flexDirection: 'row', gap: spacing.unit3 },
  fieldWrap: { gap: 4 },
  fieldLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  fieldInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: 10,
  },
  fieldMultiline: { minHeight: 64, paddingTop: 10 },
  fieldError: { borderColor: colors.error },
  errorText: { fontSize: 11, color: colors.error },

  // Address type
  typeRow: { flexDirection: 'row', gap: spacing.unit3 },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  typeText: { ...typography.labelLg, color: colors.iconMuted },

  // Default toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit4,
  },
  toggleLabel: { ...typography.labelLg, color: colors.onSurface },
  toggleSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
});
