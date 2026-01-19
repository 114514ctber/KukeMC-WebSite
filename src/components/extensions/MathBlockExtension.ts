import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import katex from 'katex';

export interface MathBlockExtensionOptions {
  inline: boolean;
}

export const MathBlockExtension = Node.create<MathBlockExtensionOptions>({
  name: 'mathBlock',

  group: 'block',

  content: 'text*', // Block math usually doesn't contain other nodes, but we store latex as attribute. Actually 'atom' is better if we don't want editable content inside.

  atom: true, // It's a leaf node from Tiptap's perspective, content is in attributes

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
            'data-latex': attributes.latex,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
      // Also match standard latex block structure if possible?
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' }),
      node.attrs.latex,
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement('div');
      dom.className = 'math-block my-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors py-2 rounded';
      dom.setAttribute('data-type', 'math-block');
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
            displayMode: true, // block mode
          });
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
          if (updatedNode.attrs.latex === node.attrs.latex) return true;
          
          node = updatedNode;
          render();
          return true;
        },
      };
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /^\$\$\s+$/, // triggers on $$ + space? Or maybe block rule?
        type: this.type,
        getAttributes: (match) => {
          return { latex: '' }; // Just creates empty block?
        }
      })
    ];
  }
});
