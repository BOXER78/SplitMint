import { NextRequest, NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getAuthUser } from "../../../../lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const expense = db
    .prepare(
      `SELECT e.*, u.name as paid_by_name FROM expenses e
       JOIN users u ON e.paid_by_user_id = u.id WHERE e.id = ?`
    )
    .get(Number(id)) as any;

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = db
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
    .get(expense.group_id, auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const splits = db
    .prepare(
      `SELECT es.*, u.name as user_name, u.avatar_color
       FROM expense_splits es JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = ?`
    )
    .all(Number(id));

  return NextResponse.json({ expense: { ...expense, splits } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(Number(id)) as any;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = db
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
    .get(existing.group_id, auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { amount, description, date, paidByUserId, splitMode, splits } = await req.json();

  db.transaction(() => {
    db.prepare(
      "UPDATE expenses SET amount = ?, description = ?, date = ?, paid_by_user_id = ?, split_mode = ? WHERE id = ?"
    ).run(Number(amount), description, date, Number(paidByUserId), splitMode, Number(id));

    db.prepare("DELETE FROM expense_splits WHERE expense_id = ?").run(Number(id));

    for (const split of splits) {
      db.prepare(
        "INSERT INTO expense_splits (expense_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)"
      ).run(Number(id), Number(split.userId), Number(split.amount), split.percentage ?? null);
    }
  })();

  const updated = db.prepare("SELECT * FROM expenses WHERE id = ?").get(Number(id));
  return NextResponse.json({ expense: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(Number(id)) as any;
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = db
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?")
    .get(expense.group_id, auth.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  db.prepare("DELETE FROM expenses WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
