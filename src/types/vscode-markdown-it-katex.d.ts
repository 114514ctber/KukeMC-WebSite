declare module '@vscode/markdown-it-katex' {
    import MarkdownIt = require('markdown-it');
    const MarkdownItKatex: (md: MarkdownIt, options?: any) => void;
    export = MarkdownItKatex;
}
