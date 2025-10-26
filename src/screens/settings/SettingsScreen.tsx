import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen({ navigation }: any) {
  const { profile, updateProfile } = useAuth();
  const [showSocialLinks, setShowSocialLinks] = React.useState(
    profile?.privacy_settings?.show_social_links ?? true
  );
  const [showPursuitHistory, setShowPursuitHistory] = React.useState(
    profile?.privacy_settings?.show_pursuit_history ?? true
  );
  const [showReviews, setShowReviews] = React.useState(
    profile?.privacy_settings?.show_reviews ?? true
  );

  const handlePrivacyUpdate = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        privacy_settings: {
          ...profile?.privacy_settings,
          [key]: value,
        },
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Social Links</Text>
            <Text style={styles.settingDescription}>
              Allow others to see your linked social accounts
            </Text>
          </View>
          <Switch
            value={showSocialLinks}
            onValueChange={(value) => {
              setShowSocialLinks(value);
              handlePrivacyUpdate('show_social_links', value);
            }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Pursuit History</Text>
            <Text style={styles.settingDescription}>
              Display your current and past pursuits on your profile
            </Text>
          </View>
          <Switch
            value={showPursuitHistory}
            onValueChange={(value) => {
              setShowPursuitHistory(value);
              handlePrivacyUpdate('show_pursuit_history', value);
            }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Reviews</Text>
            <Text style={styles.settingDescription}>
              Allow others to see reviews from past team members
            </Text>
          </View>
          <Switch
            value={showReviews}
            onValueChange={(value) => {
              setShowReviews(value);
              handlePrivacyUpdate('show_reviews', value);
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Whale Pod v1.0.0</Text>
        <Text style={styles.aboutDescription}>
          Connect with like-minded individuals and pursue your goals together
        </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  aboutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
  },
});
