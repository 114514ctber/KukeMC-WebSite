'use client';

import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Mention from '@tiptap/extension-mention';
import { Markdown } from 'tiptap-markdown';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import markdownit from 'markdown-it';
import markdownItKatex from '@vscode/markdown-it-katex';
import taskLists from 'markdown-it-task-lists';
import clsx from 'clsx';
import 'katex/dist/katex.min.css';
import './MarkdownEditor.css'; // Re-use styles
import './MarkdownCodeHighlight.css';
import { MathExtension } from './extensions/MathExtension';
import { MathBlockExtension } from './extensions/MathBlockExtension';

const lowlight = createLowlight(common);

interface MarkdownViewerProps {
  content: string;
  className?: string;
  maxHeight?: string;
  disableImages?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className, maxHeight, disableImages = false }) => {
  // Initialize markdown-it with plugins
  const md = useMemo(() => {
    const m = markdownit({
      html: true,
      breaks: true,
      linkify: true,
    });
    
    m.use(taskLists);
    m.use(markdownItKatex);

    // Custom renderers to output HTML compatible with Tiptap extensions
    m.renderer.rules.math_inline = (tokens, idx) => {
      const content = tokens[idx].content;
      return `<span data-type="math" data-latex="${encodeURIComponent(content)}"></span>`;
    };

    m.renderer.rules.math_block = (tokens, idx) => {
      const content = tokens[idx].content;
      return `<div data-type="math-block" data-latex="${encodeURIComponent(content)}"></div>`;
    };

    return m;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: false, // Disable default CodeBlock to use Lowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      !disableImages ? ImageExtension : undefined,
      LinkExtension.configure({
        openOnClick: true,
        autolink: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Highlight.configure({ multicolor: true }),
      Mention.configure({
        HTMLAttributes: {
          class: 'text-blue-500 bg-blue-100 dark:bg-blue-900 rounded px-1 py-0.5 font-medium decoration-clone',
        },
      }),
      MathExtension,
      MathBlockExtension,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ].filter(Boolean) as any,
    content: '', // Initial empty, we set it in useEffect
    editorProps: {
      attributes: {
        class: clsx(
          'prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none prose-viewer',
          className
        ),
      },
    },
    shouldRerenderOnTransaction: false, // Performance optimization
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
       // Convert Markdown to HTML using our custom markdown-it instance
       const html = md.render(content);
       
       // Set content as HTML
       editor.commands.setContent(html, false); 
    }
  }, [content, editor, md]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
};

export default MarkdownViewer;
