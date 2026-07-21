import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar Header de Autorización
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API Key' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar en Base de Datos
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: token },
      include: { user: true }
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // 3. Obtener URL a escanear del body
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Bad Request: Missing url in body' }, { status: 400 });
    }

    // 4. Simulación del escaneo 
    const cyberScore = Math.floor(Math.random() * 40) + 60; 
    
    return NextResponse.json({
      success: true,
      data: {
        url,
        status: cyberScore >= 80 ? 'healthy' : 'warning',
        cyberScore,
        metrics: {
          performance: Math.floor(Math.random() * 20) + 80,
          security: cyberScore,
          accessibility: Math.floor(Math.random() * 10) + 90,
          seo: Math.floor(Math.random() * 20) + 80,
        },
        scannedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error en public API scan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
