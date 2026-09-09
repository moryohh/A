import React, { useState } from 'react';
import { X, Send, MessageSquare, MessageCircle } from 'lucide-react';
import { CommunityMember, CommunityPost } from '../types';

interface CommunityCommentsModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void | Promise<void>;
  currentUserId?: string;
  onOpenProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
}

export const CommunityCommentsModal: React.FC<CommunityCommentsModalProps> = ({
  post,
  isOpen,
  onClose,
  onAddComment,
  currentUserId,
  onOpenProfile,
  onMessage,
}) => {
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(post.id, text);
      setNewText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-[#1A1A24] border-t border-white/10 w-full max-w-lg rounded-t-3xl p-4 sm:p-5 shadow-2xl text-right max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00A3FF]" />
            <h3 className="text-base font-bold text-white">
              التعليقات والمناقشات ({post.comments.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1E1E2C] text-gray-300 hover:text-white border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post snippet */}
        <div className="bg-[#0D0D12]/60 p-3 rounded-2xl border border-white/5 my-3 text-xs text-gray-300">
          <button type="button" onClick={() => onOpenProfile({ id: post.userId, name: post.userName, avatarUrl: post.userAvatar })} className="mb-1 block font-bold text-gray-400 transition hover:text-sky-400">
            صاحب المنشور: {post.userName}
          </button>
          <p className="line-clamp-2 text-white">{post.content}</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 pl-1">
          {post.comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد تعليقات بعد، كن أول من يشارك برأيه أو إجابته!
            </div>
          ) : (
            post.comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-[#0D0D12]/80 p-3.5 rounded-2xl border border-white/5 flex gap-3 text-right relative"
              >
                <button type="button" onClick={() => onOpenProfile({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar })} className="shrink-0 transition active:scale-95" aria-label={`فتح ملف ${comment.userName}`}>
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                  />
                </button>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => onOpenProfile({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar })} className="text-xs font-bold text-white transition hover:text-sky-400">
                        {comment.userName}
                      </button>
                      <div className="flex items-center gap-2">
                        {comment.userId && comment.userId !== currentUserId && (
                          <button type="button" onClick={() => onMessage({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar })} className="text-sky-400 transition active:scale-95" aria-label={`مراسلة ${comment.userName}`}>
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        <span className="text-[10px] text-gray-500">{comment.timeAgo}</span>
                      </div>
                    </div>

                  <p className="text-xs text-gray-300 leading-relaxed mt-1">
                    {comment.text}
                  </p>


                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input Form */}
        <form onSubmit={handleSubmit} className="pt-3 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="اكتب تعليقك أو إجابتك للزملاء..."
            className="flex-1 bg-[#0D0D12] text-white border border-white/10 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#00A3FF] placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!newText.trim() || isSubmitting}
            className="bg-[#00A3FF] disabled:opacity-50 hover:bg-[#0092E6] text-white font-bold px-4 rounded-xl flex items-center justify-center transition-all active:scale-95"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
