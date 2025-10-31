import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { applicationService } from '../services/applicationService';

interface ApplicationReviewScreenProps {
  applicationId: string;
  onBack: () => void;
  navigation?: any;
}

export default function ApplicationReviewScreen({
  applicationId,
  onBack,
  navigation,
}: ApplicationReviewScreenProps) {
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [pursuit, setPursuit] = useState<any>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      // Load application with applicant details
      const { data: appData, error: appError } = await supabase
        .from('pursuit_applications')
        .select('*, applicant:profiles!applicant_id(*)')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;
      setApplication(appData);
      setApplicant(appData.applicant);

      // Load pursuit details (to get questions)
      const { data: pursuitData, error: pursuitError } = await supabase
        .from('pursuits')
        .select('*')
        .eq('id', appData.pursuit_id)
        .single();

      if (pursuitError) throw pursuitError;
      setPursuit(pursuitData);
    } catch (error) {
      console.error('Error loading application:', error);
      Alert.alert('Error', 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.alert(
      'Accept Application',
      `Are you sure you want to accept ${applicant?.name || 'this applicant'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessing(true);
            try {
              // Update application status
              await applicationService.acceptApplication(applicationId);

              // Add to team_members table
              const { error: teamError } = await supabase
                .from('team_members')
                .insert([
                  {
                    pursuit_id: application.pursuit_id,
                    user_id: applicant.id,
                  },
                ]);

              if (teamError) throw teamError;

              // Update pursuit member count
              const { error: countError } = await supabase
                .from('pursuits')
                .update({
                  current_members_count: supabase.raw('current_members_count + 1'),
                })
                .eq('id', application.pursuit_id);

              if (countError) throw countError;

              Alert.alert('Success', 'Application accepted!', [
                { text: 'OK', onPress: onBack },
              ]);
            } catch (error) {
              console.error('Error accepting application:', error);
              Alert.alert('Error', 'Failed to accept application');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Application',
      'Are you sure you want to decline this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await applicationService.rejectApplication(applicationId);
              Alert.alert('Application Declined', 'The applicant has been notified.', [
                { text: 'OK', onPress: onBack },
              ]);
            } catch (error) {
              console.error('Error declining application:', error);
              Alert.alert('Error', 'Failed to decline application');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const openResume = () => {
    const resumeUrl = application?.answers?.resume_url;
    if (resumeUrl) {
      Linking.openURL(resumeUrl).catch((err) =>
        Alert.alert('Error', 'Unable to open resume')
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!application || !pursuit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Application not found</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions = pursuit.application_questions || [];
  const answers = application.answers || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Application</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Applicant Card */}
        <View style={styles.applicantCard}>
          <TouchableOpacity
            style={styles.applicantInfo}
            onPress={() => navigation?.navigate('UserProfile', { userId: applicant.id })}
          >
            {applicant?.profile_picture ? (
              <Image
                source={{ uri: applicant.profile_picture }}
                style={styles.applicantAvatar}
              />
            ) : (
              <View style={styles.applicantAvatarPlaceholder}>
                <Text style={styles.applicantAvatarText}>
                  {applicant?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.applicantDetails}>
              <Text style={styles.applicantName}>
                {applicant?.name || applicant?.email?.split('@')[0] || 'Unknown'}
              </Text>
              <Text style={styles.applicantEmail}>{applicant?.email}</Text>
              <Text style={styles.applicationDate}>
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Resume Section */}
        {pursuit.requires_resume && answers.resume_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resume</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={openResume}>
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
              <View style={styles.resumeInfo}>
                <Text style={styles.resumeTitle}>View Resume</Text>
                <Text style={styles.resumeSubtitle}>Tap to open</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Qualifications */}
        {answers.qualifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qualifications</Text>
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{answers.qualifications}</Text>
            </View>
          </View>
        )}

        {/* Application Questions & Answers */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Responses</Text>
            {questions.map((question: string, index: number) => {
              const answerKey = `question_${index}`;
              const answer = answers[answerKey];

              return (
                <View key={index} style={styles.qaCard}>
                  <Text style={styles.questionText}>
                    {index + 1}. {question}
                  </Text>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{answer || 'No answer provided'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {application.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  applicantCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  applicantAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  applicantDetails: {
    flex: 1,
    marginLeft: 16,
  },
  applicantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  applicantEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  resumeSubtitle: {
    fontSize: 13,
    color: '#8b5cf6',
  },
  qaCard: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 22,
  },
  answerBox: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  answerText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
