import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { pursuitService } from '../../services/pursuitService';
import { Pursuit } from '../../types';

export default function PursuitDetailScreen({ route, navigation }: any) {
  const { pursuitId } = route.params;
  const { user } = useAuth();
  const [pursuit, setPursuit] = useState<Pursuit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadPursuit();
  }, []);

  const loadPursuit = async () => {
    try {
      const data = await pursuitService.getPursuit(pursuitId);
      setPursuit(data);
      setIsCreator(data.creator_id === user?.id);
      setIsMember(data.members?.some((m) => m.user_id === user?.id) || false);
    } catch (error) {
      console.error('Error loading pursuit:', error);
      Alert.alert('Error', 'Failed to load pursuit details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    navigation.navigate('Application', { pursuitId });
  };

  const handleViewApplications = () => {
    navigation.navigate('Applications', { pursuitId });
  };

  const handleViewTeam = () => {
    navigation.navigate('TeamDetail', { pursuitId });
  };

  const handleViewTeamBoard = () => {
    navigation.navigate('TeamBoard', { pursuitId });
  };

  const handleDelistPursuit = async () => {
    Alert.alert(
      'Delist Pursuit',
      'Are you sure you want to delist this pursuit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delist',
          style: 'destructive',
          onPress: async () => {
            try {
              await pursuitService.delistPursuit(pursuitId);
              Alert.alert('Success', 'Pursuit delisted', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading || !pursuit) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const spotsRemaining = pursuit.team_size_max - pursuit.current_members_count;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, {
          backgroundColor: pursuit.status === 'active' ? '#10b981' : '#f59e0b'
        }]}>
          <Text style={styles.statusText}>
            {pursuit.status === 'active' ? 'Active' : 'Awaiting Kickoff'}
          </Text>
        </View>
        <Text style={styles.title}>{pursuit.title}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{pursuit.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>
            {pursuit.current_members_count}/{pursuit.team_size_max} members
            ({spotsRemaining} spots remaining)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#0ea5e9" />
          <Text style={styles.infoText}>{pursuit.location}</Text>
        </View>
        {pursuit.projected_duration && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#0ea5e9" />
            <Text style={styles.infoText}>{pursuit.projected_duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pursuit Types</Text>
        <View style={styles.tagContainer}>
          {pursuit.pursuit_types.map((type, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      {pursuit.pursuit_categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.tagContainer}>
            {pursuit.pursuit_categories.map((category, index) => (
              <View key={index} style={[styles.tag, styles.categoryTag]}>
                <Text style={styles.categoryTagText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meeting Details</Text>
        <Text style={styles.detailLabel}>Cadence:</Text>
        <Text style={styles.detailValue}>{pursuit.meeting_cadence}</Text>
        {pursuit.meeting_cadence_note && (
          <Text style={styles.detailNote}>Note: {pursuit.meeting_cadence_note}</Text>
        )}
        <Text style={styles.detailLabel}>Attendance Style:</Text>
        <Text style={styles.detailValue}>{pursuit.attendance_style}</Text>
        {pursuit.attendance_note && (
          <Text style={styles.detailNote}>Note: {pursuit.attendance_note}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Decision System</Text>
        <Text style={styles.detailValue}>
          {pursuit.decision_system.replace(/_/g, ' ').toUpperCase()}
        </Text>
        {pursuit.decision_system_note && (
          <Text style={styles.detailNote}>Note: {pursuit.decision_system_note}</Text>
        )}
      </View>

      {pursuit.ownership_structure && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership Structure</Text>
          <Text style={styles.detailValue}>{pursuit.ownership_structure}</Text>
        </View>
      )}

      {pursuit.roles && pursuit.roles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roles</Text>
          {pursuit.roles.map((role, index) => (
            <Text key={index} style={styles.bulletItem}>• {role}</Text>
          ))}
        </View>
      )}

      {pursuit.experience_level && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <Text style={styles.detailValue}>{pursuit.experience_level}</Text>
        </View>
      )}

      {pursuit.creator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created By</Text>
          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => navigation.navigate('UserProfile', { userId: pursuit.creator_id })}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.creatorName}>
              {pursuit.creator.email?.split('@')[0]}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {pursuit.members && pursuit.members.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members ({pursuit.members.length})</Text>
          {pursuit.members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onPress={() => navigation.navigate('UserProfile', { userId: member.user_id })}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user?.email?.split('@')[0]}
                </Text>
                {member.is_admin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {isMember && (
            <TouchableOpacity style={styles.viewTeamButton} onPress={handleViewTeam}>
              <Text style={styles.viewTeamText}>View Team Page</Text>
              <Ionicons name="arrow-forward" size={16} color="#0ea5e9" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        {isCreator ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewApplications}>
              <Text style={styles.primaryButtonText}>View Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewTeam}>
              <Text style={styles.primaryButtonText}>Manage Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.teamBoardButton} onPress={handleViewTeamBoard}>
              <Text style={styles.teamBoardButtonText}>📋 Team Board</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={handleDelistPursuit}>
              <Text style={styles.dangerButtonText}>Delist Pursuit</Text>
            </TouchableOpacity>
          </>
        ) : isMember ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewTeam}>
              <Text style={styles.primaryButtonText}>View Team Page</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.teamBoardButton} onPress={handleViewTeamBoard}>
              <Text style={styles.teamBoardButtonText}>📋 Team Board</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleApply}>
            <Text style={styles.primaryButtonText}>Apply to Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTag: {
    backgroundColor: '#f0fdf4',
  },
  categoryTagText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '500',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bulletItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  adminBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  adminText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewTeamText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  buttonContainer: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamBoardButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  teamBoardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
