import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { getAuthUser } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const search = searchParams.get("search") || "";
  const participantId = searchParams.get("participantId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const amountMin = searchParams.get("amountMin");
  const amountMax = searchParams.get("amountMax");

  const db = getDb();

  // Verify user is in group if groupId provided
  if (groupId) {
    const isMember = db
      .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
      .get(Number(groupId), auth.userId);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = `
    SELECT e.*, 
      u.name as paid_by_name, u.avatar_color as paid_by_color,
      g.name as group_name
    FROM expenses e
    JOIN users u ON e.paid_by_user_id = u.id
    JOIN groups g ON e.group_id = g.id
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `;
  const queryParams: (string | number)[] = [auth.userId];

  if (groupId) {
    query += ` AND e.group_id = ?`;
    queryParams.push(Number(groupId));
  }
  if (search) {
    query += ` AND e.description LIKE ?`;
    queryParams.push(`%${search}%`);
  }
  if (participantId) {
    query += ` AND EXISTS (SELECT 1 FROM expense_splits es WHERE es.expense_id = e.id AND es.user_id = ?)`;
    queryParams.push(Number(participantId));
  }
  if (dateFrom) {
    query += ` AND e.date >= ?`;
    queryParams.push(dateFrom);
  }
  if (dateTo) {
    query += ` AND e.date <= ?`;
    queryParams.push(dateTo);
  }
  if (amountMin) {
    query += ` AND e.amount >= ?`;
    queryParams.push(Number(amountMin));
  }
  if (amountMax) {
    query += ` AND e.amount <= ?`;
    queryParams.push(Number(amountMax));
  }

  query += ` GROUP BY e.id ORDER BY e.date DESC, e.created_at DESC`;

  const expenses = db.prepare(query).all(...queryParams);

  // Attach splits
  const expensesWithSplits = (expenses as any[]).map((exp) => {
    const splits = db
      .prepare(
        `SELECT es.*, u.name as user_name, u.avatar_color
         FROM expense_splits es JOIN users u ON es.user_id = u.id
         WHERE es.expense_id = ?`
      )
      .all(exp.id);
    return { ...exp, splits };
  });

  return NextResponse.json({ expenses: expensesWithSplits });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId, amount, description, date, paidByUserId, splitMode, splits } = await req.json();

  if (!groupId || !amount || !description || !date || !paidByUserId || !splitMode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();

  const isMember = db
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
    .get(Number(groupId), auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Validate splits total
  const splitTotal = splits.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
  if (Math.abs(splitTotal - Number(amount)) > 0.5) {
    return NextResponse.json({ error: "Split amounts must sum to total" }, { status: 400 });
  }

  const result = db.transaction(() => {
    const r = db
      .prepare(
        "INSERT INTO expenses (group_id, amount, description, date, paid_by_user_id, split_mode) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(Number(groupId), Number(amount), description, date, Number(paidByUserId), splitMode);

    const expenseId = Number(r.lastInsertRowid);

    for (const split of splits) {
      db.prepare(
        "INSERT INTO expense_splits (expense_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)"
      ).run(expenseId, Number(split.userId), Number(split.amount), split.percentage ?? null);
    }

    return expenseId;
  })();

  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result);
  return NextResponse.json({ expense }, { status: 201 });
}
