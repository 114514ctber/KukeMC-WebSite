import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { 
  X, Swords, Skull, Trophy, Coins, Zap, Target, 
  TrendingUp, Crown, BarChart2, User, Sparkles 
} from 'lucide-react';
import { KitBattleStats } from '@/types/kitbattle';
import { MinecraftText } from '@/components/MinecraftText';
import ModalPortal from '@/components/ModalPortal';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: KitBattleStats;
}

type Period = 'total' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  total: '生涯总览',
  weekly: '本周战绩',
  monthly: '本月战绩'
};

// -----------------------------------------------------------------------------
// Animated Counter Component
// -----------------------------------------------------------------------------
function AnimatedCounter({ value, className }: { value: number, className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
  const isFloat = value % 1 !== 0;

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = isFloat 
          ? latest.toFixed(2) 
          : Math.floor(latest).toLocaleString();
      }
    });
  }, [springValue, isFloat]);

  return <span ref={ref} className={className}>{isFloat ? value.toFixed(2) : Math.floor(value).toLocaleString()}</span>;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------
export default function KitBattleDetailsModal({ isOpen, onClose, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Period>('total');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Helper to calculate period stats
  const getStat = (key: 'kills' | 'deaths' | 'exp' | 'coins') => {
    if (activeTab === 'total') return stats[key];

    const periods = stats.periods;
    if (!periods) return 0;

    if (activeTab === 'weekly') {
      if (stats.current_week_id && periods.last_weekly_id !== stats.current_week_id) return 0;
      const startVal = periods[`weekly_${key}_start` as keyof typeof periods] as number;
      return Math.max(0, stats[key] - startVal);
    }

    if (activeTab === 'monthly') {
      if (stats.current_month_id && periods.last_monthly_id !== stats.current_month_id) return 0;
      const startVal = periods[`monthly_${key}_start` as keyof typeof periods] as number;
      return Math.max(0, stats[key] - startVal);
    }

    return 0;
  };

  const kills = getStat('kills');
  const deaths = getStat('deaths');
  const exp = getStat('exp');
  const coins = getStat('coins');
  const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50, rotateX: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      rotateX: 0,
      transition: { 
        type: "spring", 
        damping: 25, 
        stiffness: 300,
        mass: 0.8
      } 
    },
    exit: { opacity: 0, scale: 0.9, y: 50 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };

  return (
    <ModalPortal>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div 
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 perspective-1000"
          >
            {/* Backdrop with Blur */}
            <div
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-[#0f0f11] rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col md:flex-row z-10"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[100px]" />
              </div>

              {/* Close Button (Mobile) */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/5 dark:bg-black/20 text-gray-500 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white md:hidden backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Player Model & Identity */}
              <div className="relative w-full md:w-[320px] lg:w-[380px] bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1e] dark:to-[#0f0f11] flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/5 shrink-0 z-10">
                 {/* Player Identity Header */}
                 <div className="w-full p-6 pb-0 flex flex-col items-center text-center">
                    <div className="mb-4 relative group">
                       <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur opacity-20 dark:opacity-40 group-hover:opacity-40 dark:group-hover:opacity-60 transition-opacity duration-500" />
                       <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#151518] shadow-xl">
                          <img 
                            src={`https://visage.surgeplay.com/face/128/${stats.name}`} 
                            alt={stats.name}
                            className="w-full h-full object-cover"
                          />
                       </div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{stats.name}</h2>
                    <div className="flex items-center justify-center flex-wrap gap-2 text-gray-500 dark:text-white/50 text-sm">
                      <div className="px-3 py-1 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/10 rounded-full shadow-sm flex items-center">
                         <MinecraftText text={stats.rank || 'Player'} className="text-sm font-bold" />
                      </div>
                      <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                        LV.{Math.floor(stats.exp / 1000) + 1}
                      </span>
                    </div>
                 </div>

                 {/* 3D Model View */}
                 <div className="flex-1 w-full flex items-center justify-center relative min-h-[300px] md:min-h-0">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-20 pointer-events-none">
                       <img src="/logo-icon.png" className="w-48 h-48 opacity-10 grayscale" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <motion.img 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      src={`https://visage.surgeplay.com/full/512/${stats.name}`}
                      alt="Player Body"
                      className="relative z-10 h-[90%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 
                 {/* Footer Info */}
                 <div className="w-full p-6 pt-0">
                    <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider">最爱职业</span>
                          <Crown className="w-3.5 h-3.5 text-yellow-500" />
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center">
                             <Swords className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                          </div>
                          <div>
                             <div className="font-bold text-gray-900 dark:text-white">{stats.favorite_kit || '暂无'}</div>
                             <div className="text-xs text-gray-500 dark:text-white/40">常用首选</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right Column: Stats & Data */}
              <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-[#0f0f11]/50 relative z-10">
                {/* Header Actions */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5">
                   <div className="flex bg-gray-200/50 dark:bg-[#1a1a1e] p-1 rounded-xl border border-gray-200 dark:border-white/5">
                      {(['total', 'weekly', 'monthly'] as Period[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={clsx(
                            "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 z-10",
                            activeTab === tab ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70"
                          )}
                        >
                          {activeTab === tab && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute inset-0 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm"
                              transition={{ duration: 0.2 }}
                            />
                          )}
                          {PERIOD_LABELS[tab]}
                        </button>
                      ))}
                   </div>

                   <button
                    onClick={onClose}
                    className="hidden md:flex p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
                   >
                    <X className="w-6 h-6" />
                   </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                       <StatCard 
                          label="击杀总数" 
                          value={kills} 
                          icon={Target} 
                          color="text-red-400" 
                          gradient="from-red-500/20 to-orange-500/5"
                          borderColor="border-red-500/20"
                       />
                       <StatCard 
                          label="死亡次数" 
                          value={deaths} 
                          icon={Skull} 
                          color="text-gray-400" 
                          gradient="from-gray-500/20 to-slate-500/5"
                          borderColor="border-gray-500/20"
                       />
                       <StatCard 
                          label="K/D 比率" 
                          value={kd} 
                          icon={Zap} 
                          color="text-yellow-400" 
                          gradient="from-yellow-500/20 to-amber-500/5"
                          borderColor="border-yellow-500/20"
                          isFloat
                       />
                       <StatCard 
                          label="当前金币" 
                          value={coins} 
                          icon={Coins} 
                          color="text-emerald-400" 
                          gradient="from-emerald-500/20 to-teal-500/5"
                          borderColor="border-emerald-500/20"
                       />
                    </div>

                    {/* Secondary Info */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                       <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/5 flex items-center justify-between relative overflow-hidden group shadow-sm dark:shadow-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="flex items-center gap-4 relative z-10">
                             <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/10">
                                <TrendingUp className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="text-sm text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">总经验值</p>
                                <div className="flex items-baseline gap-2">
                                   <AnimatedCounter value={exp} className="text-2xl font-bold text-gray-900 dark:text-white" />
                                   <span className="text-xs text-gray-400 dark:text-white/30">EXP</span>
                                </div>
                             </div>
                          </div>
                          {/* Progress bar visual */}
                          <div className="hidden sm:block w-32 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "65%" }}
                               transition={{ duration: 1, delay: 0.5 }}
                               className="h-full bg-blue-500 rounded-full"
                             />
                          </div>
                       </div>

                       <div className="p-5 rounded-2xl bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group shadow-sm dark:shadow-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/10 relative z-10">
                             <Sparkles className="w-6 h-6" />
                          </div>
                          <div className="relative z-10">
                             <p className="text-sm text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">近期活跃</p>
                             <p className="text-gray-900 dark:text-white font-medium">状态良好</p>
                          </div>
                       </div>
                    </motion.div>

                    {/* Kits Stats */}
                    <motion.div variants={itemVariants}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-gray-400 dark:text-white/50" />
                          职业表现排行
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-white/30">按击杀数排序</span>
                      </div>
                      
                      {stats.kits_stats && stats.kits_stats.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {stats.kits_stats.map((kit, index) => (
                            <KitStatsCard key={kit.kit_name} kit={kit} index={index} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                          <Swords className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-white/40">暂无职业使用数据</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
  </ModalPortal>
);
}

// -----------------------------------------------------------------------------
// Sub Components
// -----------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon, color, gradient, borderColor, isFloat = false }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
      }}
      className={clsx(
        "p-5 rounded-2xl bg-white dark:bg-[#151518] border relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 shadow-sm dark:shadow-none",
        borderColor || "border-gray-200 dark:border-white/5"
      )}
    >
      <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className={clsx("p-2.5 rounded-xl bg-gray-100 dark:bg-white/5", color)}>
            <Icon className="w-5 h-5" />
          </div>
          {/* Decorative dot */}
          <div className={clsx("w-1.5 h-1.5 rounded-full opacity-50", color.replace('text-', 'bg-'))} />
        </div>
        
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-baseline gap-1">
             <AnimatedCounter value={value} />
             {isFloat && <span className="text-sm text-gray-400 dark:text-white/40 font-normal">ratio</span>}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider mt-1">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

function KitStatsCard({ kit, index }: { kit: { kit_name: string; kills: number }; index: number }) {
  const isTop3 = index < 3;
  
  const getRankStyle = (idx: number) => {
    switch(idx) {
      case 0: return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] border border-yellow-200/50";
      case 1: return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-[0_0_20px_rgba(203,213,225,0.3)] border border-slate-200/50";
      case 2: return "bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950 shadow-[0_0_20px_rgba(249,115,22,0.3)] border border-orange-200/50";
      default: return "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/5";
    }
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "p-4 rounded-xl border flex items-center justify-between group transition-all relative overflow-hidden",
        isTop3 
          ? "bg-gradient-to-br from-gray-50 to-transparent dark:from-white/5 dark:to-transparent border-gray-200 dark:border-white/10" 
          : "bg-white dark:bg-[#151518] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 shadow-sm dark:shadow-none"
      )}
    >
       <div className="flex items-center gap-4 relative z-10">
         <div className={clsx(
           "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black italic relative overflow-hidden shrink-0",
           getRankStyle(index)
         )}>
            {/* Shine effect for top ranks */}
            {isTop3 && (
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            )}
            #{index + 1}
         </div>
         
         <div className="flex flex-col min-w-0">
           <span className={clsx("font-bold text-lg leading-tight truncate", isTop3 ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-white/70")}>
             {kit.kit_name}
           </span>
           {index === 0 && <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-wider">Champion</span>}
           {index === 1 && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Runner-up</span>}
           {index === 2 && <span className="text-[10px] text-orange-500 dark:text-orange-400 font-bold uppercase tracking-wider">Third Place</span>}
         </div>
       </div>
       
       <div className="flex flex-col items-end relative z-10 pl-2">
          <span className={clsx("text-xl font-black tracking-tight", isTop3 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/60")}>
            {kit.kills.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-white/20 font-bold uppercase tracking-wider">Kills</span>
       </div>

       {/* Background glow for top 1 */}
       {index === 0 && (
         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/10 blur-3xl -z-0 pointer-events-none" />
       )}
    </motion.div>
  );
}
