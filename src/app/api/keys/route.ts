import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name } = await req.json();
    const userId = session.user.id;
    
    // Generar llave de prueba pseudoaleatoria
    const rawKey = `sk_test_${crypto.randomBytes(24).toString('hex')}`;
    
    const newKey = await prisma.apiKey.create({
      data: {
        name: name || 'Nueva API Key',
        key: rawKey,
        userId
      }
    });

    return NextResponse.json(newKey, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const userId = session.user.id;

    if (!id) return NextResponse.json({ error: "Missing key ID" }, { status: 400 });

    await prisma.apiKey.delete({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}
