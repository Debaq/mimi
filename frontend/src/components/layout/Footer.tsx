export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">
            MIMI - Mi Mentor de Investigacion
          </p>
          <p className="text-xs text-muted">
            &copy; {year} MIMI. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
