import { supabase } from '../config/supabase';
import { BoardTask, MeetingNote, TeamGallery } from '../types';

export const teamBoardService = {
  // Task Management
  createTask: async (taskData: Partial<BoardTask>) => {
    const { data, error } = await supabase
      .from('board_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getTasks: async (boardId: string) => {
    const { data, error } = await supabase
      .from('board_tasks')
      .select(`
        *,
        assigned_user:profiles!assigned_to(*)
      `)
      .eq('board_id', boardId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data as BoardTask[];
  },

  updateTask: async (taskId: string, updates: Partial<BoardTask>) => {
    const { data, error } = await supabase
      .from('board_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteTask: async (taskId: string) => {
    const { error } = await supabase
      .from('board_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  reorderTasks: async (tasks: { id: string; order_index: number }[]) => {
    const updates = tasks.map(task =>
      supabase
        .from('board_tasks')
        .update({ order_index: task.order_index })
        .eq('id', task.id)
    );

    await Promise.all(updates);
  },

  // Meeting Notes
  createMeetingNote: async (noteData: Partial<MeetingNote>) => {
    const { data, error } = await supabase
      .from('meeting_notes')
      .insert([noteData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getMeetingNotes: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .order('meeting_date', { ascending: false });

    if (error) throw error;
    return data as MeetingNote[];
  },

  updateMeetingNote: async (noteId: string, updates: Partial<MeetingNote>) => {
    const { data, error } = await supabase
      .from('meeting_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteMeetingNote: async (noteId: string) => {
    const { error } = await supabase
      .from('meeting_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // Photo Gallery
  uploadPhoto: async (pursuitId: string, photoUri: string, userId: string, caption?: string) => {
    // In a real app, you'd upload the file to Supabase Storage first
    // For now, we'll assume photoUri is already a URL
    const { data, error } = await supabase
      .from('team_gallery')
      .insert([
        {
          pursuit_id: pursuitId,
          photo_url: photoUri,
          caption,
          uploaded_by: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getPhotos: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('team_gallery')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TeamGallery[];
  },

  deletePhoto: async (photoId: string) => {
    const { error } = await supabase
      .from('team_gallery')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },

  // Team Board
  getOrCreateBoard: async (pursuitId: string) => {
    // Check if board exists
    const { data: existing } = await supabase
      .from('team_boards')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .single();

    if (existing) return existing;

    // Create new board
    const { data, error } = await supabase
      .from('team_boards')
      .insert([{ pursuit_id: pursuitId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
