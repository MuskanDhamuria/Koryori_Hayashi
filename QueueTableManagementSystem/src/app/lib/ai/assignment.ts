export type AssignmentResult<PartyId extends string | number, TableId extends string | number> = {
  assignment: Map<PartyId, TableId>;
  totalScore: number;
};

export function greedyAssignment<PartyId extends string | number, TableId extends string | number>(
  parties: { id: PartyId }[],
  tables: { id: TableId }[],
  scoreFn: (partyIndex: number, tableIndex: number) => number | null,
): AssignmentResult<PartyId, TableId> {
  const assignment = new Map<PartyId, TableId>();
  const used = new Set<number>();
  let totalScore = 0;

  for (let p = 0; p < parties.length; p++) {
    let bestTable = -1;
    let bestScore = -Infinity;

    for (let t = 0; t < tables.length; t++) {
      if (used.has(t)) continue;
      const score = scoreFn(p, t);
      if (score == null) continue;
      if (score > bestScore) {
        bestScore = score;
        bestTable = t;
      }
    }

    if (bestTable !== -1) {
      used.add(bestTable);
      assignment.set(parties[p].id, tables[bestTable].id);
      totalScore += bestScore;
    }
  }

  return { assignment, totalScore };
}

// Exact maximum-weight assignment via DP over table subsets.
// Allows skipping a party (score 0) when there are more parties than tables.
export function optimalAssignment<PartyId extends string | number, TableId extends string | number>(
  parties: { id: PartyId }[],
  tables: { id: TableId }[],
  scoreFn: (partyIndex: number, tableIndex: number) => number | null,
): AssignmentResult<PartyId, TableId> {
  const m = tables.length;
  const maxMask = 1 << m;

  type Back = { prevMask: number; assignedTable: number | null };
  let dp = new Array<number>(maxMask).fill(-Infinity);
  let back: Back[][] = [];
  dp[0] = 0;

  for (let p = 0; p < parties.length; p++) {
    const next = new Array<number>(maxMask).fill(-Infinity);
    const nextBack = new Array<Back>(maxMask);

    for (let mask = 0; mask < maxMask; mask++) {
      if (dp[mask] === -Infinity) continue;

      // Option 1: skip this party.
      if (dp[mask] > next[mask]) {
        next[mask] = dp[mask];
        nextBack[mask] = { prevMask: mask, assignedTable: null };
      }

      // Option 2: assign to an unused table.
      for (let t = 0; t < m; t++) {
        if (mask & (1 << t)) continue;
        const score = scoreFn(p, t);
        if (score == null) continue;
        const nextMask = mask | (1 << t);
        const value = dp[mask] + score;
        if (value > next[nextMask]) {
          next[nextMask] = value;
          nextBack[nextMask] = { prevMask: mask, assignedTable: t };
        }
      }
    }

    dp = next;
    back.push(nextBack);
  }

  // Pick best mask.
  let bestMask = 0;
  let bestScore = -Infinity;
  for (let mask = 0; mask < maxMask; mask++) {
    if (dp[mask] > bestScore) {
      bestScore = dp[mask];
      bestMask = mask;
    }
  }

  // Reconstruct.
  const assignment = new Map<PartyId, TableId>();
  let mask = bestMask;
  for (let p = parties.length - 1; p >= 0; p--) {
    const choice = back[p][mask];
    if (!choice) break;
    if (choice.assignedTable != null) {
      assignment.set(parties[p].id, tables[choice.assignedTable].id);
    }
    mask = choice.prevMask;
  }

  return { assignment, totalScore: bestScore === -Infinity ? 0 : bestScore };
}

