import shutil
import os

# Absolute paths to source files (handling Korean characters via Python's UTF-8 support)
src_dir = r"C:\Users\콩새\.gemini\antigravity\brain\74c69948-1be7-4aa4-b276-98a9b16fe418"
dst_dir = r"images\icons"

mapping = {
    "meokpang_final_1776521504070.png": "meokpang_icon.png",
    "nolpang_final_1776521511204.png": "nolpang_icon.png",
    "swimpang_final_1776521561571.png": "swimpang_icon.png",
    "salpang_final_1776521568953.png": "salpang_icon.png",
    "meotpang_final_1776521661755.png": "meotpang_icon.png",
}

for src_name, dst_name in mapping.items():
    src_path = os.path.join(src_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    
    if os.path.exists(src_path):
        shutil.copy(src_path, dst_path)
        print(f"Successfully copied to {dst_path}")
    else:
        print(f"Error: Source file not found: {src_path}")
