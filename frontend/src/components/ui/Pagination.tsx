import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  function getPages(): (number | '...')[] {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Paginacion">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Pagina anterior"
      >
        <ChevronLeft className="size-4" />
      </button>

      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="flex size-9 items-center justify-center text-sm text-muted">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:bg-secondary hover:text-foreground'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Pagina siguiente"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

/** Hook para paginación client-side */
export function usePagination<T>(items: T[], perPage: number = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  return {
    totalPages,
    paginate(page: number): T[] {
      const start = (page - 1) * perPage
      return items.slice(start, start + perPage)
    },
  }
}
