import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { connectionService } from '../../services/connectionService';
import { UserProfile } from '../../types';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Redirect to own profile if viewing yourself
    if (user && userId === user.id) {
      navigation.replace('MyProfile');
      return;
    }

    loadProfile();
    checkConnection();
  }, [userId, user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkConnection = async () => {
    if (user) {
      const connected = await connectionService.areConnected(user.id, userId);
      setIsConnected(connected);
    }
  };

  const handleConnect = async () => {
    try {
      if (user) {
        await connectionService.sendConnectionRequest(user.id, userId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', {
      userId,
      userName: profile?.name || profile?.email?.split('@')[0] || 'User',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        {profile?.profile_picture ? (
          <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <Text style={styles.name}>
          {profile?.name || 'Name not set'}
        </Text>
        {profile?.email && (
          <Text style={styles.email}>{profile.email}</Text>
        )}

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.actionButtons}>
          {!isConnected && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={20} color="#0ea5e9" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {profile?.privacy_settings?.show_social_links && (
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
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageButton: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#0ea5e9',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
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
});
