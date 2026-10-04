import React, { useState } from 'react';
import { Conversation, Message } from '../../types';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Send, MessageSquare, Home } from 'lucide-react';

interface MessagesViewProps {
  initialPropertyId?: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ initialPropertyId }) => {
  const { currentUser } = useAuth();
  const conversations = store.getConversationsForUser(currentUser.id);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(() => {
    if (initialPropertyId) {
      const match = conversations.find(c => c.propertyId === initialPropertyId);
      if (match) return match.id;
    }
    return conversations[0]?.id || null;
  });
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find(c => c.id === selectedConvId);
  const messages: Message[] = selectedConvId ? store.getMessagesForConversation(selectedConvId) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputText.trim()) return;

    store.sendMessage(selectedConvId, inputText.trim());
    setInputText('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
          Messages & Host Inquiries
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Direct communication regarding reservations, access codes, and amenities.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900">No message threads</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            When you contact hosts or make a reservation, your conversations appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[560px] overflow-hidden">
          {/* Conversation List (4 cols) */}
          <div className="md:col-span-4 border-r border-stone-200 overflow-y-auto divide-y divide-stone-100">
            <div className="p-4 font-semibold text-xs text-stone-900 uppercase tracking-wider bg-stone-50">
              Conversations ({conversations.length})
            </div>

            {conversations.map(conv => {
              const isSelected = conv.id === selectedConvId;
              const otherParty = currentUser.id === conv.renterId ? conv.ownerName : conv.renterName;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-stone-100/70' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                    <ImageWithFallback
                      src={conv.propertyImage}
                      alt={conv.propertyTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-xs text-stone-900 truncate">
                        {otherParty}
                      </span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mb-1">
                      {conv.propertyTitle}
                    </div>
                    <p className="text-[11px] text-stone-400 truncate">
                      {conv.lastMessage || 'Reservation discussion'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chat Thread (8 cols) */}
          <div className="md:col-span-8 flex flex-col justify-between h-[560px]">
            {activeConv ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                      <ImageWithFallback
                        src={activeConv.propertyImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-stone-900">
                        {currentUser.id === activeConv.renterId ? activeConv.ownerName : activeConv.renterName}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate max-w-sm">
                        {activeConv.propertyTitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message bubbles */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
                  {messages.map(m => {
                    const isMe = m.senderId === currentUser.id;
                    const isSystem = m.senderId === 'system';

                    if (isSystem) {
                      return (
                        <div key={m.id} className="text-center my-3">
                          <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-medium border border-stone-200">
                            {m.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-stone-400 mb-1 px-1">{m.senderName}</span>
                        <div
                          className={`max-w-md p-3 rounded-2xl ${
                            isMe
                              ? 'bg-stone-900 text-white rounded-br-xs'
                              : 'bg-stone-100 text-stone-900 rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                        <span className="text-[9px] text-stone-400 mt-1 px-1 tabular-nums">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Input box */}
                <form onSubmit={handleSend} className="p-3 border-t border-stone-200 bg-stone-50 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
                Select a conversation from the left to start messaging.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
