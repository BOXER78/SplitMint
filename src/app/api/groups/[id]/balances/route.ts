import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { getAuthUser } from "../../../../../lib/auth";
import { computeGroupBalances, computeGroupStats } from "../../../../../lib/balance-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const groupId = Number(id);
  const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, auth.userId]);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { balances, settlements, netBalances } = await computeGroupBalances(groupId);
  const { totalSpent, memberContributions } = await computeGroupStats(groupId);

  return NextResponse.json({
    balances,
    settlements,
    netBalances,
    totalSpent,
    memberContributions,
  });
}
