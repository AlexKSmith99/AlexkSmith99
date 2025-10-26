import { supabase } from '../config/supabase';
import { Notification } from '../types';

export const notificationService = {
  // Create notification
  createNotification: async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ) => {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type,
          title,
          message,
          is_read: false,
          data,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return notification;
  },

  // Get user notifications
  getNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Subscribe to notifications
  subscribeToNotifications: (
    userId: string,
    callback: (notification: Notification) => void
  ) => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
