import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getAuthUser } from "../../../../../lib/auth";
import { computeGroupBalances, computeGroupStats } from "../../../../../lib/balance-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const groupId = Number(id);
    
    // Check membership
    const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, auth.userId]);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Compute data
    const { balances, settlements, netBalances } = await computeGroupBalances(groupId);
    const { totalSpent, memberContributions } = await computeGroupStats(groupId);

    return NextResponse.json({
      balances,
      settlements,
      netBalances,
      totalSpent,
      memberContributions,
    });
  } catch (err: any) {
    console.error("Balances API Error:", err);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
