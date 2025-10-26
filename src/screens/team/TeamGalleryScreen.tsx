import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { teamBoardService } from '../../services/teamBoardService';
import { useAuth } from '../../contexts/AuthContext';
import { TeamGallery } from '../../types';

const { width } = Dimensions.get('window');
const imageSize = (width - 45) / 3;

export default function TeamGalleryScreen({ route }: any) {
  const { pursuitId } = route.params;
  const { user } = useAuth();
  const [photos, setPhotos] = useState<TeamGallery[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await teamBoardService.getPhotos(pursuitId);
      setPhotos(data);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && user) {
      try {
        await teamBoardService.uploadPhoto(
          pursuitId,
          result.assets[0].uri,
          user.id
        );
        loadPhotos();
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
  };

  const renderPhoto = ({ item }: { item: TeamGallery }) => (
    <Image source={{ uri: item.photo_url }} style={styles.photo} />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload Photo</Text>
      </TouchableOpacity>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No photos yet</Text>
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
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  grid: {
    padding: 15,
  },
  photo: {
    width: imageSize,
    height: imageSize,
    margin: 2.5,
    borderRadius: 8,
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
});
