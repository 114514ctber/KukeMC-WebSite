import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import katex from 'katex';

export interface MathExtensionOptions {
  inline: boolean;
}

export const MathExtension = Node.create<MathExtensionOptions>({
  name: 'math',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => {
          const val = element.getAttribute('data-latex') || '';
          try {
            return decodeURIComponent(val);
          } catch (e) {
            return val;
          }
        },
        renderHTML: (attributes) => {
          return {
            'data-latex': attributes.latex, // Tiptap might escape this automatically? Better rely on MarkdownViewer to encode.
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math' }),
      node.attrs.latex,
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement('span');
      // Merge classes manually if needed, or let Tiptap handle it via HTMLAttributes?
      // Tiptap's HTMLAttributes usually contain the attributes from renderHTML.
      // We want to add a class for styling.
      dom.className = 'math-node inline-block px-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';
      dom.setAttribute('data-type', 'math');
      dom.setAttribute('data-latex', node.attrs.latex);

      // Render function
      const render = () => {
        const latex = node.attrs.latex;
        if (!latex) return;
        
        try {
          katex.render(latex, dom, {
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false,
            displayMode: false, // inline
          });
          // Add a title for hover
          dom.title = latex;
        } catch (error) {
          dom.textContent = latex;
          dom.classList.add('text-red-500');
        }
      };

      render();

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          // Check if latex changed
          if (updatedNode.attrs.latex === node.attrs.latex) return true;
          
          node = updatedNode;
          render();
          return true;
        },
      };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write('$');
          state.text(node.attrs.latex, false);
          state.write('$');
        },
      },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$(.+?)\$/,
        type: this.type,
        getAttributes: (match) => {
          return {
            latex: match[1],
          };
        },
      }),
    ];
  },
});
