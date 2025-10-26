import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { teamBoardService } from '../../services/teamBoardService';
import { useAuth } from '../../contexts/AuthContext';
import { MeetingNote } from '../../types';

export default function MeetingNotesScreen({ route }: any) {
  const { pursuitId } = route.params;
  const { user } = useAuth();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteAgenda, setNoteAgenda] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await teamBoardService.getMeetingNotes(pursuitId);
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      await teamBoardService.createMeetingNote({
        pursuit_id: pursuitId,
        title: noteTitle,
        content: noteContent,
        agenda: noteAgenda || undefined,
        attendees: [],
        meeting_date: new Date().toISOString(),
        created_by: user!.id,
      });

      setNoteTitle('');
      setNoteContent('');
      setNoteAgenda('');
      setShowAddModal(false);
      loadNotes();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderNote = ({ item }: { item: MeetingNote }) => (
    <View style={styles.noteCard}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteDate}>
        {new Date(item.meeting_date).toLocaleDateString()}
      </Text>
      {item.agenda && (
        <View style={styles.agendaSection}>
          <Text style={styles.agendaLabel}>Agenda:</Text>
          <Text style={styles.agendaText}>{item.agenda}</Text>
        </View>
      )}
      <Text style={styles.noteContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Meeting Note</Text>
      </TouchableOpacity>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No meeting notes yet</Text>
          </View>
        }
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Meeting Note</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Meeting title"
              value={noteTitle}
              onChangeText={setNoteTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Agenda (optional)"
              value={noteAgenda}
              onChangeText={setNoteAgenda}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Meeting notes and discussion points"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleAddNote}>
              <Text style={styles.createButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  list: {
    padding: 15,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  agendaSection: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  agendaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  agendaText: {
    fontSize: 14,
    color: '#0c4a6e',
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  createButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
