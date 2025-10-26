import { supabase } from '../config/supabase';
import { Message, Conversation } from '../types';

export const messageService = {
  // Send direct message
  sendMessage: async (
    senderId: string,
    recipientId: string,
    content: string
  ) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          content,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Send group message (pursuit chat)
  sendGroupMessage: async (
    senderId: string,
    pursuitId: string,
    content: string
  ) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          pursuit_id: pursuitId,
          content,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get direct messages between two users
  getDirectMessages: async (userId1: string, userId2: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*)
      `)
      .or(`sender_id.eq.${userId1},sender_id.eq.${userId2}`)
      .or(`recipient_id.eq.${userId1},recipient_id.eq.${userId2}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  // Get group messages for a pursuit
  getGroupMessages: async (pursuitId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*)
      `)
      .eq('pursuit_id', pursuitId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  // Get all conversations for a user
  getConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .not('recipient_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation partner
    const conversationsMap = new Map<string, Message>();
    data?.forEach((msg: Message) => {
      const partnerId = msg.sender_id === userId ? msg.recipient_id! : msg.sender_id;
      if (!conversationsMap.has(partnerId) ||
          new Date(msg.created_at) > new Date(conversationsMap.get(partnerId)!.created_at)) {
        conversationsMap.set(partnerId, msg);
      }
    });

    return Array.from(conversationsMap.values());
  },

  // Mark messages as read
  markAsRead: async (messageIds: string[]) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  },

  // Subscribe to new messages
  subscribeToMessages: (
    userId: string,
    callback: (message: Message) => void
  ) => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
