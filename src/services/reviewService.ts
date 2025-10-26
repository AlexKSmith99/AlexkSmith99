import { supabase } from '../config/supabase';
import { Review } from '../types';

export const reviewService = {
  // Create a review
  createReview: async (reviewData: Partial<Review>) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get reviews for a user
  getUserReviews: async (userId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(*),
        pursuit:pursuits(*)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  },

  // Get average ratings for a user
  getAverageRatings: async (userId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    const reviews = data as Review[];
    const metrics = [
      'work_ethic',
      'flexibility',
      'quality_of_work',
      'punctuality',
      'leadership',
      'reliability',
      'easy_to_work_with',
      'articulation',
      'charisma',
      'niceness',
      'creativity',
      'technical_skills',
    ];

    const averages: any = {};
    metrics.forEach((metric) => {
      const sum = reviews.reduce((acc, review) => acc + (review as any)[metric], 0);
      averages[metric] = sum / reviews.length;
    });

    averages.overall = Object.values(averages).reduce((a: any, b: any) => a + b, 0) / metrics.length;
    averages.total_reviews = reviews.length;

    return averages;
  },

  // Check if user can review another user
  canReview: async (reviewerId: string, revieweeId: string, pursuitId: string) => {
    // Check if both users were in the same pursuit
    const { data: reviewerMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .eq('user_id', reviewerId)
      .single();

    const { data: revieweeMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('pursuit_id', pursuitId)
      .eq('user_id', revieweeId)
      .single();

    if (!reviewerMember || !revieweeMember) {
      return false;
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .eq('reviewee_id', revieweeId)
      .eq('pursuit_id', pursuitId)
      .single();

    return !existingReview;
  },
};
