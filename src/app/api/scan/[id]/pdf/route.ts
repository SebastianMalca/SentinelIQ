import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scanId } = await params;

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFontSize(26);
    doc.setTextColor(37, 99, 235); // #2563eb
    doc.text('Auditoría de Salud - SentinelIQ', 20, 30);

    // Divider line
    doc.setDrawColor(229, 231, 235); // #e5e7eb
    doc.setLineWidth(0.5);
    doc.line(20, 36, pageWidth - 20, 36);

    // Scan ID label
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text(`SCAN ID: ${scanId}`, 20, 44);

    // --- CyberScore Card ---
    doc.setFillColor(249, 250, 251); // #f9fafb
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, 52, pageWidth - 40, 60, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('CYBERSCORE GLOBAL', 30, 64);

    doc.setFontSize(48);
    doc.setTextColor(22, 163, 74); // #16a34a
    doc.text('98', 30, 92);

    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    const description =
      'El sitio web tiene un rendimiento excelente y cumple con todos los estándares modernos de seguridad y accesibilidad.';
    const splitDesc = doc.splitTextToSize(description, 95);
    doc.text(splitDesc, 62, 78);

    // --- Metric Cards ---
    const cardY = 125;
    const cardWidth = (pageWidth - 50) / 2;

    // Performance Card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, cardY, cardWidth, 45, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('RENDIMIENTO', 30, cardY + 15);

    doc.setFontSize(26);
    doc.setTextColor(22, 163, 74);
    doc.text('100/100', 30, cardY + 34);

    // Security Card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(30 + cardWidth, cardY, cardWidth, 45, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('SEGURIDAD', 40 + cardWidth, cardY + 15);

    doc.setFontSize(26);
    doc.setTextColor(202, 138, 4); // #ca8a04
    doc.text('92/100', 40 + cardWidth, cardY + 34);

    // --- Accessibility & SEO Cards ---
    const card2Y = 180;

    // Accessibility Card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, card2Y, cardWidth, 45, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('ACCESIBILIDAD', 30, card2Y + 15);

    doc.setFontSize(26);
    doc.setTextColor(22, 163, 74);
    doc.text('95/100', 30, card2Y + 34);

    // SEO Card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(30 + cardWidth, card2Y, cardWidth, 45, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('SEO', 40 + cardWidth, card2Y + 15);

    doc.setFontSize(26);
    doc.setTextColor(22, 163, 74);
    doc.text('97/100', 40 + cardWidth, card2Y + 34);

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const footer = `Generado automáticamente por SentinelIQ © ${new Date().getFullYear()}`;
    const footerWidth = doc.getTextWidth(footer);
    doc.text(footer, (pageWidth - footerWidth) / 2, 275);

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sentineliq-report-${scanId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error generando el reporte PDF' },
      { status: 500 }
    );
  }
}
