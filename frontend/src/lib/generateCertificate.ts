import type { Certificate } from '@/types'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Genera una representacion visual tipo QR usando CSS grid
 * basada en el certificate_code para darle un aspecto unico
 */
function generateQRGrid(code: string): string {
  const size = 21
  const cells: boolean[][] = []

  // Generar patron pseudo-aleatorio basado en el codigo
  let seed = 0
  for (let i = 0; i < code.length; i++) {
    seed = ((seed << 5) - seed + code.charCodeAt(i)) | 0
  }

  function pseudoRandom(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  // Inicializar grid
  for (let y = 0; y < size; y++) {
    cells[y] = []
    for (let x = 0; x < size; x++) {
      cells[y][x] = false
    }
  }

  // Patron de posicion (esquinas del QR)
  function drawFinderPattern(startX: number, startY: number) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = y === 0 || y === 6 || x === 0 || x === 6
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4
        cells[startY + y][startX + x] = isOuter || isInner
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(size - 7, 0)
  drawFinderPattern(0, size - 7)

  // Lineas de temporizacion
  for (let i = 7; i < size - 7; i++) {
    cells[6][i] = i % 2 === 0
    cells[i][6] = i % 2 === 0
  }

  // Rellenar el resto con patron pseudo-aleatorio basado en el codigo
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // No sobreescribir patrones de posicion ni lineas de temporizacion
      if (
        (x < 8 && y < 8) ||
        (x >= size - 7 && y < 8) ||
        (x < 8 && y >= size - 7) ||
        (x === 6 || y === 6)
      ) {
        continue
      }
      cells[y][x] = pseudoRandom() > 0.5
    }
  }

  const cellSize = 6
  const totalSize = size * cellSize

  let html = `<div style="display:inline-block;padding:8px;background:white;border-radius:4px;">`
  html += `<div style="width:${totalSize}px;height:${totalSize}px;display:grid;grid-template-columns:repeat(${size},${cellSize}px);grid-template-rows:repeat(${size},${cellSize}px);">`

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bg = cells[y][x] ? '#1e3a5f' : '#ffffff'
      html += `<div style="background:${bg};"></div>`
    }
  }

  html += `</div></div>`
  return html
}

function buildCertificateHtml(certificate: Certificate): string {
  const approvedDate = new Date(certificate.approved_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const qrGrid = generateQRGrid(certificate.certificate_code)

  // URL de verificacion (relativa al dominio actual)
  const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_code}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado - ${escapeHtml(certificate.student_name)}</title>
  <style>
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    @page {
      size: landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .certificate {
      width: 1056px;
      height: 744px;
      background: linear-gradient(135deg, #0f2748 0%, #1a3a6b 30%, #1e4d8c 60%, #2563a8 100%);
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    /* Borde decorativo exterior */
    .certificate::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 12px;
      border: 2px solid rgba(212, 175, 55, 0.6);
      pointer-events: none;
    }

    /* Borde decorativo interior */
    .certificate::after {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 1px solid rgba(212, 175, 55, 0.3);
      pointer-events: none;
    }

    /* Patron decorativo de fondo */
    .bg-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.04;
      background-image:
        radial-gradient(circle at 20% 30%, white 1px, transparent 1px),
        radial-gradient(circle at 80% 70%, white 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, white 2px, transparent 2px);
      background-size: 60px 60px, 80px 80px, 100px 100px;
    }

    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 64px;
      text-align: center;
    }

    /* Logo MIMI */
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #d4af37;
      letter-spacing: 8px;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-family: 'Georgia', serif;
    }

    .logo-sub {
      font-size: 11px;
      color: rgba(212, 175, 55, 0.7);
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 28px;
    }

    /* Linea decorativa dorada */
    .gold-line {
      width: 200px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d4af37, transparent);
      margin: 0 auto 24px;
    }

    .cert-title {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .cert-type {
      font-size: 32px;
      color: #ffffff;
      font-weight: 400;
      letter-spacing: 3px;
      margin-bottom: 24px;
    }

    .awarded-to {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 8px;
    }

    .student-name {
      font-size: 36px;
      color: #d4af37;
      font-weight: 400;
      font-style: italic;
      margin-bottom: 20px;
      line-height: 1.2;
    }

    .description {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.75);
      max-width: 600px;
      line-height: 1.7;
      margin-bottom: 24px;
    }

    .session-title {
      color: #ffffff;
      font-weight: 600;
      font-style: italic;
    }

    .gold-line-sm {
      width: 120px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #d4af37, transparent);
      margin: 0 auto 20px;
    }

    .footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
    }

    .footer-left {
      text-align: left;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }

    .date-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }

    .date-value {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }

    .code-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }

    .code-value {
      font-size: 14px;
      color: #d4af37;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .qr-label {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.35);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Esquinas decorativas */
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      z-index: 2;
    }

    .corner-tl { top: 28px; left: 28px; border-top: 2px solid #d4af37; border-left: 2px solid #d4af37; }
    .corner-tr { top: 28px; right: 28px; border-top: 2px solid #d4af37; border-right: 2px solid #d4af37; }
    .corner-bl { bottom: 28px; left: 28px; border-bottom: 2px solid #d4af37; border-left: 2px solid #d4af37; }
    .corner-br { bottom: 28px; right: 28px; border-bottom: 2px solid #d4af37; border-right: 2px solid #d4af37; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="bg-pattern"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <div class="content">
      <div class="logo">MIMI</div>
      <div class="logo-sub">Mi Mentor de Investigacion</div>

      <div class="gold-line"></div>

      <div class="cert-title">Certificado de</div>
      <div class="cert-type">Aprobacion de Protocolo</div>

      <div class="awarded-to">Se otorga a</div>
      <div class="student-name">${escapeHtml(certificate.student_name)}</div>

      <div class="description">
        Por haber completado y aprobado satisfactoriamente el protocolo de investigacion
        en la sesion <span class="session-title">&ldquo;${escapeHtml(certificate.session_title)}&rdquo;</span>,
        demostrando dominio de las competencias metodologicas requeridas.
      </div>

      <div class="gold-line-sm"></div>

      <div class="footer">
        <div class="footer-left">
          <div class="date-label">Fecha de aprobacion</div>
          <div class="date-value">${approvedDate}</div>
          <div style="margin-top: 8px;">
            <div class="date-label">Fecha de emision</div>
            <div class="date-value">${issuedDate}</div>
          </div>
        </div>

        <div class="footer-center">
          <div class="qr-section">
            ${qrGrid}
            <div class="qr-label">Escanear para verificar</div>
          </div>
        </div>

        <div class="footer-right">
          <div class="code-label">Codigo de verificacion</div>
          <div class="code-value">${escapeHtml(certificate.certificate_code)}</div>
          <div style="margin-top: 8px;">
            <div class="qr-label">${escapeHtml(verifyUrl)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generateCertificatePDF(certificate: Certificate): void {
  const html = buildCertificateHtml(certificate)

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
