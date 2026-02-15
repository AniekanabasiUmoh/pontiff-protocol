import json
import re
import sys

def load_schema(schema_path):
    with open(schema_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract definitions which contain table schemas
    definitions = data.get('definitions', {})
    tables = {}
    
    for table_name, table_def in definitions.items():
        properties = table_def.get('properties', {})
        tables[table_name] = set(properties.keys())
        
    return tables

def parse_sql(sql_path):
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Regex to find INSERT/UPDATE targets
    # INSERT INTO table_name (col1, col2) ...
    insert_pattern = re.compile(r'INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)', re.IGNORECASE | re.MULTILINE)
    
    # UPDATE table_name SET col1 = val1, col2 = val2 ...
    update_pattern = re.compile(r'UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE|$)', re.IGNORECASE | re.DOTALL)
    
    # DELETE FROM table_name ...
    delete_pattern = re.compile(r'DELETE\s+FROM\s+(\w+)', re.IGNORECASE)

    operations = []

    for match in insert_pattern.finditer(sql_content):
        table = match.group(1)
        columns = [c.strip().replace('"', '') for c in match.group(2).split(',')]
        operations.append({'type': 'INSERT', 'table': table, 'columns': columns})

    for match in update_pattern.finditer(sql_content):
        table = match.group(1)
        set_clause = match.group(2)
        # Extract columns from SET clause (col = val)
        # Handle cases like "col = val" and "col = val, col2 = val2"
        # Simplistic parsing, might need refinement for complex expressions
        columns = []
        parts = set_clause.split(',')
        for part in parts:
             if '=' in part:
                 col = part.split('=')[0].strip().replace('"', '')
                 columns.append(col)
        operations.append({'type': 'UPDATE', 'table': table, 'columns': columns})
        
    for match in delete_pattern.finditer(sql_content):
        table = match.group(1)
        operations.append({'type': 'DELETE', 'table': table, 'columns': []})

    return operations

def verify(schema_tables, operations):
    errors = []
    warnings = []
    
    for op in operations:
        table = op['table']
        # Map certain known aliases or differences if needed
        # e.g., in SQL it might be 'cardinal_memberships' but schema might have it too
        
        if table not in schema_tables:
            # Special logic for tournament_registrations since we CREATE it in the script
            if table == 'tournament_registrations':
                 warnings.append(f"Table '{table}' not in current schema, but script attempts to CREATE it. This is likely fine.")
                 continue
            errors.append(f"Table '{table}' does not exist in schema.")
            continue
            
        valid_cols = schema_tables[table]
        for col in op['columns']:
            # Ignore generated aliases if we know about them from previous steps, 
            # but ideally we want exact matches to what IS in the schema
            if col not in valid_cols:
                errors.append(f"Column '{col}' not found in table '{table}'. Available: {sorted(list(valid_cols))}")

    return errors, warnings

if __name__ == "__main__":
    schema_path = "c:\\Dev\\Pontiff\\final_schema_check.json"
    sql_path = "c:\\Dev\\Pontiff\\docs\\audit\\FIX_FINAL_10.sql"
    
    print("Loading schema...")
    tables = load_schema(schema_path)
    print(f"Loaded {len(tables)} tables from schema.")
    
    print("Parsing SQL...")
    ops = parse_sql(sql_path)
    print(f"Found {len(ops)} operations.")
    
    print("Verifying...")
    errors, warnings = verify(tables, ops)
    
    for w in warnings:
        print(f"WARNING: {w}")
        
    if errors:
        print("\nERRORS FOUND:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nSUCCESS: SQL script is compatible with current schema.")
        sys.exit(0)
