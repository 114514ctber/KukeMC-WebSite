import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { TrendingUp, Hash, ChevronRight, Zap } from 'lucide-react';

interface TrendingTagsProps {
  tags: { name: string; count: number }[];
  onTagClick?: (tag: string) => void;
}

const TrendingTags: React.FC<TrendingTagsProps> = ({ tags, onTagClick }) => {
  const router = useRouter();

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => b.count - a.count).slice(0, 8); // Top 8
  }, [tags]);

  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
        <Hash size={24} className="mb-2 opacity-50" />
        <span className="text-sm">暂无热门话题</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {sortedTags.map((tag, index) => {
        const isTop3 = index < 3;
        return (
          <button
            key={tag.name}
            onClick={() => onTagClick ? onTagClick(tag.name) : router.push(`/activity?tag=${tag.name}`)}
            className="group flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={clsx(
                "flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold transition-colors",
                index === 0 ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400" :
                index === 1 ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400" :
                index === 2 ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              )}>
                {index + 1}
              </div>
              
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate w-full group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  #{tag.name}
                </span>
                {isTop3 && (
                   <div className="flex items-center gap-1 text-[10px] text-rose-500 dark:text-rose-400 font-medium">
                      <TrendingUp size={10} />
                      <span>Trending</span>
                   </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2">
               <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                 {tag.count > 999 ? '999+' : tag.count}
               </span>
               <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TrendingTags;
