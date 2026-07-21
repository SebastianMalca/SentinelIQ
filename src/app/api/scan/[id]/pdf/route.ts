import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Manejo compatible con Next.js 14 y 15 (donde params puede ser una promesa)
  const resolvedParams = await Promise.resolve(params);
  const scanId = resolvedParams.id;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Aquí construiríamos la página. Por ahora, un HTML simple simulando el reporte.
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #111827; }
            h1 { color: #2563eb; font-size: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .score-container { display: flex; align-items: center; gap: 20px; margin-top: 30px; }
            .score { font-size: 64px; font-weight: 800; color: #16a34a; }
            .card { border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; margin-top: 30px; background: #f9fafb; }
            .label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600; }
            .footer { margin-top: 50px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Auditoría de Salud - SentinelIQ</h1>
          <p class="label">Scan ID: ${scanId}</p>
          
          <div class="card">
            <div class="label">CyberScore Global</div>
            <div class="score-container">
              <div class="score">98</div>
              <p style="color: #4b5563; font-size: 18px; max-width: 400px;">
                El sitio web tiene un rendimiento excelente y cumple con todos los estándares modernos de seguridad y accesibilidad.
              </p>
            </div>
          </div>
          
          <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card" style="margin-top: 0;">
              <div class="label">Rendimiento</div>
              <div style="font-size: 32px; font-weight: bold; color: #16a34a; margin-top: 10px;">100/100</div>
            </div>
            <div class="card" style="margin-top: 0;">
              <div class="label">Seguridad</div>
              <div style="font-size: 32px; font-weight: bold; color: #ca8a04; margin-top: 10px;">92/100</div>
            </div>
          </div>

          <div class="footer">
            Generado automáticamente por SentinelIQ &copy; ${new Date().getFullYear()}
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sentineliq-report-${scanId}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error generando el reporte PDF' },
      { status: 500 }
    );
  }
}
