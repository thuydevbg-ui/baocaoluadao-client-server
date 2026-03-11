// Export D1 local database to SQL
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function exportDatabase() {
  const dbPath = path.resolve(__dirname, '../workers/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/349d2e0bd5160995d6fac73864a7aac6d84fe6526ae4d5305ba651dec92525ed.sqlite');
  
  console.log('Reading from:', dbPath);
  
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);
  
  // Get all tables
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  console.log('Tables found:', tablesResult);
  
  let output = '-- D1 Database Export\n-- Generated from local D1\n\n';
  
  if (tablesResult.length === 0) {
    console.log('No tables found!');
    output += '-- No tables in database\n';
  } else {
    for (const tableResult of tablesResult) {
      const tableName = tableResult.values[0][0];
      // Validate table name to prevent SQL injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        console.error(`Invalid table name: ${tableName}`);
        continue;
      }
      
      console.log(`Exporting table: ${tableName}`);
      
      // Use parameterized query approach - validate and escape
      const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      
      // Get create table statement
      const createStmt = db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${safeTableName}'`);
      if (createStmt.length > 0 && createStmt[0].values.length > 0) {
        output += `-- Table: ${tableName}\n`;
        output += createStmt[0].values[0][0] + ';\n\n';
      }
      
      // Get all data - use validated table name
      try {
        const data = db.exec(`SELECT * FROM ${safeTableName}`);
        if (data.length > 0) {
          const columns = data[0].columns;
          const values = data[0].values;
          
          for (const row of values) {
            const colValues = row.map((val, idx) => {
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return `'${String(val)}'`;
            });
            
            output += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${colValues.join(', ')});\n`;
          }
          output += '\n';
        }
      } catch (e) {
        console.error(`Error exporting ${tableName}:`, e.message);
      }
    }
  }
  
  // Write to file
  fs.writeFileSync('workers/d1_full_export.sql', output);
  console.log('Exported to workers/d1_full_export.sql');
  console.log('File size:', output.length, 'bytes');
  
  db.close();
}

exportDatabase().catch(console.error);
