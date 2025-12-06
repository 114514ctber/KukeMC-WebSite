import React, { useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import './MarkdownEditor.css'; // Import custom overrides
import { uploadImage } from '../services/activity';
import clsx from 'clsx';
import api from '../utils/api';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "写点什么...", 
  className,
  minHeight = "min-h-[200px]"
}) => {
  const [vditor, setVditor] = useState<Vditor>();
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const userCacheRef = useRef<{value: string, html: string}[]>([]);

  useEffect(() => {
    if (!editorRef.current) return;

    // Clear previous instance if exists (to prevent duplicates in strict mode)
    if (editorRef.current) {
       editorRef.current.innerHTML = '';
    }

    const vditorInstance = new Vditor(editorRef.current, {
      value: value,
      mode: 'ir', // Instant Rendering mode (WYSIWYG-like)
      height: 400,
      minHeight: 300,
      placeholder,
      lang: 'zh_CN',
      theme: 'classic', // Default, will be updated by effect
      cache: {
        enable: false,
      },
      toolbar: [
        'emoji', 'headings', 'bold', 'italic', 'strike', 'link', '|',
        'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
        'quote', 'line', 'code', 'inline-code', 'insert-before', 'insert-after', '|',
        'upload', 'table', '|',
        'undo', 'redo', '|',
        'edit-mode',
      ],
      hint: {
        at: (key: string) => {
            // Note: Vditor expects synchronous return. 
            // We trigger fetch if key is present, but return cached/empty for now.
            // This is a best-effort approach.
            if (key) {
                api.get(`/api/profile/search?q=${key}`).then(res => {
                    userCacheRef.current = res.data.map((u: any) => ({
                        value: '@' + u.username,
                        html: `<div class="flex items-center gap-2"><img src="${u.avatar || `https://cravatar.eu/helmavatar/${u.username}/16.png`}" class="w-5 h-5 rounded-full"/> ${u.username}</div>`
                    }));
                }).catch(console.error);
            }
            // Return whatever we have that matches
            return userCacheRef.current.filter(u => u.value.toLowerCase().includes(key.toLowerCase()));
        }
      } as any,
      after: () => {
        setVditor(vditorInstance);
      },
      input: (val) => {
        isUpdatingRef.current = true;
        onChange(val);
        // Reset flag after a short delay to ensure we don't block prop updates if they loop back quickly
        setTimeout(() => { isUpdatingRef.current = false; }, 0);
      },
      upload: {
        accept: 'image/*',
        multiple: false,
        handler: async (files) => {
          for (const file of files) {
            try {
              const { url } = await uploadImage(file);
              const name = file.name;
              const md = `![${name}](${url})`;
              vditorInstance.insertValue(md);
            } catch (err) {
              console.error('Failed to upload image:', err);
              // Could show a toast here
            }
          }
          return null;
        },
      },
      preview: {
        theme: {
          current: 'light',
          path: 'https://cdn.jsdelivr.net/npm/vditor/dist/css/content-theme',
        },
      },
    });

    // setVditor(vditorInstance); // Removed, set in after callback

    return () => {
      try {
        vditorInstance?.destroy();
      } catch (e) {
        // Ignore destroy error in strict mode
      }
      setVditor(undefined);
    };
  }, []); // Run once on mount

  // ... keep existing effects ...
    useEffect(() => {
    if (vditor && !isUpdatingRef.current && value !== vditor.getValue()) {
      vditor.setValue(value);
    }
  }, [value, vditor]);

  // Dark mode sync
  useEffect(() => {
    if (vditor) {
        const isDark = document.documentElement.classList.contains('dark');
        vditor.setTheme(isDark ? 'dark' : 'classic', isDark ? 'dark' : 'light');
    }
  }, [vditor]);

  return <div ref={editorRef} className={clsx("vditor-reset", minHeight, className)} />;
};

export default MarkdownEditor;
