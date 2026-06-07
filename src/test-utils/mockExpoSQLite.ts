type Row = Record<string, any>;

class InMemoryDB {
  tables = new Map<string, Row[]>();

  execAsync(sql: string): Promise<void> {
    const regex = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(sql)) !== null) {
      const name = match[1];
      if (!this.tables.has(name)) {
        this.tables.set(name, []);
      }
    }
    return Promise.resolve();
  }

  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    sql = sql.trim();

    const insertOrReplaceMatch = sql.match(
      /^INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i
    );
    if (insertOrReplaceMatch) {
      return Promise.resolve(this.handleInsert(insertOrReplaceMatch[1], insertOrReplaceMatch[2], insertOrReplaceMatch[3], params, true));
    }

    const insertMatch = sql.match(
      /^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i
    );
    if (insertMatch) {
      return Promise.resolve(this.handleInsert(insertMatch[1], insertMatch[2], insertMatch[3], params, false));
    }

    const updateMatch = sql.match(/^UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+)$/i);
    if (updateMatch) {
      return Promise.resolve(this.handleUpdate(updateMatch[1], updateMatch[2], updateMatch[3], params));
    }

    const deleteMatch = sql.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+([\s\S]+)$/i);
    if (deleteMatch) {
      return Promise.resolve(this.handleDelete(deleteMatch[1], deleteMatch[2], params));
    }

    throw new Error(`Unsupported SQL in runAsync: ${sql}`);
  }

  private handleInsert(
    tableName: string,
    colsStr: string,
    valsStr: string,
    params: any[] = [],
    replace: boolean
  ): { lastInsertRowId: number; changes: number } {
    const cols = colsStr.split(",").map((c) => c.trim());
    const vals = valsStr.split(",").map((v) => v.trim());
    const row: Row = {};
    let p = 0;
    for (let i = 0; i < cols.length; i++) {
      const v = vals[i];
      if (v === "?") {
        row[cols[i]] = params[p++];
      } else if (v === "NULL" || v === "null") {
        row[cols[i]] = null;
      } else if (v?.startsWith("'") && v?.endsWith("'")) {
        row[cols[i]] = v.slice(1, -1);
      } else if (v !== undefined) {
        const num = Number(v);
        row[cols[i]] = isNaN(num) ? v : num;
      }
    }

    const table = this.getTable(tableName);
    if (replace) {
      const pk = cols[0];
      const idx = table.findIndex((r) => r[pk] == row[pk]);
      if (idx >= 0) {
        table[idx] = row;
      } else {
        table.push(row);
      }
    } else {
      table.push(row);
    }

    return { lastInsertRowId: 0, changes: 1 };
  }

  private handleUpdate(
    tableName: string,
    setStr: string,
    whereStr: string,
    params: any[] = []
  ): { lastInsertRowId: number; changes: number } {
    const table = this.getTable(tableName);
    const setPairs = this.splitSetClause(setStr);
    const where = this.parseWhere(whereStr);

    let p = 0;
    const setValues: Row = {};
    for (const pair of setPairs) {
      const m = pair.match(/^(\w+)\s*=\s*(.+)$/);
      if (!m) continue;
      const col = m[1];
      const valStr = m[2].trim();
      if (valStr === "?") {
        setValues[col] = params[p++];
      } else if (valStr === "NULL" || valStr === "null") {
        setValues[col] = null;
      } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
        setValues[col] = valStr.slice(1, -1);
      } else {
        const num = Number(valStr);
        setValues[col] = isNaN(num) ? valStr : num;
      }
    }

    const whereValues: Row = {};
    for (const [col, valStr] of Object.entries(where)) {
      if (valStr === "?") {
        whereValues[col] = params[p++];
      } else if (valStr === "NULL" || valStr === "null") {
        whereValues[col] = null;
      } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
        whereValues[col] = valStr.slice(1, -1);
      } else {
        const num = Number(valStr);
        whereValues[col] = isNaN(num) ? valStr : num;
      }
    }

    let changes = 0;
    for (const row of table) {
      if (this.matchWhere(row, whereValues)) {
        Object.assign(row, setValues);
        changes++;
      }
    }
    return { lastInsertRowId: 0, changes };
  }

  private handleDelete(
    tableName: string,
    whereStr: string,
    params: any[] = []
  ): { lastInsertRowId: number; changes: number } {
    const table = this.getTable(tableName);
    const where = this.parseWhere(whereStr);
    const whereValues: Row = {};
    let p = 0;
    for (const [col, valStr] of Object.entries(where)) {
      if (valStr === "?") {
        whereValues[col] = params[p++];
      } else if (valStr === "NULL" || valStr === "null") {
        whereValues[col] = null;
      } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
        whereValues[col] = valStr.slice(1, -1);
      } else {
        const num = Number(valStr);
        whereValues[col] = isNaN(num) ? valStr : num;
      }
    }

    const originalLen = table.length;
    const newTable = table.filter((row) => !this.matchWhere(row, whereValues));
    this.tables.set(tableName, newTable);
    return { lastInsertRowId: 0, changes: originalLen - newTable.length };
  }

  getAllAsync(sql: string, params?: any[]): Promise<Row[]> {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (!fromMatch) throw new Error(`Unsupported SELECT: ${sql}`);
    const tableName = fromMatch[1];
    let rows = [...this.getTable(tableName)];

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s*$)/i);
    if (whereMatch) {
      const where = this.parseWhere(whereMatch[1]);
      const whereValues: Row = {};
      let p = 0;
      for (const [col, valStr] of Object.entries(where)) {
        if (valStr === "?") {
          whereValues[col] = params?.[p++];
        } else if (valStr === "NULL" || valStr === "null") {
          whereValues[col] = null;
        } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
          whereValues[col] = valStr.slice(1, -1);
        } else {
          const num = Number(valStr);
          whereValues[col] = isNaN(num) ? valStr : num;
        }
      }
      rows = rows.filter((r) => this.matchWhere(r, whereValues));
    }

    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = (orderMatch[2] || "ASC").toUpperCase();
      rows.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return dir === "ASC" ? 1 : -1;
        if (bv == null) return dir === "ASC" ? -1 : 1;
        if (av < bv) return dir === "ASC" ? -1 : 1;
        if (av > bv) return dir === "ASC" ? 1 : -1;
        return 0;
      });
    }

    return Promise.resolve(rows);
  }

  getFirstAsync(sql: string, params?: any[]): Promise<Row | null> {
    return this.getAllAsync(sql, params).then((rows) => rows[0] || null);
  }

  withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    return fn();
  }

  private getTable(name: string): Row[] {
    if (!this.tables.has(name)) {
      this.tables.set(name, []);
    }
    return this.tables.get(name)!;
  }

  private splitSetClause(setStr: string): string[] {
    const parts: string[] = [];
    let current = "";
    let inString = false;
    for (const char of setStr) {
      if (char === "'") inString = !inString;
      if (char === "," && !inString) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  private parseWhere(whereStr: string): Record<string, string> {
    const conditions = whereStr.split(/\s+AND\s+/i);
    const result: Record<string, string> = {};
    for (const cond of conditions) {
      const match = cond.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2].trim();
      }
    }
    return result;
  }

  private matchWhere(row: Row, where: Row): boolean {
    for (const [col, val] of Object.entries(where)) {
      if (row[col] != val) return false;
    }
    return true;
  }
}

export async function openDatabaseAsync(_name: string): Promise<any> {
  return new InMemoryDB();
}

export type SQLiteDatabase = any;
