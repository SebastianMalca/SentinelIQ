import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, frequency } = await req.json();
    const userId = session.user.id; 

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    if (user.plan === 'FREE') {
      const monitorCount = await prisma.monitor.count({ where: { userId } });
      if (monitorCount >= 1) {
        return NextResponse.json({ error: "Has alcanzado el límite de 1 monitor en tu plan gratuito. Sube a un plan de pago para agregar más." }, { status: 403 });
      }
    }

    const monitor = await prisma.monitor.create({
      data: {
        url,
        frequency: frequency || 'WEEKLY',
        userId: userId, 
      }
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error: any) {
    console.error("Error creating monitor:", error);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const monitors = await prisma.monitor.findMany({
      where: { userId }
    });
    return NextResponse.json(monitors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 });
  }
}
