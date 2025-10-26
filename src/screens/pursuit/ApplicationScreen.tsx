import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { pursuitService } from '../../services/pursuitService';
import { Pursuit } from '../../types';

export default function ApplicationScreen({ route, navigation }: any) {
  const { pursuitId } = route.params;
  const { user } = useAuth();
  const [pursuit, setPursuit] = useState<Pursuit | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPursuit();
  }, []);

  const loadPursuit = async () => {
    try {
      const data = await pursuitService.getPursuit(pursuitId);
      setPursuit(data);

      // Initialize answers
      const initialAnswers: { [key: string]: string } = {};
      if (data.application_questions && data.application_questions.length > 0) {
        data.application_questions.forEach((q, i) => {
          initialAnswers[`q${i}`] = '';
        });
      } else {
        initialAnswers.q0 = '';
        initialAnswers.q1 = '';
      }
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error loading pursuit:', error);
      Alert.alert('Error', 'Failed to load pursuit details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all fields are filled
    const hasEmptyFields = Object.values(answers).some(answer => !answer.trim());
    if (hasEmptyFields) {
      Alert.alert('Error', 'Please answer all questions');
      return;
    }

    setLoading(true);
    try {
      const formattedAnswers = pursuit?.application_questions
        ? pursuit.application_questions.map((q, i) => ({
            question: q,
            answer: answers[`q${i}`],
          }))
        : [
            { question: 'Why are you a good team fit?', answer: answers.q0 },
            { question: 'Where do you hope to see this go?', answer: answers.q1 },
          ];

      await pursuitService.applyToPursuit({
        pursuit_id: pursuitId,
        applicant_id: user!.id,
        answers: formattedAnswers,
        status: 'pending',
      });

      Alert.alert(
        'Application Submitted!',
        'The pursuit creator will review your application and get back to you.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !pursuit) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const questions = pursuit.application_questions && pursuit.application_questions.length > 0
    ? pursuit.application_questions
    : ['Why are you a good team fit?', 'Where do you hope to see this go?'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Apply to {pursuit.title}</Text>
        <Text style={styles.subtitle}>
          Tell the creator why you'd be a great addition to this pursuit
        </Text>

        <View style={styles.pursuitInfo}>
          <Text style={styles.pursuitTitle}>{pursuit.title}</Text>
          <Text style={styles.pursuitDescription} numberOfLines={3}>
            {pursuit.description}
          </Text>
        </View>

        <View style={styles.form}>
          {questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {index + 1}. {question}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                value={answers[`q${index}`]}
                onChangeText={(text) =>
                  setAnswers({ ...answers, [`q${index}`]: text })
                }
                multiline
                numberOfLines={4}
              />
            </View>
          ))}

          {pursuit.requires_resume && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Note: This pursuit requires a resume. Please ensure your profile
                has an updated resume attached.
              </Text>
            </View>
          )}

          {pursuit.requires_interview && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Note: This pursuit requires an interview. If your application is
                shortlisted, the creator will schedule an interview with you.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  pursuitInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  pursuitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pursuitDescription: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  infoText: {
    fontSize: 13,
    color: '#0369a1',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
