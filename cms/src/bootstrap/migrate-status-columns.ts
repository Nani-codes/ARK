import type { Core } from '@strapi/strapi';

/**
 * Strapi 5 Content Manager reserves `status` for draft/published workflow.
 * Order/quote workflow fields were renamed to orderStatus / quoteStatus.
 */
export async function migrateStatusColumns(strapi: Core.Strapi) {
  const db = strapi.db.connection;

  const tables: Array<{
    table: string;
    legacy: string;
    column: string;
    defaultValue: string;
  }> = [
    { table: 'orders', legacy: 'status', column: 'order_status', defaultValue: 'pending' },
    {
      table: 'quote_requests',
      legacy: 'status',
      column: 'quote_status',
      defaultValue: 'new',
    },
  ];

  for (const { table, legacy, column, defaultValue } of tables) {
    const hasLegacy = await db.schema.hasColumn(table, legacy);
    const hasColumn = await db.schema.hasColumn(table, column);

    if (hasLegacy && hasColumn) {
      await db.raw(
        `UPDATE ?? SET ?? = ?? WHERE ?? IS NOT NULL AND ?? != ''`,
        [table, column, legacy, legacy, legacy]
      );
      await db.schema.table(table, (t) => {
        t.dropColumn(legacy);
      });
      strapi.log.info(`Migrated ${table}.${legacy} values into ${column}`);
    } else if (hasLegacy && !hasColumn) {
      await db.schema.table(table, (t) => {
        t.renameColumn(legacy, column);
      });
      strapi.log.info(`Renamed ${table}.${legacy} → ${column}`);
    }

    if (await db.schema.hasColumn(table, column)) {
      const updated = await db(table).whereNull(column).update({ [column]: defaultValue });
      if (updated > 0) {
        strapi.log.info(`Backfilled ${updated} ${table} rows with default ${column}=${defaultValue}`);
      }
    }
  }
}
