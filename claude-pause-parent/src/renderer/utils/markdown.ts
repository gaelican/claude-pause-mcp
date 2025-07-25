import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const validLanguage = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language: validLanguage }).value;
  return `<pre><code class="hljs ${validLanguage}">${highlighted}</code></pre>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

export function renderMarkdown(text: string): string {
  if (!text) return '';
  
  try {
    // Parse markdown
    let html = marked.parse(text) as string;
    
    // Add copy buttons to code blocks
    html = (html as string).replace(
      /<pre><code/g, 
      '<div class="code-block-wrapper"><button class="copy-code-btn" data-code>Copy</button><pre><code'
    );
    html = (html as string).replace(/<\/code><\/pre>/g, '</code></pre></div>');
    
    return html;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return text;
  }
}

export function copyCodeToClipboard(codeElement: HTMLElement): Promise<void> {
  const text = codeElement.textContent || '';
  return navigator.clipboard.writeText(text);
}