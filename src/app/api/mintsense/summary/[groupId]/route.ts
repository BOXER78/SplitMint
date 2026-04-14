import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "../../../../../lib/auth";
import { computeGroupBalances, computeGroupStats } from "../../../../../lib/balance-engine";
import { query, queryOne, execute } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [Number(groupId)], auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const group = await queryOne("SELECT name FROM groups WHERE id = ?", [Number(groupId)]) as { name: string };
  const { settlements, netBalances } = await computeGroupBalances(Number(groupId));
  const { totalSpent, memberContributions } = await computeGroupStats(Number(groupId));

  const settlementsText = settlements.length === 0
    ? "Everyone is settled up."
    : settlements.map((s) => `${s.fromUserName} owes ${s.toUserName} ₹${s.amount}`).join(", ");

  const contributionsText = memberContributions
    .map((m) => `${m.name} paid ₹${m.paid}`)
    .join(", ");

  const prompt = `Generate a friendly, concise human-readable summary for the expense group "${group.name}".
Total spent: ₹${totalSpent}
Contributions: ${contributionsText}
Settlements needed: ${settlementsText}
Current user: ${auth.name}

Write 2-3 sentences in a friendly tone. Mention the user by name. Use ₹ for amounts. Be specific.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    
    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("MintSense summary error:", error);
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
