import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { pursuitService } from '../../services/pursuitService';
import { PursuitType, DecisionSystem, MeetingAttendanceStyle } from '../../types';

export default function CreatePursuitScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamSizeMin, setTeamSizeMin] = useState('2');
  const [teamSizeMax, setTeamSizeMax] = useState('8');
  const [teamSizeFlexible, setTeamSizeFlexible] = useState(false);
  const [location, setLocation] = useState('');
  const [projectedDuration, setProjectedDuration] = useState('');
  const [pursuitTypes, setPursuitTypes] = useState<PursuitType[]>([]);
  const [pursuitCategories, setPursuitCategories] = useState('');
  const [ownershipStructure, setOwnershipStructure] = useState('');
  const [decisionSystem, setDecisionSystem] = useState<DecisionSystem>('standard_vote');
  const [decisionSystemNote, setDecisionSystemNote] = useState('');
  const [meetingCadence, setMeetingCadence] = useState('');
  const [meetingCadenceNote, setMeetingCadenceNote] = useState('');
  const [attendanceStyle, setAttendanceStyle] = useState<MeetingAttendanceStyle>('Mandatory');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [accountabilityMechanics, setAccountabilityMechanics] = useState('');
  const [roles, setRoles] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');
  const [continueAccepting, setContinueAccepting] = useState(false);
  const [requiresInterview, setRequiresInterview] = useState(false);
  const [requiresResume, setRequiresResume] = useState(false);
  const [applicationQuestions, setApplicationQuestions] = useState('');

  const pursuitTypeOptions: PursuitType[] = [
    'Education',
    'Friends',
    'Problem',
    'Business',
    'Lifestyle',
    'Hobby',
    'Side Hustle',
    'Travel',
    'Discussion',
    'New Endeavor',
    'Accountability',
  ];

  const togglePursuitType = (type: PursuitType) => {
    if (pursuitTypes.includes(type)) {
      setPursuitTypes(pursuitTypes.filter((t) => t !== type));
    } else if (pursuitTypes.length < 3) {
      setPursuitTypes([...pursuitTypes, type]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 3 pursuit types');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title || title.length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }

    if (!description || description.length < 50) {
      Alert.alert('Error', 'Description must be at least 50 characters');
      return;
    }

    if (pursuitTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one pursuit type');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    if (!meetingCadence) {
      Alert.alert('Error', 'Please specify meeting cadence');
      return;
    }

    setLoading(true);
    try {
      const pursuitData = {
        creator_id: user!.id,
        title,
        description,
        team_size_min: parseInt(teamSizeMin),
        team_size_max: parseInt(teamSizeMax),
        team_size_flexible: teamSizeFlexible,
        location,
        projected_duration: projectedDuration || null,
        pursuit_types: pursuitTypes,
        pursuit_categories: pursuitCategories.split(',').map((c) => c.trim()).filter(Boolean),
        ownership_structure: ownershipStructure || null,
        decision_system: decisionSystem,
        decision_system_note: decisionSystemNote || null,
        meeting_cadence: meetingCadence,
        meeting_cadence_note: meetingCadenceNote || null,
        attendance_style: attendanceStyle,
        attendance_note: attendanceNote || null,
        accountability_mechanics: accountabilityMechanics
          ? accountabilityMechanics.split(',').map((m) => m.trim()).filter(Boolean)
          : null,
        roles: roles ? roles.split(',').map((r) => r.trim()).filter(Boolean) : null,
        experience_level: experienceLevel || null,
        current_stage: currentStage || null,
        age_restriction: ageRestriction || null,
        continue_accepting_after_kickoff: continueAccepting,
        requires_interview: requiresInterview,
        requires_resume: requiresResume,
        application_questions: applicationQuestions
          ? applicationQuestions.split('\n').filter(Boolean)
          : null,
        status: 'awaiting_kickoff',
        current_members_count: 1,
      };

      await pursuitService.createPursuit(pursuitData);

      Alert.alert('Success', 'Pursuit created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Feed') },
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
        <Text style={styles.headerTitle}>Create a Pursuit</Text>
        <Text style={styles.headerSubtitle}>
          Build your team and start pursuing your goals together
        </Text>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Pursuit Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Learn Java Programming Together"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description * (min 50 characters)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your pursuit, who you're looking for, and where you want it to go. Be specific!"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.label}>Team Size Range *</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              placeholder="Min (2)"
              value={teamSizeMin}
              onChangeText={setTeamSizeMin}
              keyboardType="numeric"
            />
            <Text style={styles.rangeSeparator}>to</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              placeholder="Max (8)"
              value={teamSizeMax}
              onChangeText={setTeamSizeMax}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Team size flexible?</Text>
            <Switch value={teamSizeFlexible} onValueChange={setTeamSizeFlexible} />
          </View>

          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Remote, New York, Hybrid"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Projected Duration (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 3 months, 1 year, ongoing"
            value={projectedDuration}
            onChangeText={setProjectedDuration}
          />
        </View>

        {/* Pursuit Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pursuit Type * (Select up to 3)</Text>
          <View style={styles.chipContainer}>
            {pursuitTypeOptions.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  pursuitTypes.includes(type) && styles.chipSelected,
                ]}
                onPress={() => togglePursuitType(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    pursuitTypes.includes(type) && styles.chipTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories (up to 5)</Text>
          <Text style={styles.helper}>Comma-separated (e.g., tech, basketball, pokemon)</Text>
          <TextInput
            style={styles.input}
            placeholder="tech, basketball, pokemon, buddhism, humor"
            value={pursuitCategories}
            onChangeText={setPursuitCategories}
          />
        </View>

        {/* Business-specific */}
        {pursuitTypes.includes('Business') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            <Text style={styles.label}>Ownership Structure</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Distributed evenly, Admin owns 90%, etc."
              value={ownershipStructure}
              onChangeText={setOwnershipStructure}
            />
          </View>
        )}

        {/* Decision System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision System *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={decisionSystem}
              onValueChange={(value) => setDecisionSystem(value as DecisionSystem)}
            >
              <Picker.Item label="Standard Vote" value="standard_vote" />
              <Picker.Item label="Admin Has Ultimate Say" value="admin_ultimate_say" />
              <Picker.Item label="Delegated" value="delegated" />
              <Picker.Item label="Weighted Voting" value="weighted_voting" />
            </Picker>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Add a note about your decision (optional)"
            value={decisionSystemNote}
            onChangeText={setDecisionSystemNote}
          />
        </View>

        {/* Meeting Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Details</Text>

          <Text style={styles.label}>Meeting Cadence *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekly on Mondays, 3 times a week"
            value={meetingCadence}
            onChangeText={setMeetingCadence}
          />
          <TextInput
            style={styles.input}
            placeholder="Add a note (optional)"
            value={meetingCadenceNote}
            onChangeText={setMeetingCadenceNote}
          />

          <Text style={styles.label}>Attendance Style *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={attendanceStyle}
              onValueChange={(value) => setAttendanceStyle(value as MeetingAttendanceStyle)}
            >
              <Picker.Item label="Mandatory" value="Mandatory" />
              <Picker.Item label="Optional" value="Optional" />
              <Picker.Item label="Frequent" value="Frequent" />
            </Picker>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Set expectations for member attendance (optional)"
            value={attendanceNote}
            onChangeText={setAttendanceNote}
          />
        </View>

        {/* Accountability */}
        {pursuitTypes.includes('Accountability') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accountability Mechanics</Text>
            <Text style={styles.helper}>
              Comma-separated (e.g., streaks, check-ins, contributions)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="streaks, check-ins, contributions, tasks complete"
              value={accountabilityMechanics}
              onChangeText={setAccountabilityMechanics}
            />
          </View>
        )}

        {/* Roles & Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roles & Experience (Optional)</Text>

          <Text style={styles.label}>Roles</Text>
          <Text style={styles.helper}>Comma-separated roles you're looking for</Text>
          <TextInput
            style={styles.input}
            placeholder="Developer, Designer, Marketing Lead"
            value={roles}
            onChangeText={setRoles}
          />

          <Text style={styles.label}>Experience Level</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5+ years, Beginner, Intermediate"
            value={experienceLevel}
            onChangeText={setExperienceLevel}
          />

          <Text style={styles.label}>Current Stage in Process</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Just starting, Have a prototype"
            value={currentStage}
            onChangeText={setCurrentStage}
          />
        </View>

        {/* Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restrictions (Optional)</Text>
          <Text style={styles.label}>Age Restriction</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 18+, 21+ for in-person cocktails"
            value={ageRestriction}
            onChangeText={setAgeRestriction}
          />
        </View>

        {/* Application Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Settings</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Continue accepting after kickoff?</Text>
            <Switch value={continueAccepting} onValueChange={setContinueAccepting} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Require interview?</Text>
            <Switch value={requiresInterview} onValueChange={setRequiresInterview} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Require resume?</Text>
            <Switch value={requiresResume} onValueChange={setRequiresResume} />
          </View>

          <Text style={styles.label}>Application Questions (Optional)</Text>
          <Text style={styles.helper}>One question per line</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why are you a good team fit?&#10;Where do you hope to see this go?"
            value={applicationQuestions}
            onChangeText={setApplicationQuestions}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Pursuit'}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
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
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  smallInput: {
    flex: 1,
    marginBottom: 0,
  },
  rangeSeparator: {
    marginHorizontal: 10,
    color: '#666',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
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
