import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pursuit } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/designSystem';

interface PursuitCardProps {
  pursuit: Pursuit;
  onPress: () => void;
  onCreatorPress?: () => void;
}

export default function PursuitCard({ pursuit, onPress, onCreatorPress }: PursuitCardProps) {
  const isActive = pursuit.status === 'active';
  const statusColor = isActive ? colors.success : colors.warning;
  const statusBgColor = isActive ? colors.successLight : colors.warningLight;
  const statusText = isActive ? 'Active' : 'Awaiting Kickoff';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with Title and Status */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {pursuit.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {pursuit.description}
      </Text>

      {/* Tags */}
      {pursuit.pursuit_types && pursuit.pursuit_types.length > 0 && (
        <View style={styles.tags}>
          {pursuit.pursuit_types.slice(0, 3).map((type: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{type}</Text>
            </View>
          ))}
          {pursuit.pursuit_types.length > 3 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{pursuit.pursuit_types.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer with Info */}
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={14} color={colors.textSecondary} />
            </View>
            <Text style={styles.infoText}>
              {pursuit.current_members_count}/{pursuit.team_size_max}
            </Text>
          </View>

          {pursuit.location && (
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {pursuit.location}
              </Text>
            </View>
          )}
        </View>

        {/* Creator */}
        {pursuit.creator && (
          <TouchableOpacity
            style={styles.creatorContainer}
            onPress={(e) => {
              e.stopPropagation();
              onCreatorPress?.();
            }}
            disabled={!onCreatorPress}
            activeOpacity={0.7}
          >
            {pursuit.creator.profile_picture ? (
              <Image
                source={{ uri: pursuit.creator.profile_picture }}
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={[styles.creatorAvatar, styles.creatorAvatarPlaceholder]}>
                <Text style={styles.creatorAvatarText}>
                  {pursuit.creator.name?.charAt(0).toUpperCase() ||
                   pursuit.creator.email?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName} numberOfLines={1}>
              {pursuit.creator.name || pursuit.creator.email?.split('@')[0] || 'Unknown'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  title: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginRight: spacing.md,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  // Description
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },

  // Tags
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },

  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },

  // Footer
  footer: {
    gap: spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // Creator
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
  },

  creatorAvatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  creatorAvatarText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },

  creatorName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
