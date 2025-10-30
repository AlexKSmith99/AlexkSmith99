import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pursuit } from '../types';

interface PursuitCardProps {
  pursuit: Pursuit;
  onPress: () => void;
  onCreatorPress?: () => void;
}

export default function PursuitCard({ pursuit, onPress, onCreatorPress }: PursuitCardProps) {
  const statusColor = pursuit.status === 'active' ? '#10b981' : '#f59e0b';
  const statusText = pursuit.status === 'active' ? 'Active' : 'Awaiting Kickoff';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {pursuit.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {pursuit.description}
      </Text>

      <View style={styles.tags}>
        {pursuit.pursuit_types.slice(0, 3).map((type, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{type}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.info}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {pursuit.current_members_count}/{pursuit.team_size_max} members
          </Text>
        </View>
        <View style={styles.info}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{pursuit.location}</Text>
        </View>
      </View>

      {pursuit.creator && (
        <TouchableOpacity
          style={styles.creatorContainer}
          onPress={(e) => {
            e.stopPropagation();
            onCreatorPress?.();
          }}
          disabled={!onCreatorPress}
        >
          {pursuit.creator.profile_picture ? (
            <Image
              source={{ uri: pursuit.creator.profile_picture }}
              style={styles.creatorAvatar}
            />
          ) : (
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {pursuit.creator.name?.charAt(0).toUpperCase() ||
                 pursuit.creator.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.creator}>
            Created by {pursuit.creator.name || pursuit.creator.email?.split('@')[0]}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#0284c7',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  creatorAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  creator: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
