import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Play } from 'lucide-react'

interface VideoPlayerProps {
  url: string
  title: string
  className?: string
}

function getEmbedUrl(url: string): { type: 'iframe' | 'native'; src: string } {
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (youtubeMatch) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    }
  }

  // Video nativo
  return { type: 'native', src: url }
}

export default function VideoPlayer({ url, title, className = '' }: VideoPlayerProps) {
  const embed = getEmbedUrl(url)

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative aspect-video bg-foreground/5">
        {embed.type === 'iframe' ? (
          <iframe
            src={embed.src}
            title={title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={embed.src}
            title={title}
            controls
            className="absolute inset-0 size-full object-contain"
          >
            Tu navegador no soporta el elemento video.
          </video>
        )}
      </div>
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Play className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
