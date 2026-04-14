import { getDb } from "./db";

export interface Balance {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
}

export interface NetBalance {
  userId: number;
  userName: string;
  netAmount: number; // positive = owed to this user, negative = this user owes
}

export interface Settlement {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
}

export function computeGroupBalances(groupId: number): {
  balances: Balance[];
  settlements: Settlement[];
  netBalances: NetBalance[];
} {
  const db = getDb();

  // Get all members
  const members = db
    .prepare(
      `SELECT u.id, u.name FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?`
    )
    .all(groupId) as { id: number; name: string }[];

  // Get all expenses for this group
  const expenses = db
    .prepare(`SELECT * FROM expenses WHERE group_id = ?`)
    .all(groupId) as {
    id: number;
    amount: number;
    paid_by_user_id: number;
  }[];

  // Build net balance map: net[A][B] = amount A owes B (positive = A owes B)
  const net: Record<number, Record<number, number>> = {};
  for (const m of members) {
    net[m.id] = {};
    for (const m2 of members) {
      if (m.id !== m2.id) net[m.id][m2.id] = 0;
    }
  }

  for (const expense of expenses) {
    const splits = db
      .prepare(`SELECT * FROM expense_splits WHERE expense_id = ?`)
      .all(expense.id) as { user_id: number; amount: number }[];

    const payerId = expense.paid_by_user_id;

    for (const split of splits) {
      if (split.user_id === payerId) continue;
      // split.user_id owes payerId split.amount
      if (net[split.user_id] && net[split.user_id][payerId] !== undefined) {
        net[split.user_id][payerId] += split.amount;
      }
      if (net[payerId] && net[payerId][split.user_id] !== undefined) {
        net[payerId][split.user_id] -= split.amount;
      }
    }
  }

  // Simplify: for each pair, net out
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const balances: Balance[] = [];

  const seen = new Set<string>();
  for (const a of members) {
    for (const b of members) {
      if (a.id === b.id) continue;
      const key = [a.id, b.id].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);

      const aOwesB = (net[a.id]?.[b.id] ?? 0) - (net[b.id]?.[a.id] ?? 0);
      if (Math.abs(aOwesB) < 0.01) continue;

      if (aOwesB > 0) {
        balances.push({
          fromUserId: a.id,
          fromUserName: memberMap[a.id],
          toUserId: b.id,
          toUserName: memberMap[b.id],
          amount: Math.round(aOwesB * 100) / 100,
        });
      } else {
        balances.push({
          fromUserId: b.id,
          fromUserName: memberMap[b.id],
          toUserId: a.id,
          toUserName: memberMap[a.id],
          amount: Math.round(-aOwesB * 100) / 100,
        });
      }
    }
  }

  // Compute net balances per person
  const netBalances: NetBalance[] = members.map((m) => {
    let netAmount = 0;
    for (const other of members) {
      if (other.id === m.id) continue;
      netAmount += (net[other.id]?.[m.id] ?? 0); // others owe me
      netAmount -= (net[m.id]?.[other.id] ?? 0); // I owe others
    }
    return {
      userId: m.id,
      userName: m.name,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  });

  // Minimal settlements (greedy debt simplification)
  const settlements = simplifyDebts(netBalances, memberMap);

  return { balances, settlements, netBalances };
}

function simplifyDebts(
  netBalances: NetBalance[],
  memberMap: Record<number, string>
): Settlement[] {
  const debtors = netBalances
    .filter((b) => b.netAmount < -0.01)
    .map((b) => ({ ...b, amount: -b.netAmount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = netBalances
    .filter((b) => b.netAmount > 0.01)
    .map((b) => ({ ...b, amount: b.netAmount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

export function computeGroupStats(groupId: number) {
  const db = getDb();
  const result = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE group_id = ?`)
    .get(groupId) as { total: number };

  const memberContributions = db
    .prepare(
      `SELECT u.id, u.name, u.avatar_color,
        COALESCE(SUM(e.amount), 0) as paid
       FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       LEFT JOIN expenses e ON e.paid_by_user_id = u.id AND e.group_id = ?
       WHERE gm.group_id = ?
       GROUP BY u.id`
    )
    .all(groupId, groupId) as {
    id: number;
    name: string;
    avatar_color: string;
    paid: number;
  }[];

  return {
    totalSpent: result.total,
    memberContributions,
  };
}
