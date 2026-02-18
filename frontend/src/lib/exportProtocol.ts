import type { Protocol } from '@/types'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatVariableType(type: string): string {
  const types: Record<string, string> = {
    dependiente: 'Dependiente',
    independiente: 'Independiente',
    interviniente: 'Interviniente',
  }
  return types[type] ?? type
}

function formatApproach(approach: string): string {
  const approaches: Record<string, string> = {
    cuantitativo: 'Cuantitativo',
    cualitativo: 'Cualitativo',
    mixto: 'Mixto',
  }
  return approaches[approach] ?? approach
}

function formatScope(scope: string): string {
  const scopes: Record<string, string> = {
    exploratorio: 'Exploratorio',
    descriptivo: 'Descriptivo',
    correlacional: 'Correlacional',
    explicativo: 'Explicativo',
  }
  return scopes[scope] ?? scope
}

function buildVariablesTable(variables: Protocol['variables']): string {
  if (!variables || variables.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No se han definido variables.</p>'
  }

  const rows = variables
    .map(
      (v) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(v.name)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${formatVariableType(v.type)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(v.conceptual_definition)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(v.operational_definition)}</td>
      </tr>`
    )
    .join('')

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Nombre</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Tipo</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Def. Conceptual</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Def. Operacional</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`
}

function buildInstrumentsTable(instruments: Protocol['instruments']): string {
  if (!instruments || instruments.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No se han definido instrumentos.</p>'
  }

  const rows = instruments
    .map(
      (inst) => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(inst.name)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(inst.type)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(inst.description)}</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${inst.variables_measured.map(escapeHtml).join(', ')}</td>
      </tr>`
    )
    .join('')

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Nombre</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Tipo</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Descripci&oacute;n</th>
          <th style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Variables que mide</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`
}

function buildSpecificObjectives(objectives: string[]): string {
  const filtered = objectives?.filter(Boolean) ?? []
  if (filtered.length === 0) {
    return '<p style="color: #6b7280; font-style: italic;">No se han definido objetivos espec&iacute;ficos.</p>'
  }

  return `
    <ol style="margin: 8px 0 0 20px; padding: 0; line-height: 1.7;">
      ${filtered.map((obj) => `<li style="margin-bottom: 4px;">${escapeHtml(obj)}</li>`).join('')}
    </ol>`
}

function buildHtml(protocol: Protocol): string {
  const date = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Protocolo de Investigaci&oacute;n</title>
  <style>
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 32px;
      background: #ffffff;
    }

    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }

    .header h1 {
      font-size: 24px;
      color: #312e81;
      margin: 0 0 4px 0;
    }

    .header .subtitle {
      font-size: 13px;
      color: #6b7280;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #4338ca;
      margin: 0 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    .field {
      margin-bottom: 16px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 14px;
      color: #1f2937;
    }

    .empty-value {
      color: #9ca3af;
      font-style: italic;
    }

    .design-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 8px;
    }

    .design-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
    }

    .sample-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 8px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Protocolo de Investigaci&oacute;n</h1>
    <p class="subtitle">Generado con MIMI &mdash; ${date}</p>
  </div>

  <!-- Planteamiento del problema -->
  <div class="section">
    <h2 class="section-title">1. Planteamiento del Problema</h2>
    <div class="field">
      <div class="field-value">
        ${protocol.problem_statement ? escapeHtml(protocol.problem_statement) : '<span class="empty-value">No definido</span>'}
      </div>
    </div>
  </div>

  <!-- Pregunta de investigacion -->
  <div class="section">
    <h2 class="section-title">2. Pregunta de Investigaci&oacute;n</h2>
    <div class="field">
      <div class="field-value">
        ${protocol.research_question ? escapeHtml(protocol.research_question) : '<span class="empty-value">No definida</span>'}
      </div>
    </div>
  </div>

  <!-- Objetivos -->
  <div class="section">
    <h2 class="section-title">3. Objetivos</h2>
    <div class="field">
      <div class="field-label">Objetivo General</div>
      <div class="field-value">
        ${protocol.general_objective ? escapeHtml(protocol.general_objective) : '<span class="empty-value">No definido</span>'}
      </div>
    </div>
    <div class="field">
      <div class="field-label">Objetivos Espec&iacute;ficos</div>
      <div class="field-value">
        ${buildSpecificObjectives(protocol.specific_objectives)}
      </div>
    </div>
  </div>

  ${protocol.hypothesis ? `
  <!-- Hipotesis -->
  <div class="section">
    <h2 class="section-title">4. Hip&oacute;tesis</h2>
    <div class="field">
      <div class="field-value">${escapeHtml(protocol.hypothesis)}</div>
    </div>
  </div>
  ` : ''}

  <!-- Variables -->
  <div class="section">
    <h2 class="section-title">${protocol.hypothesis ? '5' : '4'}. Variables</h2>
    ${buildVariablesTable(protocol.variables)}
  </div>

  <!-- Diseno de investigacion -->
  <div class="section">
    <h2 class="section-title">${protocol.hypothesis ? '6' : '5'}. Dise&ntilde;o de Investigaci&oacute;n</h2>
    <div class="design-grid">
      <div class="design-card">
        <div class="field-label">Enfoque</div>
        <div class="field-value">${protocol.research_design?.approach ? formatApproach(protocol.research_design.approach) : '<span class="empty-value">No definido</span>'}</div>
      </div>
      <div class="design-card">
        <div class="field-label">Tipo</div>
        <div class="field-value">${protocol.research_design?.type ? escapeHtml(protocol.research_design.type) : '<span class="empty-value">No definido</span>'}</div>
      </div>
      <div class="design-card">
        <div class="field-label">Alcance</div>
        <div class="field-value">${protocol.research_design?.scope ? formatScope(protocol.research_design.scope) : '<span class="empty-value">No definido</span>'}</div>
      </div>
    </div>
  </div>

  <!-- Muestra -->
  <div class="section">
    <h2 class="section-title">${protocol.hypothesis ? '7' : '6'}. Muestra</h2>
    <div class="sample-grid">
      <div class="design-card">
        <div class="field-label">Poblaci&oacute;n</div>
        <div class="field-value">${protocol.sample?.population ? escapeHtml(protocol.sample.population) : '<span class="empty-value">No definida</span>'}</div>
      </div>
      <div class="design-card">
        <div class="field-label">Tama&ntilde;o de Muestra</div>
        <div class="field-value">${protocol.sample?.size ? `n = ${protocol.sample.size}` : '<span class="empty-value">No definido</span>'}</div>
      </div>
      <div class="design-card">
        <div class="field-label">T&eacute;cnica de Muestreo</div>
        <div class="field-value">${protocol.sample?.technique ? escapeHtml(protocol.sample.technique) : '<span class="empty-value">No definida</span>'}</div>
      </div>
      <div class="design-card">
        <div class="field-label">Justificaci&oacute;n</div>
        <div class="field-value">${protocol.sample?.justification ? escapeHtml(protocol.sample.justification) : '<span class="empty-value">No definida</span>'}</div>
      </div>
    </div>
  </div>

  <!-- Instrumentos -->
  <div class="section">
    <h2 class="section-title">${protocol.hypothesis ? '8' : '7'}. Instrumentos de Recolecci&oacute;n</h2>
    ${buildInstrumentsTable(protocol.instruments)}
  </div>

  <div class="footer">
    Documento generado autom&aacute;ticamente por MIMI &mdash; Mentor Interactivo de Metodolog&iacute;a de Investigaci&oacute;n
  </div>
</body>
</html>`
}

export function exportProtocolToPDF(protocol: Protocol): void {
  const html = buildHtml(protocol)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert(
      'No se pudo abrir la ventana de impresion. Por favor, permite las ventanas emergentes para este sitio.'
    )
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Esperar a que el contenido cargue antes de imprimir
  printWindow.addEventListener('load', () => {
    printWindow.focus()
    printWindow.print()
  })

  // Fallback: si el evento load no se dispara (algunos navegadores)
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 500)
}
