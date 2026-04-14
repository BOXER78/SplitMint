import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db";
import { getAuthUser } from "../../../../lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const expense = await query(`SELECT e.*, u.name as paid_by_name FROM expenses e
       JOIN users u ON e.paid_by_user_id = u.id WHERE e.id = ?`
    )
    .get(Number(id)) as any;

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [expense.group_id, auth.userId]);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const splits = await queryOne(`SELECT es.*, u.name as user_name, u.avatar_color
       FROM expense_splits es JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = ?`, [Number(id]));

  return NextResponse.json({ expense: { ...expense, splits } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await execute("SELECT * FROM expenses WHERE id = ?", [Number(id])) as any;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [existing.group_id, auth.userId]);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { amount, description, date, paidByUserId, splitMode, splits } = await req.json();

  db.transaction(() => {
    await queryOne("UPDATE expenses SET amount = ?, description = ?, date = ?, paid_by_user_id = ?, split_mode = ? WHERE id = ?", [Number(amount]), description, date, Number(paidByUserId), splitMode, Number(id));

    await execute("DELETE FROM expense_splits WHERE expense_id = ?", [Number(id]));

    for (const split of splits) {
      await execute("INSERT INTO expense_splits (expense_id, user_id, amount, percentage) VALUES (?, ?, ?, ?)", [Number(id]), Number(split.userId), Number(split.amount), split.percentage ?? null);
    }
  })();

  const updated = await execute("SELECT * FROM expenses WHERE id = ?", [Number(id]));
  return NextResponse.json({ expense: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const expense = await queryOne("SELECT * FROM expenses WHERE id = ?", [Number(id])) as any;
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await queryOne("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?", [expense.group_id, auth.userId]);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  db.prepare("DELETE FROM expenses WHERE id = ?", [Number(id]));
  return NextResponse.json({ success: true });
}
