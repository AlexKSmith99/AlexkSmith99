import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface PodDetailsScreenProps {
  pursuitId: string;
  onBack: () => void;
  onOpenTeamBoard: (pursuitId: string) => void;
  onViewApplication: (applicationId: string) => void;
  navigation?: any;
}

export default function PodDetailsScreen({
  pursuitId,
  onBack,
  onOpenTeamBoard,
  onViewApplication,
  navigation,
}: PodDetailsScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pursuit, setPursuit] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadPodDetails();
  }, []);

  const loadPodDetails = async () => {
    try {
      // Load pursuit details
      const { data: pursuitData, error: pursuitError } = await supabase
        .from('pursuits')
        .select('*')
        .eq('id', pursuitId)
        .single();

      if (pursuitError) throw pursuitError;
      setPursuit(pursuitData);
      setIsCreator(pursuitData.creator_id === user?.id);

      // Load team members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, profiles!user_id(id, name, profile_picture, email)')
        .eq('pursuit_id', pursuitId);

      if (membersError) throw membersError;

      // Get creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('id, name, profile_picture, email')
        .eq('id', pursuitData.creator_id)
        .single();

      // Combine creator and team members
      const allMembers = [
        { user_id: pursuitData.creator_id, profiles: creatorProfile, is_creator: true },
        ...(membersData || []).map((m: any) => ({ ...m, is_creator: false })),
      ];

      setTeamMembers(allMembers);

      // Load pending applications (only if creator)
      if (pursuitData.creator_id === user?.id) {
        const { data: appsData, error: appsError } = await supabase
          .from('pursuit_applications')
          .select('*, applicant:profiles!applicant_id(id, name, profile_picture, email)')
          .eq('pursuit_id', pursuitId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!appsError) {
          setPendingApplications(appsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading pod details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!pursuit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pod not found</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pod Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Pod Info Card */}
        <View style={styles.card}>
          <Text style={styles.podTitle}>{pursuit.title}</Text>
          <Text style={styles.podDescription}>{pursuit.description}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color="#8b5cf6" />
              <Text style={styles.infoText}>
                {teamMembers.length}/{pursuit.team_size_max} members
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#8b5cf6" />
              <Text style={styles.infoText}>{pursuit.meeting_cadence}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {pursuit.status === 'awaiting_kickoff' ? 'Awaiting Kickoff' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Team Board Button */}
        <TouchableOpacity
          style={styles.teamBoardButton}
          onPress={() => onOpenTeamBoard(pursuitId)}
        >
          <Ionicons name="grid" size={24} color="#fff" />
          <Text style={styles.teamBoardButtonText}>Open Team Board</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Team Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Team Members ({teamMembers.length})
          </Text>
          {teamMembers.map((member: any) => {
            const profile = member.profiles;
            return (
              <TouchableOpacity
                key={member.user_id}
                style={styles.memberCard}
                onPress={() =>
                  navigation?.navigate('UserProfile', { userId: member.user_id })
                }
              >
                {profile?.profile_picture ? (
                  <Image
                    source={{ uri: profile.profile_picture }}
                    style={styles.memberAvatar}
                  />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={styles.memberAvatarText}>
                      {profile?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {profile?.name || profile?.email?.split('@')[0] || 'Unknown'}
                  </Text>
                  {member.is_creator && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorBadgeText}>CREATOR</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pending Applications Section (only for creators) */}
        {isCreator && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Applications ({pendingApplications.length})
            </Text>
            {pendingApplications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No pending applications</Text>
              </View>
            ) : (
              pendingApplications.map((app: any) => {
                const applicant = app.applicant;
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.applicationCard}
                    onPress={() => onViewApplication(app.id)}
                  >
                    {applicant?.profile_picture ? (
                      <Image
                        source={{ uri: applicant.profile_picture }}
                        style={styles.applicationAvatar}
                      />
                    ) : (
                      <View style={styles.applicationAvatarPlaceholder}>
                        <Text style={styles.applicationAvatarText}>
                          {applicant?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.applicationInfo}>
                      <Text style={styles.applicationName}>
                        {applicant?.name || applicant?.email?.split('@')[0] || 'Unknown'}
                      </Text>
                      <Text style={styles.applicationDate}>
                        Applied {new Date(app.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>REVIEW</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  podTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  podDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  teamBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  teamBoardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  creatorBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creatorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  applicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  applicationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  applicationAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicationAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  applicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  applicationDate: {
    fontSize: 13,
    color: '#78350f',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
