import { cn } from '@/lib/utils'

interface DataTableProps {
  headers: string[]
  data: number[][]
  selectedColumns: number[]
  onColumnSelect: (index: number) => void
}

export default function DataTable({
  headers,
  data,
  selectedColumns,
  onColumnSelect,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted w-12">
              #
            </th>
            {headers.map((header, i) => (
              <th
                key={i}
                onClick={() => onColumnSelect(i)}
                className={cn(
                  'px-3 py-2.5 text-left text-xs font-medium cursor-pointer transition-colors select-none',
                  selectedColumns.includes(i)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:bg-secondary hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span>{header}</span>
                  {selectedColumns.includes(i) && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {selectedColumns.indexOf(i) + 1}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'border-b border-border/50 transition-colors',
                rowIndex % 2 === 0 ? 'bg-card' : 'bg-secondary/20'
              )}
            >
              <td className="px-3 py-2 text-xs text-muted font-mono">
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'px-3 py-2 font-mono text-xs',
                    selectedColumns.includes(colIndex)
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'text-foreground'
                  )}
                >
                  {typeof cell === 'number'
                    ? Number.isInteger(cell)
                      ? cell
                      : cell.toFixed(2)
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 20 && (
        <div className="border-t border-border bg-secondary/30 px-3 py-2 text-xs text-muted text-center">
          Mostrando {data.length} registros
        </div>
      )}
    </div>
  )
}
