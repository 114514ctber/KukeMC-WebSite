import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Author } from '@/types/activity';
import { User, Shield, MapPin, Calendar } from 'lucide-react';
import api from '@/utils/api';
import { getFollowStats } from '@/services/follow';

interface AuthorInfoCardProps {
  author: Author;
  className?: string;
}

const AuthorInfoCard: React.FC<AuthorInfoCardProps> = ({ author, className }) => {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    likes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profileRes, followData] = await Promise.all([
            api.get(`/api/profile/${author.username}`),
            getFollowStats(author.username)
        ]);

        setStats({
            posts: profileRes.data.posts_count || 0,
            likes: profileRes.data.total_likes || 0,
            followers: followData.followers_count || 0
        });
      } catch (error) {
        console.error('Failed to fetch author stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (author.username) {
        fetchStats();
    }
  }, [author.username]);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      <div className="flex flex-col items-center text-center">
        <Link href={`/player/${author.username}`} className="group relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 mb-4 ring-4 ring-slate-50 dark:ring-slate-800 group-hover:ring-emerald-500/20 transition-all">
              <img 
                src={
                    author.avatar 
                    ? (author.avatar.startsWith('http') ? author.avatar : `${api.defaults.baseURL || 'https://api.kuke.ink'}${author.avatar}`)
                    : `https://cravatar.eu/helmavatar/${author.username}/128.png`
                }
                alt={author.username} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://cravatar.eu/helmavatar/MHF_Steve/128.png';
                }}
              />
          </div>
        </Link>
        
        <Link href={`/player/${author.username}`} className="hover:underline">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {author.nickname || author.username}
          </h3>
        </Link>
        
        {author.custom_title && (
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-full font-medium mb-3">
            {author.custom_title}
          </span>
        )}

        <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-slate-100 dark:border-slate-700 mt-2">
            <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">动态</div>
                <div className="font-bold text-slate-700 dark:text-slate-300">
                    {loading ? '--' : stats.posts}
                </div>
            </div>
            <div className="text-center border-l border-slate-100 dark:border-slate-700">
                <div className="text-xs text-slate-500 mb-1">粉丝</div>
                <div className="font-bold text-slate-700 dark:text-slate-300">
                    {loading ? '--' : stats.followers}
                </div>
            </div>
            <div className="text-center border-l border-slate-100 dark:border-slate-700">
                <div className="text-xs text-slate-500 mb-1">获赞</div>
                <div className="font-bold text-slate-700 dark:text-slate-300">
                    {loading ? '--' : stats.likes}
                </div>
            </div>
        </div>

        <Link 
          href={`/player/${author.username}`}
          className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors inline-block"
        >
          查看主页
        </Link>
      </div>
    </div>
  );
};

export default AuthorInfoCard;
