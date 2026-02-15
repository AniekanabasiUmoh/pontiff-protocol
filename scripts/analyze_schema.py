import json

try:
    with open('c:/Dev/Pontiff/full_schema.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    definitions = data.get('definitions', {})
    
    print(f"Total definitions found: {len(definitions)}")
    
    tables_to_check = ['tournament_registrations', 'cardinal_memberships', 'auth_sessions', 'tournaments', 'debates']
    
    for table in tables_to_check:
        if table in definitions:
            print(f"\n--- Table: {table} ---")
            props = definitions[table].get('properties', {})
            required = definitions[table].get('required', [])
            print(f"Required columns: {required}")
            for col, details in props.items():
                col_type = details.get('type', 'unknown')
                col_format = details.get('format', '')
                description = details.get('description', '')
                is_generated = "NOTE: This is a Generated Column" in description if description else False
                print(f"  - {col}: {col_type} ({col_format}) {'[GENERATED]' if is_generated else ''}")
        else:
            print(f"\n--- Table: {table} NOT FOUND ---")

except Exception as e:
    print(f"Error: {e}")
