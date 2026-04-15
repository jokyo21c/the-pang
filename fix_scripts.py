import re

path = r'C:\Users\콩새\.gemini\antigravity\scratch\the-pang\index.html'
with open(path, encoding='utf-8') as f:
    content = f.read()

# Remove the duplicate script block
lines = content.splitlines(keepends=True)
# Find the second occurrence of "-- Scripts --"
idx_all = [i for i, l in enumerate(lines) if '── Scripts ──' in l]
print(f"Script markers at lines: {[i+1 for i in idx_all]}")

if len(idx_all) >= 2:
    # Remove from second marker to </html>
    cut_from = idx_all[1]  # 0-indexed line of second marker
    # keep everything up to (not including) second marker + trailing newline
    new_lines = lines[:cut_from]
    # Make sure file ends with </body></html>
    # Check if </body> and </html> are already before cut_from
    tail = ''.join(lines[:cut_from])
    if '</body>' not in tail:
        new_lines.append('</body>\n')
    if '</html>' not in tail:
        new_lines.append('</html>\n')
    new_content = ''.join(new_lines)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done. File now has {new_content.count(chr(10))} lines.")
else:
    print("Only one script marker found, nothing to remove.")
