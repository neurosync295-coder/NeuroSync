import os

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    with open('new_section.html', 'r', encoding='utf-8') as f:
        new_section = f.read()

    # Indices are 0-based.
    # Line 1996 (1-based) is index 1995. This is the start of the section to remove.
    # Line 2110 (1-based) is index 2109. This is the end of the section to remove.
    # We want to keep up to index 1995 (exclusive of 1995).
    # So lines[:1995] keeps lines 0 to 1994 (which are lines 1 to 1995 in 1-based).
    
    # We want to resume at line 2111 (1-based), which is index 2110.
    # So lines[2110:] keeps lines 2110 to end.

    new_content = "".join(lines[:1995]) + new_section + "\n" + "".join(lines[2110:])

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully updated index.html")

except Exception as e:
    print(f"Error: {e}")
