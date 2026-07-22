import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scanUrl } from "@/lib/scanner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scanId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitor = await prisma.monitor.findUnique({
      where: { id: scanId }
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor no encontrado" }, { status: 404 });
    }

    if (monitor.userId !== session.user.id) {
      return NextResponse.json({ error: "No tienes permiso para ver este reporte" }, { status: 403 });
    }

    // ===== Escaneo real del sitio web =====
    const scanResult = await scanUrl(monitor.url);

    const { scores, findings, serverInfo } = scanResult;

    // ===== Generar PDF =====
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const normalizedUrl = monitor.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text('Auditoría de Seguridad - SentinelIQ', 20, 28);

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 34, pageWidth - 20, 34);

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`DOMINIO: ${normalizedUrl}`, 20, 42);
    doc.text(`FECHA: ${new Date().toLocaleDateString('es-PE')}`, 20, 47);
    if (serverInfo.server) {
      doc.text(`SERVIDOR: ${serverInfo.server}  |  TTFB: ${serverInfo.responseTimeMs}ms  |  ${serverInfo.isHttps ? 'HTTPS' : 'HTTP'}`, 20, 52);
    }

    // --- CyberScore Card ---
    const cyberY = 58;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, cyberY, pageWidth - 40, 50, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('CYBERSCORE GLOBAL', 30, cyberY + 12);

    doc.setFontSize(44);
    if (scores.global >= 90) doc.setTextColor(22, 163, 74);
    else if (scores.global >= 70) doc.setTextColor(202, 138, 4);
    else doc.setTextColor(220, 38, 38);
    doc.text(scores.global.toString(), 30, cyberY + 38);

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    let description = 'El sitio presenta vulnerabilidades críticas que requieren atención inmediata.';
    if (scores.global >= 90) description = 'El sitio cumple con los estándares modernos de seguridad, rendimiento y accesibilidad.';
    else if (scores.global >= 70) description = 'El sitio tiene una base sólida pero presenta oportunidades de mejora en seguridad o rendimiento.';
    const splitDesc = doc.splitTextToSize(description, 100);
    doc.text(splitDesc, 60, cyberY + 24);

    // --- Score Cards ---
    const drawCard = (title: string, score: number, x: number, y: number, w: number) => {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, w, 38, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(title, x + 8, y + 12);
      doc.setFontSize(22);
      if (score >= 90) doc.setTextColor(22, 163, 74);
      else if (score >= 70) doc.setTextColor(202, 138, 4);
      else doc.setTextColor(220, 38, 38);
      doc.text(`${score}/100`, x + 8, y + 30);
    };

    const cardY = 116;
    const cw = (pageWidth - 60) / 4;
    drawCard('RENDIMIENTO', scores.performance, 20, cardY, cw);
    drawCard('SEGURIDAD', scores.security, 25 + cw, cardY, cw);
    drawCard('ACCESIBILIDAD', scores.accessibility, 30 + cw * 2, cardY, cw);
    drawCard('SEO', scores.seo, 35 + cw * 3, cardY, cw);

    // --- Hallazgos (errores y warnings) ---
    let findY = 164;
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('Hallazgos Destacados', 20, findY);
    findY += 8;

    const importantFindings = findings.filter(f => f.type === 'error' || f.type === 'warning');

    for (const finding of importantFindings.slice(0, 12)) {
      if (findY > 265) {
        doc.addPage();
        findY = 20;
      }

      const icon = finding.type === 'error' ? '✗' : '⚠';
      doc.setFontSize(8);
      
      if (finding.type === 'error') {
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setTextColor(202, 138, 4);
      }
      doc.text(icon, 22, findY);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(8);
      const findingText = doc.splitTextToSize(`[${finding.category.toUpperCase()}] ${finding.text}`, pageWidth - 50);
      doc.text(findingText, 28, findY);
      
      findY += findingText.length * 4 + 4;
    }

    // --- Footer ---
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    const footer = `Generado por SentinelIQ © ${new Date().getFullYear()} — Escaneo real de cabeceras HTTP, SEO y accesibilidad`;
    const footerWidth = doc.getTextWidth(footer);
    doc.text(footer, (pageWidth - footerWidth) / 2, 285);

    // Generate PDF buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sentineliq-report-${normalizedUrl}.pdf"`,
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
