import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfileScreen({ navigation }: any) {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [bio, setBio] = useState(profile?.bio || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [hometown, setHometown] = useState(profile?.hometown || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [instagram, setInstagram] = useState(profile?.instagram || '');
  const [github, setGithub] = useState(profile?.github || '');
  const [portfolio, setPortfolio] = useState(profile?.portfolio_website || '');
  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || '');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        bio,
        age: age ? parseInt(age) : undefined,
        gender,
        hometown,
        linkedin,
        instagram,
        github,
        portfolio_website: portfolio,
        profile_picture: profilePicture,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHelper}>Tap to change profile picture</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell others about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            placeholder="Gender"
            value={gender}
            onChangeText={setGender}
          />

          <Text style={styles.label}>Hometown</Text>
          <TextInput
            style={styles.input}
            placeholder="Hometown"
            value={hometown}
            onChangeText={setHometown}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>

          <Text style={styles.label}>LinkedIn</Text>
          <TextInput
            style={styles.input}
            placeholder="LinkedIn profile URL"
            value={linkedin}
            onChangeText={setLinkedin}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            placeholder="Instagram username"
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
          />

          <Text style={styles.label}>GitHub</Text>
          <TextInput
            style={styles.input}
            placeholder="GitHub username"
            value={github}
            onChangeText={setGithub}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Portfolio Website</Text>
          <TextInput
            style={styles.input}
            placeholder="Portfolio website URL"
            value={portfolio}
            onChangeText={setPortfolio}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0ea5e9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageHelper: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
