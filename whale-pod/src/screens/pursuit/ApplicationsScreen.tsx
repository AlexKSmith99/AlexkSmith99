import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pursuitService } from '../../services/pursuitService';
import { notificationService } from '../../services/notificationService';
import { PursuitApplication } from '../../types';

export default function ApplicationsScreen({ route, navigation }: any) {
  const { pursuitId } = route.params;
  const [applications, setApplications] = useState<PursuitApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await pursuitService.getApplications(pursuitId);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (application: PursuitApplication) => {
    Alert.alert(
      'Accept Application',
      `Accept ${application.applicant?.email?.split('@')[0]} to your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await pursuitService.updateApplicationStatus(application.id, 'accepted');

              // Send notification to applicant
              await notificationService.createNotification(
                application.applicant_id,
                'acceptance',
                'Application Accepted!',
                'Your application has been accepted. Welcome to the team!'
              );

              Alert.alert('Success', 'Application accepted!');
              loadApplications();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (application: PursuitApplication) => {
    Alert.alert(
      'Decline Application',
      'Are you sure you want to decline this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await pursuitService.updateApplicationStatus(application.id, 'declined');
              Alert.alert('Application declined');
              loadApplications();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderApplication = ({ item }: { item: PursuitApplication }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicantHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>
            {item.applicant?.email?.split('@')[0]}
          </Text>
          <Text style={styles.applicationDate}>
            Applied {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('UserProfile', { userId: item.applicant_id })}
        >
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.answersContainer}>
        {item.answers.map((answer, index) => (
          <View key={index} style={styles.answerBlock}>
            <Text style={styles.questionText}>{answer.question}</Text>
            <Text style={styles.answerText}>{answer.answer}</Text>
          </View>
        ))}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDecline(item)}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status !== 'pending' && (
        <View style={[styles.statusBadge, {
          backgroundColor: item.status === 'accepted' ? '#10b981' : '#ef4444'
        }]}>
          <Text style={styles.statusText}>
            {item.status === 'accepted' ? 'Accepted' : 'Declined'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No applications yet</Text>
            <Text style={styles.emptySubtext}>
              Applications will appear here when people apply
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  applicationCard: {
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
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  applicationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  answersContainer: {
    marginBottom: 16,
  },
  answerBlock: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
});
