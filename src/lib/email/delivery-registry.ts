// Adaptateur volontairement réduit : testable sur PostgreSQL local et
// utilisable dans une transaction Prisma sans exposer le registre au client.
export interface RegistryTransaction {
  query<T>(sql: string, params: unknown[]): Promise<{ rows: T[] }>;
}
export interface RegistryDatabase {
  transaction<T>(work: (tx: RegistryTransaction) => Promise<T>): Promise<T>;
}

export async function deliverOnce(db: RegistryDatabase, request: {
  deliveryKey: string;
  recipientKey: string;
  kind: string;
  eligible: () => Promise<boolean>;
  send: () => Promise<boolean>;
}): Promise<"SENT" | "SKIPPED" | "UNCERTAIN"> {
  const { deliveryKey, recipientKey, kind } = request;
  if (!(await reserveDelivery(db, deliveryKey, recipientKey, kind))) return "SKIPPED";
  try {
    // Recontrôler après réservation : la liste du cron peut être ancienne.
    if (!(await request.eligible())) {
      await finishDelivery(db, deliveryKey, recipientKey, "SUPPRESSED");
      return "SKIPPED";
    }
    const sent = await request.send();
    const recorded = await finishDelivery(db, deliveryKey, recipientKey, sent ? "SENT" : "UNCERTAIN");
    return sent && recorded ? "SENT" : "UNCERTAIN";
  } catch (error) {
    // L'échec peut survenir après acceptation par le fournisseur. Ne pas
    // libérer la réservation ni réessayer automatiquement.
    await finishDelivery(db, deliveryKey, recipientKey, "UNCERTAIN").catch(() => undefined);
    throw error;
  }
}

export async function reserveDelivery(db: RegistryDatabase, deliveryKey: string, recipientKey: string, kind: string): Promise<boolean> {
  return db.transaction(async tx => {
    await tx.query(`INSERT INTO email_recipient_gates ("recipientKey") VALUES ($1) ON CONFLICT DO NOTHING`, [recipientKey]);
    const gate = await tx.query<{ activeDeliveryKey: string | null; ready: boolean }>(
      `SELECT "activeDeliveryKey", ("nextAllowedAt" IS NULL OR "nextAllowedAt" <= CURRENT_TIMESTAMP) AS ready
       FROM email_recipient_gates WHERE "recipientKey"=$1 FOR UPDATE`, [recipientKey]);
    if (!gate.rows[0]?.ready || gate.rows[0].activeDeliveryKey) return false;
    const created = await tx.query<{ deliveryKey: string }>(
      `INSERT INTO email_deliveries ("deliveryKey", "recipientKey", kind) VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING RETURNING "deliveryKey"`, [deliveryKey,recipientKey,kind]);
    if (!created.rows.length) return false;
    await tx.query(`UPDATE email_recipient_gates SET "activeDeliveryKey"=$2,"updatedAt"=CURRENT_TIMESTAMP WHERE "recipientKey"=$1`, [recipientKey,deliveryKey]);
    return true;
  });
}

// Un résultat incertain conserve la réservation. Aucun retry aveugle ne
// peut alors doubler un email accepté avant une coupure réseau.
export async function finishDelivery(db: RegistryDatabase, deliveryKey: string, recipientKey: string,
  outcome: "SENT" | "UNCERTAIN" | "SUPPRESSED", cooldownHours = 48): Promise<boolean> {
  if (!Number.isFinite(cooldownHours) || cooldownHours < 0) throw new Error("Invalid cooldown");
  return db.transaction(async tx => {
    const gate = await tx.query<{ activeDeliveryKey: string | null }>(
      `SELECT "activeDeliveryKey" FROM email_recipient_gates WHERE "recipientKey"=$1 FOR UPDATE`, [recipientKey]);
    if (gate.rows[0]?.activeDeliveryKey !== deliveryKey) return false;
    const changed = await tx.query<{ deliveryKey: string }>(
      `UPDATE email_deliveries SET state=$3,"updatedAt"=CURRENT_TIMESTAMP,
       "sentAt"=CASE WHEN $3='SENT' THEN CURRENT_TIMESTAMP ELSE "sentAt" END
       WHERE "deliveryKey"=$1 AND "recipientKey"=$2 AND state='RESERVED' RETURNING "deliveryKey"`,
      [deliveryKey,recipientKey,outcome]);
    if (!changed.rows.length) return false;
    if (outcome !== "UNCERTAIN") {
      await tx.query(`UPDATE email_recipient_gates SET "activeDeliveryKey"=NULL,
        "nextAllowedAt"=CASE WHEN $2='SENT' THEN CURRENT_TIMESTAMP + ($3 * INTERVAL '1 hour') ELSE "nextAllowedAt" END,
        "updatedAt"=CURRENT_TIMESTAMP WHERE "recipientKey"=$1`, [recipientKey,outcome,cooldownHours]);
    }
    return true;
  });
}
