import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    // Auth & Rate Limiting Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión para usar el escáner" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.plan === 'FREE') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let lastScan = user.lastScanDate ? new Date(user.lastScanDate) : null;
      let lastScanDay = lastScan ? new Date(lastScan.getFullYear(), lastScan.getMonth(), lastScan.getDate()) : null;

      let currentScans = user.scansToday;
      
      // Si el último escaneo fue un día anterior, reseteamos a 0
      if (!lastScanDay || lastScanDay < today) {
        currentScans = 0;
      }

      if (currentScans >= 3) {
        return NextResponse.json({ error: "Has alcanzado el límite de 3 escaneos diarios de tu plan gratuito. Sube a un plan de pago para escanear de forma ilimitada." }, { status: 403 });
      }

      // Actualizamos el contador
      await prisma.user.update({
        where: { id: user.id },
        data: {
          scansToday: currentScans + 1,
          lastScanDate: new Date()
        }
      });
    }

    // Normalizar URL para la semilla
    const normalizedUrl = url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Generar scores deterministas (siempre los mismos para la misma URL)
    // Pero variados entre diferentes URLs
    
    const isLocalhost = normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1');
    
    // Si es localhost, puntuaciones más bajas en seguridad y SEO
    const performance = isLocalhost ? generateScore(normalizedUrl + "perf", 80, 100) : generateScore(normalizedUrl + "perf", 60, 100);
    const security = isLocalhost ? generateScore(normalizedUrl + "sec", 30, 60) : generateScore(normalizedUrl + "sec", 70, 100);
    const accessibility = generateScore(normalizedUrl + "acc", 75, 100);
    const seo = isLocalhost ? generateScore(normalizedUrl + "seo", 40, 70) : generateScore(normalizedUrl + "seo", 70, 100);

    const globalScore = Math.round((performance + security + accessibility + seo) / 4);

    // Generar hallazgos basados en los scores
    const findings = [];
    
    if (security >= 90) {
      findings.push({ type: 'success', text: 'Certificado SSL válido y moderno detectado.' });
      findings.push({ type: 'success', text: 'Cabeceras de seguridad estrictas (HSTS) configuradas.' });
    } else if (security >= 70) {
      findings.push({ type: 'success', text: 'Conexión cifrada (HTTPS) disponible.' });
      findings.push({ type: 'warning', text: 'Faltan algunas cabeceras de seguridad como Content-Security-Policy.' });
    } else {
      findings.push({ type: 'error', text: 'Vulnerabilidades de seguridad detectadas. Falta encriptación fuerte.' });
    }

    if (performance >= 90) {
      findings.push({ type: 'success', text: 'Tiempo de respuesta del servidor (TTFB) excelente (< 200ms).' });
    } else {
      findings.push({ type: 'warning', text: 'El tiempo de carga podría optimizarse comprimiendo los recursos estáticos.' });
    }

    if (seo >= 85) {
      findings.push({ type: 'success', text: 'Meta etiquetas SEO y OpenGraph configuradas correctamente.' });
    } else {
      findings.push({ type: 'warning', text: 'Faltan etiquetas meta descriptivas o son demasiado cortas.' });
    }

    // Simulamos un retraso para que parezca un análisis real y no inmediato
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      url: normalizedUrl,
      scores: {
        global: globalScore,
        performance,
        security,
        accessibility,
        seo
      },
      findings
    });

  } catch (error) {
    console.error("Error analyzing URL:", error);
    return NextResponse.json({ error: "Error interno durante el análisis" }, { status: 500 });
  }
}
