import { getSupabaseClient } from '../lib/supabase';
import { CommunityMember, UserProfile } from '../types';

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatarUrl?: string;
  recipientName: string;
  recipientAvatarUrl?: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface ConversationSummary {
  member: CommunityMember;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const mapMessage = (row: any): DirectMessage => ({
  id: String(row.id),
  senderId: String(row.sender_id),
  recipientId: String(row.recipient_id),
  senderName: row.sender_name || 'طالب المنصة',
  senderAvatarUrl: row.sender_avatar_url || undefined,
  recipientName: row.recipient_name || 'طالب المنصة',
  recipientAvatarUrl: row.recipient_avatar_url || undefined,
  body: row.body || '',
  createdAt: row.created_at,
  readAt: row.read_at || undefined,
});

function requireClientAndUser(currentUser?: UserProfile | null) {
  const client = getSupabaseClient();
  if (!client) throw new Error('تعذر الاتصال بخدمة الرسائل');
  if (!currentUser?.id) throw new Error('يجب تسجيل الدخول لاستخدام Messenger');
  return { client, userId: currentUser.id };
}

export async function fetchDirectMessages(currentUser: UserProfile, otherUserId: string): Promise<DirectMessage[]> {
  const { client, userId } = requireClientAndUser(currentUser);
  const { data, error } = await client
    .from('direct_messages')
    .select('id,sender_id,recipient_id,sender_name,sender_avatar_url,recipient_name,recipient_avatar_url,body,created_at,read_at')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(300);

  if (error) throw new Error(error.message || 'تعذر تحميل المحادثة');
  return (data || []).map(mapMessage);
}

export async function fetchConversationSummaries(currentUser: UserProfile): Promise<ConversationSummary[]> {
  const { client, userId } = requireClientAndUser(currentUser);
  const { data, error } = await client
    .from('direct_messages')
    .select('id,sender_id,recipient_id,sender_name,sender_avatar_url,recipient_name,recipient_avatar_url,body,created_at,read_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message || 'تعذر تحميل المحادثات');

  const summaries = new Map<string, ConversationSummary>();
  for (const raw of data || []) {
    const message = mapMessage(raw);
    const isIncoming = message.recipientId === userId;
    const otherId = isIncoming ? message.senderId : message.recipientId;
    const member: CommunityMember = isIncoming
      ? { id: otherId, name: message.senderName, avatarUrl: message.senderAvatarUrl }
      : { id: otherId, name: message.recipientName, avatarUrl: message.recipientAvatarUrl };
    const existing = summaries.get(otherId);
    if (!existing) {
      summaries.set(otherId, {
        member,
        lastMessage: message.body,
        lastMessageAt: message.createdAt,
        unreadCount: isIncoming && !message.readAt ? 1 : 0,
      });
    } else if (isIncoming && !message.readAt) {
      existing.unreadCount += 1;
    }
  }
  return Array.from(summaries.values());
}

export async function sendDirectMessage(
  currentUser: UserProfile,
  recipient: CommunityMember,
  body: string,
): Promise<DirectMessage> {
  const { client, userId } = requireClientAndUser(currentUser);
  if (!recipient.id) throw new Error('لا يملك هذا الحساب معرّفًا صالحًا للمراسلة');
  if (recipient.id === userId) throw new Error('لا يمكنك مراسلة حسابك نفسه');
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error('اكتب رسالة أولًا');
  if (cleanBody.length > 2000) throw new Error('الرسالة طويلة جدًا');

  const { data, error } = await client
    .from('direct_messages')
    .insert({ sender_id: userId, recipient_id: recipient.id, body: cleanBody })
    .select('id,sender_id,recipient_id,sender_name,sender_avatar_url,recipient_name,recipient_avatar_url,body,created_at,read_at')
    .single();

  if (error) throw new Error(error.message || 'تعذر إرسال الرسالة');
  return mapMessage(data);
}

export async function markConversationRead(currentUser: UserProfile, otherUserId: string): Promise<void> {
  const { client, userId } = requireClientAndUser(currentUser);
  const { error } = await client
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('sender_id', otherUserId)
    .is('read_at', null);
  if (error) throw new Error(error.message || 'تعذر تحديث حالة الرسائل');
}

export async function fetchUnreadMessageCount(currentUser: UserProfile): Promise<number> {
  const { client, userId } = requireClientAndUser(currentUser);
  const { count, error } = await client
    .from('direct_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  if (error) return 0;
  return count || 0;
}
