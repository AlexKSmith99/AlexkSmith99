import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function MyProfileScreen({ navigation }: any) {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {profile?.profile_picture ? (
            <Image
              source={{ uri: profile.profile_picture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{profile?.name || 'Name not set'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {!profile?.name && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              Please add your name to complete your profile
            </Text>
          </View>
        )}

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.connections_count || 0}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile?.active_pursuits?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Active Pursuits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {profile?.past_pursuits?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Past Pursuits</Text>
        </View>
      </View>

      {/* Social Links */}
      {(profile?.linkedin || profile?.instagram || profile?.github || profile?.portfolio_website) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          {profile?.linkedin && (
            <View style={styles.linkItem}>
              <Ionicons name="logo-linkedin" size={20} color="#0077b5" />
              <Text style={styles.linkText}>LinkedIn</Text>
            </View>
          )}
          {profile?.instagram && (
            <View style={styles.linkItem}>
              <Ionicons name="logo-instagram" size={20} color="#e4405f" />
              <Text style={styles.linkText}>Instagram</Text>
            </View>
          )}
          {profile?.github && (
            <View style={styles.linkItem}>
              <Ionicons name="logo-github" size={20} color="#333" />
              <Text style={styles.linkText}>GitHub</Text>
            </View>
          )}
          {profile?.portfolio_website && (
            <View style={styles.linkItem}>
              <Ionicons name="globe-outline" size={20} color="#0ea5e9" />
              <Text style={styles.linkText}>Portfolio</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={24} color="#0ea5e9" />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#0ea5e9" />
          <Text style={styles.actionButtonText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
            Sign Out
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 30,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0ea5e9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
