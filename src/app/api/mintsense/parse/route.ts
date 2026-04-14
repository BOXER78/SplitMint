import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "../../../../lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, groupId } = await req.json();
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const db = getDb();
  const members = db
    .prepare(
      `SELECT u.id, u.name FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?`
    )
    .all(Number(groupId)) as { id: number; name: string }[];

  const today = new Date().toISOString().split("T")[0];
  const membersList = members.map((m) => `${m.name} (id: ${m.id})`).join(", ");

  const systemPrompt = `You are an expense parsing assistant for SplitMint, an expense splitting app.
Parse natural language expense descriptions and return structured JSON data.
Today's date is ${today}.
Group members: ${membersList}
Current user: ${auth.name} (id: ${auth.userId})

Return ONLY valid JSON with this exact structure:
{
  "amount": number,
  "description": string,
  "date": "YYYY-MM-DD",
  "paidByUserId": number,
  "splitMode": "equal" | "custom" | "percentage",
  "participants": [{"userId": number, "name": string}],
  "confidence": "high" | "medium" | "low",
  "note": "brief explanation of parsing"
}

Rules:
- If payer not specified, assume current user
- If participants not specified for equal split, include all group members
- Date defaults to today if not mentioned
- For "split equally" → splitMode: "equal"
- For specific amounts → splitMode: "custom"  
- For percentages → splitMode: "percentage"`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("MintSense parse error:", error);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
