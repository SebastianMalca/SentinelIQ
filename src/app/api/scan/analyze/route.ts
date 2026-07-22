import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scanUrl } from "@/lib/scanner";

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

    // ===== Escaneo REAL del sitio web =====
    const result = await scanUrl(url);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error analyzing URL:", error);
    return NextResponse.json({ error: "Error interno durante el análisis" }, { status: 500 });
  }
}
