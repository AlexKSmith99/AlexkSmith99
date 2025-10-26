import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';

export default function ReviewScreen({ route, navigation }: any) {
  const { userId, pursuitId } = route.params;
  const { user } = useAuth();

  const [ratings, setRatings] = useState({
    work_ethic: 0,
    flexibility: 0,
    quality_of_work: 0,
    punctuality: 0,
    leadership: 0,
    reliability: 0,
    easy_to_work_with: 0,
    articulation: 0,
    charisma: 0,
    niceness: 0,
    creativity: 0,
    technical_skills: 0,
  });

  const categories = [
    { key: 'work_ethic', label: 'Work Ethic' },
    { key: 'flexibility', label: 'Flexibility' },
    { key: 'quality_of_work', label: 'Quality of Work' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'reliability', label: 'Reliability' },
    { key: 'easy_to_work_with', label: 'Easy to Work With' },
    { key: 'articulation', label: 'Articulation' },
    { key: 'charisma', label: 'Charisma' },
    { key: 'niceness', label: 'Niceness' },
    { key: 'creativity', label: 'Creativity' },
    { key: 'technical_skills', label: 'Technical Skills' },
  ];

  const handleRating = (category: string, value: number) => {
    setRatings({ ...ratings, [category]: value });
  };

  const handleSubmit = async () => {
    const allRated = Object.values(ratings).every((rating) => rating > 0);
    if (!allRated) {
      Alert.alert('Error', 'Please rate all categories');
      return;
    }

    try {
      await reviewService.createReview({
        reviewer_id: user!.id,
        reviewee_id: userId,
        pursuit_id: pursuitId,
        ...ratings,
      });

      Alert.alert('Success', 'Review submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderStars = (category: string) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(category, star)}
          >
            <Ionicons
              name={star <= (ratings as any)[category] ? 'star' : 'star-outline'}
              size={32}
              color={star <= (ratings as any)[category] ? '#f59e0b' : '#ddd'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Team Member</Text>
        <Text style={styles.subtitle}>
          Rate your experience working with this team member
        </Text>
      </View>

      <View style={styles.content}>
        {categories.map((category) => (
          <View key={category.key} style={styles.categoryCard}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            {renderStars(category.key)}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
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
    backgroundColor: '#fff',
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
  },
  content: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
