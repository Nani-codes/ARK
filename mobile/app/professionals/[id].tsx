import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StarRating } from '@/components/StarRating';
import {
  fetchProfessional,
  fetchProfessionalReviews,
  requestProfessionalCallback,
  submitProfessionalReview,
} from '@/lib/api';
import { promptAuth } from '@/lib/authGate';
import { professionIcon, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const professionalId = Number(id);

  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: () => fetchProfessional(professionalId),
    enabled: Number.isFinite(professionalId),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['professional-reviews', professionalId],
    queryFn: () => fetchProfessionalReviews(professionalId),
    enabled: Number.isFinite(professionalId),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      submitProfessionalReview(professionalId, {
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      }),
    onSuccess: async () => {
      setShowReviewForm(false);
      setReviewComment('');
      await queryClient.invalidateQueries({ queryKey: ['professional', professionalId] });
      await queryClient.invalidateQueries({ queryKey: ['professional-reviews', professionalId] });
      Alert.alert('Thank you', 'Your review has been submitted.');
    },
    onError: (e) => {
      Alert.alert('Review failed', e instanceof Error ? e.message : 'Try again');
    },
  });

  const callbackMutation = useMutation({
    mutationFn: () => requestProfessionalCallback(professionalId, {}),
    onSuccess: () => Alert.alert('Request sent', 'The professional will be notified to call you back.'),
    onError: (e) => {
      Alert.alert('Request failed', e instanceof Error ? e.message : 'Try again');
    },
  });

  const pro = data?.data;
  const reviews = reviewsData?.data ?? pro?.reviews ?? [];
  const isOwnProfile = user?.id === pro?.userId;

  if (!Number.isFinite(professionalId)) return null;

  const location =
    pro?.city ?? pro?.serviceAreas?.map((a) => a.pincode).slice(0, 3).join(', ') ?? 'Hyderabad';

  const openWhatsApp = () => {
    const phone = (pro?.whatsapp ?? pro?.phone ?? '').replace(/\D/g, '').slice(-10);
    if (!phone) return;
    void Linking.openURL(`https://wa.me/91${phone}`);
  };

  const handleWriteReview = () => {
    if (!token) {
      promptAuth({
        returnTo: `/professionals/${professionalId}`,
        message: 'Sign in to write a review',
      });
      return;
    }
    setShowReviewForm(true);
  };

  const handleCallback = () => {
    if (!token) {
      promptAuth({
        returnTo: `/professionals/${professionalId}`,
        message: 'Sign in to request a callback',
      });
      return;
    }
    callbackMutation.mutate();
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Professional" showBack showCart={false} showLocation={false} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit12 }} />
      ) : isError || !pro ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Professional not found</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.hero}>
              {pro.coverImageUrl ? (
                <Image source={{ uri: pro.coverImageUrl }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={styles.coverPlaceholder} />
              )}
              <View style={styles.heroContent}>
                <View style={styles.avatarWrap}>
                  {pro.avatarUrl ? (
                    <Image source={{ uri: pro.avatarUrl }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarIcon}>
                      <MaterialIcons
                        name={professionIcon(pro.professionType) as keyof typeof MaterialIcons.glyphMap}
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  {pro.verified ? (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={16} color={colors.onSecondary} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.name}>{pro.displayName}</Text>
                {pro.headline ? <Text style={styles.headline}>{pro.headline}</Text> : null}
                <Text style={styles.trade}>
                  {professionLabel(pro.professionType, pro.otherProfession)}
                </Text>
                <StarRating
                  rating={pro.ratingAverage}
                  size={18}
                  showValue
                  count={pro.ratingCount}
                />
                <Text style={styles.meta}>
                  {pro.yearsExperience > 0 ? `${pro.yearsExperience}+ years · ` : ''}
                  {location}
                  {pro.contractorId ? ` · ${pro.contractorId}` : ''}
                </Text>
              </View>
            </View>

            {pro.specialties.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>SPECIALTIES</Text>
                <View style={styles.chips}>
                  {pro.specialties.map((spec) => (
                    <View key={spec.id} style={styles.chip}>
                      <Text style={styles.chipText}>{spec.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {pro.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ABOUT</Text>
                <Text style={styles.bio}>{pro.bio}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PORTFOLIO</Text>
              {pro.portfolioProjects?.length ? (
                <View style={styles.portfolio}>
                  {pro.portfolioProjects.map((project) => (
                    <View key={project.id} style={styles.projectCard}>
                      {project.imageUrls.length ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {project.imageUrls.map((uri) => (
                            <Pressable key={uri} onPress={() => setLightboxUri(uri)}>
                              <Image source={{ uri }} style={styles.projectImage} contentFit="cover" />
                            </Pressable>
                          ))}
                        </ScrollView>
                      ) : (
                        <View style={styles.projectPlaceholder}>
                          <MaterialIcons name="image" size={28} color={colors.iconMuted} />
                        </View>
                      )}
                      <View style={styles.projectBody}>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                        {project.location ? (
                          <Text style={styles.projectMeta}>{project.location}</Text>
                        ) : null}
                        {project.description ? (
                          <Text style={styles.projectDescription}>{project.description}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyWorks}>No portfolio projects added yet.</Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionLabel}>REVIEWS</Text>
                {!isOwnProfile ? (
                  <Pressable onPress={handleWriteReview}>
                    <Text style={styles.reviewAction}>Write a review</Text>
                  </Pressable>
                ) : null}
              </View>
              {showReviewForm ? (
                <View style={styles.reviewForm}>
                  <Text style={styles.reviewFormLabel}>Your rating</Text>
                  <StarRating
                    rating={reviewRating}
                    interactive
                    onChange={setReviewRating}
                    size={28}
                  />
                  <TextInput
                    style={styles.reviewInput}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Share your experience (optional)"
                    multiline
                  />
                  <View style={styles.reviewActions}>
                    <PrimaryButton
                      label="Submit review"
                      onPress={() => reviewMutation.mutate()}
                      loading={reviewMutation.isPending}
                    />
                    <PrimaryButton
                      label="Cancel"
                      variant="outline"
                      onPress={() => setShowReviewForm(false)}
                    />
                  </View>
                </View>
              ) : null}
              {reviews.length ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewAuthor}>{review.authorName}</Text>
                      <StarRating rating={review.rating} size={14} />
                    </View>
                    {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyWorks}>No reviews yet.</Text>
              )}
            </View>

            {isOwnProfile ? (
              <PrimaryButton
                label="Edit My Profile"
                variant="outline"
                onPress={() => router.push('/profile/professional')}
              />
            ) : null}
          </ScrollView>

          {!isOwnProfile ? (
            <View style={styles.contactBar}>
              {pro.phone ? (
                <Pressable
                  style={styles.contactBtn}
                  onPress={() => void Linking.openURL(`tel:+91${pro.phone}`)}>
                  <MaterialIcons name="phone" size={20} color={colors.onSecondary} />
                  <Text style={styles.contactText}>Call</Text>
                </Pressable>
              ) : null}
              {(pro.whatsapp ?? pro.phone) ? (
                <Pressable style={styles.contactBtn} onPress={openWhatsApp}>
                  <MaterialIcons name="chat" size={20} color={colors.onSecondary} />
                  <Text style={styles.contactText}>WhatsApp</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.contactBtn, styles.contactBtnPrimary]}
                onPress={handleCallback}>
                <MaterialIcons name="support-agent" size={20} color={colors.onSecondary} />
                <Text style={styles.contactText}>
                  {callbackMutation.isPending ? 'Sending...' : 'Callback'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      <Modal visible={Boolean(lightboxUri)} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          {lightboxUri ? (
            <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} contentFit="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.containerMargin },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurfaceVariant },
  hero: { marginBottom: spacing.unit4 },
  cover: { width: '100%', height: 160, backgroundColor: colors.surfaceContainerLow },
  coverPlaceholder: { width: '100%', height: 160, backgroundColor: colors.secondaryContainer },
  heroContent: { alignItems: 'center', paddingHorizontal: spacing.containerMargin, marginTop: -40 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  avatarIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: { ...typography.headlineMd, color: colors.primary, marginTop: spacing.unit3, textAlign: 'center' },
  headline: { ...typography.bodyMd, color: colors.onSurface, textAlign: 'center', marginTop: 4 },
  trade: { ...typography.labelLg, color: colors.secondary, marginTop: 4 },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit2, textAlign: 'center' },
  section: { paddingHorizontal: spacing.containerMargin, gap: spacing.unit3, marginBottom: spacing.unit6 },
  sectionLabel: { ...typography.labelLg, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2 },
  chip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit1,
  },
  chipText: { ...typography.labelMd, color: colors.onSecondaryContainer },
  bio: { ...typography.bodyMd, color: colors.onSurface },
  portfolio: { gap: spacing.unit3 },
  projectCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  projectImage: { width: 220, height: 160, marginRight: 1, backgroundColor: colors.surfaceContainerLow },
  projectPlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  projectBody: { padding: spacing.unit4, gap: 4 },
  projectTitle: { ...typography.labelLg, color: colors.primary },
  projectMeta: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 12 },
  projectDescription: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  emptyWorks: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAction: { ...typography.labelMd, color: colors.secondary, fontWeight: '700' },
  reviewForm: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit3,
  },
  reviewFormLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    minHeight: 80,
    textAlignVertical: 'top',
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  reviewActions: { gap: spacing.unit2 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit2,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthor: { ...typography.labelLg, color: colors.primary },
  reviewComment: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  contactBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.unit2,
    padding: spacing.containerMargin,
    paddingBottom: spacing.unit6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.unit3,
  },
  contactBtnPrimary: { backgroundColor: colors.secondary },
  contactText: { ...typography.labelMd, color: colors.onSecondary, fontWeight: '700' },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.containerMargin,
  },
  lightboxImage: { width: '100%', height: '80%' },
});
