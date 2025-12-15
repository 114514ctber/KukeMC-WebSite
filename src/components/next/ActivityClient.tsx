'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Plus, Flame, Clock, Search, Loader2, Hash, X, ChevronDown } from 'lucide-react';
import { Post } from '@/types/activity';
import { getPosts, getHotTopics, getCategories } from '@/services/activity';
import PostCard from '@/components/next/PostCard';
import CreatePostModal from '@/components/next/CreatePostModal';
import TrendingTags from '@/components/next/TrendingTags';
import Link from 'next/link';
import clsx from 'clsx';

const ActivityClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagParam = searchParams.get('tag');
  
  const [activeTab, setActiveTab] = useState<'square' | 'following'>('square');
  const [squareSort, setSquareSort] = useState<'latest' | 'hot'>('latest');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hotTopics, setHotTopics] = useState<{name: string, count: number}[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string; }[]>([
    { id: 'all', label: '全部' },
    { id: 'daily', label: '日常分享' },
    { id: 'tech', label: '技术探讨' },
    { id: 'tutorial', label: '教程指导' },
  ]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async (reset = false) => {
    setLoading(true);
    if (reset) {
      setPosts([]); 
      setPage(1);
    }

    try {
      const type = activeTab === 'following' ? 'following' : squareSort;
      const res = await getPosts({ 
        page: reset ? 1 : page, 
        per_page: 10, 
        type,
        tag: tagParam || undefined,
        category: activeCategory !== 'all' ? activeCategory : undefined
      });

      if (reset) {
        setPosts(res.data);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = res.data.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
      
      setHasMore(res.data.length >= 10);
      if (reset) {
        setPage(2);
      } else {
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSideBarData = async () => {
    try {
      const [topics, hotPostsData, categoriesData] = await Promise.all([
        getHotTopics('', 10), // Limit to 10
        getPosts({ type: 'hot', per_page: 5 }),
        getCategories()
      ]);
      setHotTopics(topics);
      setHotPosts(hotPostsData.data);
      if (categoriesData && categoriesData.length > 0) {
         setCategories([{ id: 'all', label: '全部' }, ...categoriesData.map((c: any) => ({ id: c.slug, label: c.label }))]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSideBarData();
  }, []);

  useEffect(() => {
    fetchPosts(true);
  }, [activeTab, squareSort, tagParam, activeCategory]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts();
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchPosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loading, hasMore, activeTab, squareSort, tagParam, page]);

  const handlePostCreated = (newPost: Post) => {
    if (tagParam && !newPost.tags?.includes(tagParam)) return;
    
    if (activeTab === 'square' && squareSort === 'latest') {
      setPosts(prev => [newPost, ...prev]);
    }
    fetchSideBarData();
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDelete = (postId: number) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">动态广场</h1>
            <p className="text-slate-500 dark:text-slate-400">探索社区最新动态，分享你的游戏点滴</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 font-medium"
          >
            <Plus size={20} />
            发布动态
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
              <button
                onClick={() => setActiveTab('square')}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'square'
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                广场
              </button>
              <button
                onClick={() => {
                  setActiveTab('following');
                  setActiveCategory('all');
                }}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'following'
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                关注的人
              </button>
            </div>

            {/* Sub Tabs for Square */}
            {activeTab === 'square' && (
              <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={clsx(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        activeCategory === category.id
                          ? "bg-white dark:bg-gray-800 text-primary-600 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
                          : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                <button
                  onClick={() => setSquareSort('latest')}
                  className={clsx(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    squareSort === 'latest' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Clock size={16} /> 最新
                </button>
                <button
                  onClick={() => setSquareSort('hot')}
                  className={clsx(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    squareSort === 'hot' ? "text-red-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  <Flame size={16} /> 热门
                </button>
                </div>
              </div>
            )}

            {/* Tag Filter Indicator */}
            {tagParam && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium">
                  <Hash size={16} />
                  <span>{tagParam}</span>
                  <button 
                    onClick={() => router.push('/activity')}
                    className="ml-1 p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  的相关动态
                </span>
              </div>
            )}

            {/* Post List */}
            <div className="space-y-6">
              {loading && posts.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                </div>
              ) : posts.length > 0 ? (
                <>
                  <AnimatePresence mode="popLayout">
                    {posts.map((post) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onUpdate={handlePostUpdate}
                        onDelete={handlePostDelete}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {hasMore && (
                    <div 
                      ref={loadMoreRef}
                      className="flex justify-center pt-8 pb-4"
                    >
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className={clsx(
                          "group relative px-6 py-2 rounded-full transition-all duration-300 flex items-center gap-2",
                          loading 
                            ? "bg-transparent text-emerald-500 cursor-wait" 
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5"
                        )}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="animate-pulse font-medium">加载更多动态...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                            <span>加载更多</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">这里空空如也</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {activeTab === 'following' 
                      ? '你关注的人还没有发布任何动态' 
                      : '还没有人发布动态，快来抢沙发吧！'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Trending Tags Widget */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Hash size={18} className="text-emerald-500" /> 热门话题
                </h3>
                <TrendingTags tags={hotTopics} />
              </div>

              {/* Hot Posts Widget */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Flame size={18} className="text-red-500" /> 热门动态
                </h3>
                <div className="space-y-4">
                  {hotPosts.length > 0 ? (
                    hotPosts.map((post, idx) => (
                      <Link 
                        key={post.id}
                        href={`/activity/${post.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <div className="text-lg font-bold text-slate-300 dark:text-slate-600 w-4 text-center group-hover:text-emerald-500 transition-colors">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {post.title || post.content.substring(0, 30)}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                              <span>{post.author.nickname || post.author.username}</span>
                              <span>•</span>
                              <span>{post.likes_count} 赞</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                      暂无热门动态
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handlePostCreated}
      />
    </div>
  );
};

export default ActivityClient;
