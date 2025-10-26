import { supabase } from '../config/supabase';
import { Connection } from '../types';

export const connectionService = {
  // Send connection request
  sendConnectionRequest: async (userId1: string, userId2: string) => {
    const { data, error } = await supabase
      .from('connections')
      .insert([
        {
          user_id_1: userId1,
          user_id_2: userId2,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Accept connection request
  acceptConnection: async (connectionId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Decline/Delete connection
  deleteConnection: async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
  },

  // Get user connections
  getConnections: async (userId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;
    return data as Connection[];
  },

  // Get pending connection requests
  getPendingRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id_2', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return data as Connection[];
  },

  // Check if users are connected
  areConnected: async (userId1: string, userId2: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user_id_1.eq.${userId1},user_id_2.eq.${userId2}`)
      .or(`user_id_1.eq.${userId2},user_id_2.eq.${userId1}`)
      .eq('status', 'accepted')
      .single();

    return !!data && !error;
  },
};
