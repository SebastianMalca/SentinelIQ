import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function GET(request: Request) {
  // Proteger el endpoint en producción asegurando que viene de Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar todos los monitores pendientes
    const monitors = await prisma.monitor.findMany({
      include: {
        user: true, 
      }
    });

    const results = [];

    for (const monitor of monitors) {
      // 1. Simulación del escaneo 
      const cyberScore = Math.floor(Math.random() * 40) + 60; // Random score 60-100
      const threshold = 80;

      // 2. Comparar el CyberScore y enviar alerta si cae
      if (cyberScore < threshold) {
        if (monitor.user?.email) {
          await getResend().emails.send({
            from: 'SentinelIQ Alertas <onboarding@resend.dev>', // Email de prueba de Resend
            to: monitor.user.email,
            subject: `🚨 Alerta SentinelIQ: CiberScore bajo para ${monitor.url}`,
            html: `
              <h2>Alerta de Monitoreo</h2>
              <p>Tu sitio <strong>${monitor.url}</strong> ha registrado un CyberScore de <strong style="color:red;">${cyberScore}/100</strong>, lo cual está por debajo del umbral recomendado.</p>
              <p>Por favor, revisa tu reporte detallado ingresando al dashboard de SentinelIQ para solucionar los problemas de rendimiento o seguridad.</p>
            `
          });
        }
      }
      
      results.push({ id: monitor.id, url: monitor.url, score: cyberScore });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error('Error en el cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
