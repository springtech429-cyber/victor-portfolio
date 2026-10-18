import { videoEmbedUrl } from '@/lib/helpers';

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const src = videoEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border hairline bg-black">
      <iframe
        src={src}
        title={`Video: ${title}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
