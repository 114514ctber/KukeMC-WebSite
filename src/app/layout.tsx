import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/next/Navbar';
import Footer from '@/components/next/Footer';

const inter = { className: 'font-sans' };

export const metadata: Metadata = {
  title: 'KukeMC-我的世界服务器(Minecraft)',
  description: '一群热爱游戏的方块人组成的多玩法群组服',
  keywords: '我的世界服务器,Minecraft服务器,趣味生存,原版生电,起床战争,职业战争,粘液科技,RPG,小游戏',
  verification: {
    other: {
      'bytedance-verification-code': 'NS6KttLrZQB1RGVX+Rc8',
      'msvalidate.01': 'ADE17AC5E567AE2D1F2647F9A4C60FC1',
      'baidu-site-verification': 'codeva-stpqsOerFq',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="icon" type="image/png" href="https://m.ccw.site/gandi_application/user_assets/2a6bb37880317d2bb5525ab560618e04.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = "kukemc-theme";
                  var theme = localStorage.getItem(storageKey);
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var element = document.documentElement;
                  
                  element.classList.remove('light', 'dark');
                  
                  if (theme === 'dark' || ((!theme || theme === 'system') && supportDarkMode)) {
                    element.classList.add('dark');
                  } else {
                    element.classList.add('light');
                  }
                } catch (e) {
                  console.error('Theme initialization failed', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col font-sans selection:bg-brand-500/30 selection:text-brand-600 dark:selection:text-brand-200">
             <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
               <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 dark:bg-brand-600/10 blur-[100px] transition-colors duration-500" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[100px] transition-colors duration-500" />
             </div>
             
             <Navbar />
             
             <main className="flex-grow relative z-10 pt-20">
               {children}
             </main>
             
             <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
