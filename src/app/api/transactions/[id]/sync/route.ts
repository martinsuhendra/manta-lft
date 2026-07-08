import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/generated/prisma";
import { MidtransAPIError } from "@/lib/midtrans/errors";
import { syncTransactionFromMidtrans } from "@/lib/midtrans/webhook-service";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.user.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await syncTransactionFromMidtrans(id);

    return NextResponse.json({
      success: true,
      status: result.status,
      changed: result.changed,
    });
  } catch (error) {
    console.error("Failed to sync transaction:", error);

    if (error instanceof MidtransAPIError) {
      return NextResponse.json({ error: "Failed to verify payment status" }, { status: 502 });
    }

    return NextResponse.json({ error: "Failed to sync transaction" }, { status: 500 });
  }
}
