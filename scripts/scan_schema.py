import sys

filename = "c:\\Dev\\Pontiff\\final_schema_check.json"
targets = ["competitor_agents", "debates", "tournaments"]

print(f"Scanning {filename}...")
try:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"File Size: {len(content)} bytes")
        
        for t in targets:
            if t in content:
                print(f"FOUND: {t}")
                # Try to extract nearby context (simple slice)
                idx = content.find(t)
                start = max(0, idx - 100)
                end = min(len(content), idx + 500)
                print(f"CONTEXT: {content[start:end]}")
            else:
                print(f"MISSING: {t}")

except Exception as e:
    print(f"Error reading file: {e}")
