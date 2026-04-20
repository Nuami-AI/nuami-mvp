"use client";

interface Props {
  videoId: string;
  title?: string;
}

export default function VideoEmbed({ videoId, title }: Props) {
  return (
    <div className="w-full aspect-video bg-gray-900 relative">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title ?? "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
