import { Metadata } from 'next';
import SkinClient from '@/components/next/SkinClient';

export const metadata: Metadata = {
  title: '皮肤上传 - KukeMC',
  description: '上传您的 Minecraft 皮肤到 KukeMC 服务器。',
};

export default function SkinPage() {
  return <SkinClient />;
}
