import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from '@/components/next/PostDetailClient';
import { Post } from '@/types/activity';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getPost(id: string): Promise<Post | null> {
  // Validate ID is numeric
  if (!/^\d+$/.test(id)) {
    return null;
  }

  try {
    const res = await fetch(`https://api.kuke.ink/api/posts/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
        if (res.status === 404 || res.status === 422) return null;
        console.error(`Failed to fetch post: ${res.status} ${res.statusText}`);
        throw new Error(`Failed to fetch post: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Error in getPost:', e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  
  if (!post) {
    return {
      title: '动态不存在 - KukeMC',
    };
  }

  const description = post.content 
    ? post.content.replace(/[#*`~>]/g, '').substring(0, 160) 
    : 'KukeMC 玩家动态';

  return {
    title: `${post.title} - KukeMC`,
    description: description,
    openGraph: {
        title: post.title,
        description: description,
        type: 'article',
        publishedTime: post.created_at,
        authors: [post.author.nickname || post.author.username],
        images: post.images && post.images.length > 0 ? [post.images[0]] : [],
    }
  };
}

export async function generateStaticParams() {
  // Return empty to generate on demand
  return [];
}

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <PostDetailClient initialPost={post} isAlbum={false} />;
}
