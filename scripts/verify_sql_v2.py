import json
import re
import sys

# Load Schema
schema_path = "c:\\Dev\\Pontiff\\final_schema_check_v2.json"
sql_path = "c:\\Dev\\Pontiff\\docs\\audit\\FIX_FINAL_4.sql"

print(f"Loading schema from {schema_path}...")
try:
    with open(schema_path, 'r', encoding='utf-8') as f:
        # Check for empty file
        content = f.read()
        if not content:
            print("Error: Schema file is empty.")
            sys.exit(1)
            
        data = json.load(f)
        
    definitions = data.get('definitions', {})
    tables = {}
    for table_name, table_def in definitions.items():
        props = table_def.get('properties', {})
        tables[table_name] = set(props.keys())
        
    print(f"Loaded {len(tables)} tables.")

    # Parse SQL
    print(f"Parsing SQL from {sql_path}...")
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Regex for INSERT INTO
    insert_pattern = re.compile(r'INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)', re.IGNORECASE | re.MULTILINE)
    
    inserts = []
    for match in insert_pattern.finditer(sql_content):
        table = match.group(1)
        columns = [c.strip().replace('"', '') for c in match.group(2).split(',')]
        inserts.append({'table': table, 'columns': columns})

    print(f"Found {len(inserts)} INSERT statements.")
    
    errors = []
    warnings = []
    
    for op in inserts:
        table = op['table']
        if table == 'matches' and 'CREATE TABLE IF NOT EXISTS matches' in sql_content:
             warnings.append(f"Table '{table}' might not exist in schema, but script creates it.")
             continue
             
        if table not in tables:
            errors.append(f"Table '{table}' does not exist in schema.")
            continue
            
        valid_cols = tables[table]
        for col in op['columns']:
            if col not in valid_cols:
                errors.append(f"Column '{col}' not found in table '{table}'.")

    if warnings:
        for w in warnings:
            print(f"WARNING: {w}")

    if errors:
        print("\nERRORS FOUND:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nSUCCESS: SQL script is compatible.")
        sys.exit(0)

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
