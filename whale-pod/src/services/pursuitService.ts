import { supabase } from '../config/supabase';
import { Pursuit, PursuitApplication, TeamMember } from '../types';

export const pursuitService = {
  // Create a new pursuit
  createPursuit: async (pursuitData: Partial<Pursuit>) => {
    const { data, error } = await supabase
      .from('pursuits')
      .insert([pursuitData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all pursuits with filters
  getPursuits: async (filters?: {
    types?: string[];
    categories?: string[];
    search?: string;
    status?: string;
  }) => {
    let query = supabase
      .from('pursuits')
      .select(`
        *,
        creator:profiles!creator_id(*),
        members:team_members(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Pursuit[];
  },

  // Get single pursuit
  getPursuit: async (id: string) => {
    const { data, error } = await supabase
      .from('pursuits')
      .select(`
        *,
        creator:profiles!creator_id(*),
        members:team_members(
          *,
          user:profiles!user_id(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Pursuit;
  },

  // Update pursuit
  updatePursuit: async (id: string, updates: Partial<Pursuit>) => {
    const { data, error } = await supabase
      .from('pursuits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete/Delist pursuit
  delistPursuit: async (id: string) => {
    const { error } = await supabase
      .from('pursuits')
      .update({ status: 'delisted' })
      .eq('id', id);

    if (error) throw error;
  },

  // Apply to pursuit
  applyToPursuit: async (applicationData: Partial<PursuitApplication>) => {
    const { data, error } = await supabase
      .from('pursuit_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get applications for a pursuit
  getApplications: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('pursuit_applications')
      .select(`
        *,
        applicant:profiles!applicant_id(*)
      `)
      .eq('pursuit_id', pursuitId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Accept/Reject application
  updateApplicationStatus: async (
    applicationId: string,
    status: 'accepted' | 'declined'
  ) => {
    const { data, error } = await supabase
      .from('pursuit_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // If accepted, add to team members
    if (status === 'accepted') {
      const { data: application } = await supabase
        .from('pursuit_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (application) {
        await supabase.from('team_members').insert([
          {
            pursuit_id: application.pursuit_id,
            user_id: application.applicant_id,
            is_admin: false,
          },
        ]);

        // Update pursuit members count
        const { data: pursuit } = await supabase
          .from('pursuits')
          .select('current_members_count')
          .eq('id', application.pursuit_id)
          .single();

        if (pursuit) {
          await supabase
            .from('pursuits')
            .update({ current_members_count: pursuit.current_members_count + 1 })
            .eq('id', application.pursuit_id);
        }
      }
    }

    return data;
  },

  // Get team members
  getTeamMembers: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles!user_id(*)
      `)
      .eq('pursuit_id', pursuitId);

    if (error) throw error;
    return data;
  },

  // Remove team member
  removeTeamMember: async (pursuitId: string, userId: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('pursuit_id', pursuitId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update pursuit members count
    const { data: pursuit } = await supabase
      .from('pursuits')
      .select('current_members_count')
      .eq('id', pursuitId)
      .single();

    if (pursuit) {
      await supabase
        .from('pursuits')
        .update({ current_members_count: Math.max(0, pursuit.current_members_count - 1) })
        .eq('id', pursuitId);
    }
  },
};
