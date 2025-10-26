import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pursuitService } from '../../services/pursuitService';
import { Pursuit } from '../../types';

export default function TeamDetailScreen({ route, navigation }: any) {
  const { pursuitId } = route.params;
  const [pursuit, setPursuit] = useState<Pursuit | null>(null);

  useEffect(() => {
    loadPursuit();
  }, []);

  const loadPursuit = async () => {
    try {
      const data = await pursuitService.getPursuit(pursuitId);
      setPursuit(data);
    } catch (error) {
      console.error('Error loading pursuit:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>{pursuit?.title}</Text>
        <Text style={styles.status}>
          Status: {pursuit?.status === 'active' ? 'Active' : 'Awaiting Kickoff'}
        </Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('TeamBoard', { pursuitId })}
        >
          <Ionicons name="grid-outline" size={24} color="#0ea5e9" />
          <Text style={styles.menuItemText}>Team Board</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MeetingNotes', { pursuitId })}
        >
          <Ionicons name="document-text-outline" size={24} color="#0ea5e9" />
          <Text style={styles.menuItemText}>Meeting Notes</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('TeamGallery', { pursuitId })}
        >
          <Ionicons name="images-outline" size={24} color="#0ea5e9" />
          <Text style={styles.menuItemText}>Photo Gallery</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Chat', { pursuitId })}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#0ea5e9" />
          <Text style={styles.menuItemText}>Group Chat</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members</Text>
        {pursuit?.members?.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberCard}
            onPress={() =>
              navigation.navigate('UserProfile', { userId: member.user_id })
            }
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.user?.email?.split('@')[0]}
              </Text>
              {member.role && (
                <Text style={styles.memberRole}>{member.role}</Text>
              )}
            </View>
            {member.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
