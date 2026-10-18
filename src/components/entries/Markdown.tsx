import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders your Markdown text. Raw HTML in the text is ignored, so it is safe to paste anything. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-neon">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: c }) => {
            const external = /^https?:/.test(href || '');
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {c}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => (typeof src === 'string' ? <img src={src} alt={alt || ''} loading="lazy" /> : null),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
