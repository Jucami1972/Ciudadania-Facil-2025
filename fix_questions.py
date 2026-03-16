import sys

filepath = r'c:\Users\prjcc\Downloads\CDF2025\Ciudadania-Facil-2025\src\data\questions.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines before: {len(lines)}")

# 0-indexed:
# Line 1216 -> index 1215
# Line 1411 -> index 1410
# We want to remove index 1215 to 1411 (inclusive of 1410)
# So slice: lines[:1215] + lines[1411:]

# Verify content at boundaries
print(f"Line 1215 (to keep): {lines[1214].strip()}") # Line 1215
print(f"Line 1216 (to remove): {lines[1215].strip()}") # Line 1216
print(f"Line 1411 (to remove): {lines[1410].strip()}") # Line 1411
print(f"Line 1412 (to keep): {lines[1411].strip()}") # Line 1412

if '100' in lines[1412]: 
    print("Found '100' on line 1413! Proceeding.")

new_lines = lines[:1215] + lines[1411:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Total lines after: {len(new_lines)}")
print("Fix applied successfully.")
