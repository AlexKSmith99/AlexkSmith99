import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { teamBoardService } from '../../services/teamBoardService';
import { useAuth } from '../../contexts/AuthContext';
import { BoardTask } from '../../types';

export default function TeamBoardScreen({ route, navigation }: any) {
  const { pursuitId } = route.params;
  const { user } = useAuth();
  const [board, setBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    try {
      const boardData = await teamBoardService.getOrCreateBoard(pursuitId);
      setBoard(boardData);

      const tasksData = await teamBoardService.getTasks(boardData.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      await teamBoardService.createTask({
        board_id: board.id,
        title: newTaskTitle,
        description: newTaskDescription,
        status: selectedStatus,
        priority: 'medium',
        order_index: tasks.filter(t => t.status === selectedStatus).length,
      });

      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowAddModal(false);
      loadBoard();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: BoardTask['status']) => {
    try {
      await teamBoardService.updateTask(taskId, { status: newStatus });
      loadBoard();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamBoardService.deleteTask(taskId);
            loadBoard();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const renderTask = (task: BoardTask) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {task.description && (
        <Text style={styles.taskDescription}>{task.description}</Text>
      )}

      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, {
          backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981'
        }]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>

        {task.assigned_user && (
          <Text style={styles.assignedText}>
            Assigned to: {task.assigned_user.email?.split('@')[0]}
          </Text>
        )}
      </View>

      <View style={styles.statusButtons}>
        {task.status !== 'todo' && (
          <TouchableOpacity
            style={[styles.statusButton, styles.todoButton]}
            onPress={() => handleUpdateTaskStatus(task.id, 'todo')}
          >
            <Text style={styles.statusButtonText}>To Do</Text>
          </TouchableOpacity>
        )}
        {task.status !== 'in_progress' && (
          <TouchableOpacity
            style={[styles.statusButton, styles.inProgressButton]}
            onPress={() => handleUpdateTaskStatus(task.id, 'in_progress')}
          >
            <Text style={styles.statusButtonText}>In Progress</Text>
          </TouchableOpacity>
        )}
        {task.status !== 'done' && (
          <TouchableOpacity
            style={[styles.statusButton, styles.doneButton]}
            onPress={() => handleUpdateTaskStatus(task.id, 'done')}
          >
            <Text style={styles.statusButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Board</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={28} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal style={styles.boardContainer}>
        {/* To Do Column */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>To Do ({todoTasks.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {todoTasks.map(task => renderTask(task))}
          </ScrollView>
        </View>

        {/* In Progress Column */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.columnTitle}>In Progress ({inProgressTasks.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {inProgressTasks.map(task => renderTask(task))}
          </ScrollView>
        </View>

        {/* Done Column */}
        <View style={styles.column}>
          <View style={[styles.columnHeader, { backgroundColor: '#d1fae5' }]}>
            <Text style={styles.columnTitle}>Done ({doneTasks.length})</Text>
          </View>
          <ScrollView style={styles.columnContent}>
            {doneTasks.map(task => renderTask(task))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Task title"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusSelector}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'todo' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('todo')}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === 'todo' && styles.statusOptionTextSelected,
                ]}>
                  To Do
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'in_progress' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('in_progress')}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === 'in_progress' && styles.statusOptionTextSelected,
                ]}>
                  In Progress
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'done' && styles.statusOptionSelected,
                ]}
                onPress={() => setSelectedStatus('done')}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === 'done' && styles.statusOptionTextSelected,
                ]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleAddTask}>
              <Text style={styles.createButtonText}>Create Task</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  boardContainer: {
    flex: 1,
  },
  column: {
    width: 300,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  columnHeader: {
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  columnContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 8,
    minHeight: 400,
  },
  taskCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  assignedText: {
    fontSize: 11,
    color: '#999',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  todoButton: {
    backgroundColor: '#e0f2fe',
  },
  inProgressButton: {
    backgroundColor: '#fef3c7',
  },
  doneButton: {
    backgroundColor: '#d1fae5',
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
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
    minHeight: 400,
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
  statusSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  statusOptionText: {
    fontSize: 13,
    color: '#666',
  },
  statusOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
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
