import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, MessageSquare, Heart, Image, AtSign, Star, UserPlus } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, Notification } from '../services/notification';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleRead = async (id: number) => {
    if (!notifications.find(n => n.id === id)?.is_read) {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'profile_like': return <Heart className="text-red-500" size={12} />;
      case 'photo_like': return <Heart className="text-pink-500" size={12} />;
      case 'profile_message': return <MessageSquare className="text-blue-500" size={12} />;
      case 'message_reply': return <MessageSquare className="text-emerald-500" size={12} />;
      case 'photo_comment': return <Image className="text-purple-500" size={12} />;
      case 'message_like': return <Heart className="text-red-400" size={12} />;
      case 'ticket_reply': return <MessageSquare className="text-brand-500" size={12} />;
      case 'mention': return <AtSign className="text-emerald-500" size={12} />;
      case 'post_like': return <Heart className="text-red-500" size={12} />;
      case 'post_comment': return <MessageSquare className="text-blue-500" size={12} />;
      case 'post_collect': return <Star className="text-yellow-500" size={12} />;
      case 'follow': return <UserPlus className="text-indigo-500" size={12} />;
      default: return <Bell size={12} />;
    }
  };

  const getLink = (n: Notification) => {
    switch (n.type) {
        case 'profile_like': return `/player/${n.sender_id}`;
        
        // Need to ensure these query params are handled in Profile.tsx
        case 'photo_like': return `/player/${n.user_id}?tab=album&photo=${n.target_id}`; 
        case 'photo_comment': return `/player/${n.user_id}?tab=album&photo=${n.target_id}`;
        
        case 'profile_message': return `/player/${n.user_id}?msg=${n.target_id}`;
        case 'message_reply': return `/player/${n.user_id}?msg=${n.target_id}`;
        case 'message_like': return `/player/${n.user_id}?msg=${n.target_id}`;
        
        case 'ticket_reply': return `/tickets?id=${n.target_id}`;

        case 'mention': 
        case 'post_like':
        case 'post_comment':
        case 'post_collect':
            return `/activity/${n.target_id}`;
            
        case 'follow':
            return `/player/${n.sender_id}`;
            
        default: return '#';
    }
  };

  if (!user) return null;

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} className={clsx("text-slate-600 dark:text-slate-300", unreadCount > 0 && "animate-pulse-slow")} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">通知</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                  >
                    <Check size={12} /> 全部已读
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    暂无通知
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      className={clsx(
                        "relative group p-3 rounded-xl transition-all duration-200 border border-transparent cursor-pointer",
                        !n.is_read ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                      onClick={() => handleRead(n.id)}
                    >
                      <Link to={getLink(n)} className="flex gap-3 items-start">
                        <div className="mt-1 flex-shrink-0 relative">
                           {n.sender_id === 'system' ? (
                             <div className="w-8 h-8 rounded-lg shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                               <Bell size={16} className="text-slate-500" />
                             </div>
                           ) : (
                             <img 
                               src={`https://cravatar.eu/helmavatar/${n.sender_id}/32.png`} 
                               className="w-8 h-8 rounded-lg shadow-sm"
                               alt={n.sender_id}
                             />
                           )}
                           <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                             {getIcon(n.type)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">
                            <span className="font-bold">{n.sender_id}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {n.content_preview}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                      {!n.is_read && (
                        <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
