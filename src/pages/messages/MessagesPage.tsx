import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  Clock,
  CheckCheck,
  Search,
  ArrowLeft
} from 'lucide-react';

interface MessagesPageProps {
  initialPartnerId?: string | null;
  onClearInitialPartner?: () => void;
}

export function MessagesPage({
  initialPartnerId,
  onClearInitialPartner
}: MessagesPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activePartnerId) {
      loadMessagesForPartner(activePartnerId);
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
      if (!activePartnerId && res.conversations && res.conversations.length > 0) {
        setActivePartnerId(res.conversations[0].partner_id);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessagesForPartner = async (partnerId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.getMessages(partnerId);
      setActivePartner(res.partner);
      setMessages(res.messages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load conversation history', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnerId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const res = await api.sendMessage(activePartnerId, content);
      setMessages((prev) => [...prev, res.data]);
      loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
          <span>Private Messaging</span>
          <span>·</span>
          <span>RV University Network</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
          Mentorship Communications
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[580px]">
        {/* Left Col: Conversation List */}
        <div className={`border-r border-slate-200 flex flex-col ${activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#172338]">Direct Conversations</h2>
            <span className="text-xs text-[#718096] tabular-nums font-semibold">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length > 0 ? (
              conversations.map((c) => {
                const isSelected = c.partner_id === activePartnerId;
                return (
                  <div
                    key={c.partner_id}
                    onClick={() => {
                      setActivePartnerId(c.partner_id);
                      if (onClearInitialPartner) onClearInitialPartner();
                    }}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/50 border-l-4 border-[#D6AA61]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#172338]">
                          {c.partner_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#172338]">{c.partner_name}</p>
                          <span className="text-[10px] text-[#718096] capitalize">{c.partner_role}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {new Date(c.last_message_time).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 mt-2 pl-10">
                      {c.last_message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No conversations started yet.</p>
                <p className="mt-1">Connect with an alumni mentor from the directory to start chatting!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col (2 cols): Message View */}
        <div className={`md:col-span-2 flex flex-col bg-slate-50/40 ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
          {activePartnerId && activePartner ? (
            <>
              {/* Partner Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePartnerId(null)}
                    className="md:hidden p-1 text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#172338]">
                    {activePartner.full_name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172338]">{activePartner.full_name}</h3>
                    <p className="text-[11px] text-[#718096] capitalize">
                      RV University · {activePartner.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
                {isLoadingMessages ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading conversation...</div>
                ) : messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#172338] text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 tabular-nums px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400">
                    <p>Start a new mentorship discussion with {activePartner.full_name}.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${activePartner.full_name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/30 focus:border-[#D6AA61]"
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="p-2.5 bg-[#D6AA61] hover:bg-[#C19349] text-white rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-[#172338]">Select a conversation</h3>
              <p className="mt-1">Choose a student or mentor from the list to view your chat history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
