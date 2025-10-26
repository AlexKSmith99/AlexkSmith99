import { supabase } from '../config/supabase';
import { Vote, KickProposal } from '../types';

export const voteService = {
  // Create a vote proposal
  createVote: async (
    pursuitId: string,
    userId: string,
    proposal: string
  ) => {
    const { data, error } = await supabase
      .from('votes')
      .insert([
        {
          pursuit_id: pursuitId,
          proposal,
          created_by: userId,
          votes_for: [],
          votes_against: [],
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cast a vote
  castVote: async (voteId: string, userId: string, voteFor: boolean) => {
    const { data: vote, error: fetchError } = await supabase
      .from('votes')
      .select('*')
      .eq('id', voteId)
      .single();

    if (fetchError) throw fetchError;

    const votesFor = vote.votes_for || [];
    const votesAgainst = vote.votes_against || [];

    // Remove from both arrays if exists
    const updatedVotesFor = votesFor.filter((id: string) => id !== userId);
    const updatedVotesAgainst = votesAgainst.filter((id: string) => id !== userId);

    // Add to appropriate array
    if (voteFor) {
      updatedVotesFor.push(userId);
    } else {
      updatedVotesAgainst.push(userId);
    }

    const { error } = await supabase
      .from('votes')
      .update({
        votes_for: updatedVotesFor,
        votes_against: updatedVotesAgainst,
      })
      .eq('id', voteId);

    if (error) throw error;
  },

  // Get active votes for a pursuit
  getActiveVotes: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Vote[];
  },

  // Close a vote
  closeVote: async (voteId: string, passed: boolean) => {
    const { error } = await supabase
      .from('votes')
      .update({
        status: passed ? 'passed' : 'failed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', voteId);

    if (error) throw error;
  },

  // Create kick member proposal
  createKickProposal: async (
    pursuitId: string,
    targetUserId: string,
    reason: string,
    createdBy: string
  ) => {
    const { data, error } = await supabase
      .from('kick_proposals')
      .insert([
        {
          pursuit_id: pursuitId,
          target_user_id: targetUserId,
          reason,
          created_by: createdBy,
          votes: [],
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Vote on kick proposal
  voteOnKickProposal: async (
    proposalId: string,
    userId: string,
    voteFor: boolean
  ) => {
    const { data: proposal, error: fetchError } = await supabase
      .from('kick_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    const votes = proposal.votes || [];
    const updatedVotes = votes.filter((v: any) => v.user_id !== userId);
    updatedVotes.push({ user_id: userId, vote: voteFor });

    const { error } = await supabase
      .from('kick_proposals')
      .update({ votes: updatedVotes })
      .eq('id', proposalId);

    if (error) throw error;
  },

  // Get kick proposals for a pursuit
  getKickProposals: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('kick_proposals')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as KickProposal[];
  },

  // Resolve kick proposal
  resolveKickProposal: async (proposalId: string, approved: boolean) => {
    const { error } = await supabase
      .from('kick_proposals')
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', proposalId);

    if (error) throw error;
  },
};
