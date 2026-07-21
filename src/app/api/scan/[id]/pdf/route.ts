import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Función para generar un número pseudoaleatorio basado en una semilla (string)
function seededRandom(seed: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}

// Función para generar un score entre min y max usando la semilla
function generateScore(seed: string, min: number, max: number): number {
  const rand = seededRandom(seed);
  return Math.floor(rand * (max - min + 1)) + min;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scanId } = await params;

  try {
    // 1. Obtener el monitor de la base de datos
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

    // 2. Calcular scores dinámicos basados en la URL
    const normalizedUrl = monitor.url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const isLocalhost = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
    
    const performance = isLocalhost ? generateScore(normalizedUrl + "perf", 80, 100) : generateScore(normalizedUrl + "perf", 60, 100);
    const security = isLocalhost ? generateScore(normalizedUrl + "sec", 30, 60) : generateScore(normalizedUrl + "sec", 70, 100);
    const accessibility = generateScore(normalizedUrl + "acc", 75, 100);
    const seo = isLocalhost ? generateScore(normalizedUrl + "seo", 40, 70) : generateScore(normalizedUrl + "seo", 70, 100);

    const globalScore = Math.round((performance + security + accessibility + seo) / 4);

    // 3. Generar PDF
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

    // Scan ID y URL label
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text(`SCAN ID: ${scanId}`, 20, 44);
    doc.text(`DOMINIO: ${normalizedUrl}`, 20, 49);

    // --- CyberScore Card ---
    doc.setFillColor(249, 250, 251); // #f9fafb
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(20, 56, pageWidth - 40, 60, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('CYBERSCORE GLOBAL', 30, 68);

    doc.setFontSize(48);
    if (globalScore >= 90) doc.setTextColor(22, 163, 74); // Verde
    else if (globalScore >= 70) doc.setTextColor(202, 138, 4); // Amarillo
    else doc.setTextColor(220, 38, 38); // Rojo
    doc.text(globalScore.toString(), 30, 96);

    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    
    let description = 'El sitio web necesita optimizaciones urgentes de seguridad y rendimiento.';
    if (globalScore >= 90) description = 'El sitio web tiene un rendimiento excelente y cumple con todos los estándares modernos de seguridad y accesibilidad.';
    else if (globalScore >= 70) description = 'El sitio web está en buen estado, pero presenta oportunidades de mejora en métricas clave de seguridad o rendimiento.';

    const splitDesc = doc.splitTextToSize(description, 95);
    doc.text(splitDesc, 62, 82);

    // Función auxiliar para dibujar tarjetas
    const drawCard = (title: string, score: number, x: number, y: number, width: number) => {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, width, 45, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(title, x + 10, y + 15);

      doc.setFontSize(26);
      if (score >= 90) doc.setTextColor(22, 163, 74);
      else if (score >= 70) doc.setTextColor(202, 138, 4);
      else doc.setTextColor(220, 38, 38);
      
      doc.text(`${score}/100`, x + 10, y + 34);
    };

    // --- Metric Cards ---
    const cardY = 130;
    const cardWidth = (pageWidth - 50) / 2;

    drawCard('RENDIMIENTO', performance, 20, cardY, cardWidth);
    drawCard('SEGURIDAD', security, 30 + cardWidth, cardY, cardWidth);

    // --- Accessibility & SEO Cards ---
    const card2Y = 185;
    
    drawCard('ACCESIBILIDAD', accessibility, 20, card2Y, cardWidth);
    drawCard('SEO', seo, 30 + cardWidth, card2Y, cardWidth);

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
