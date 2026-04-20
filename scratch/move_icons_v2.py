import os
import shutil

# Use environment variable to avoid encoding issues with the username
user_profile = os.environ.get('USERPROFILE')
brain_dir = os.path.join(user_profile, '.gemini', 'antigravity', 'brain', '74c69948-1be7-4aa4-b276-98a9b16fe418')
dst_dir = r"images\icons"

mapping = {
    "meokpang_final_1776521504070.png": "meokpang_icon.png",
    "nolpang_final_1776521511204.png": "nolpang_icon.png",
    "swimpang_final_1776521561571.png": "swimpang_icon.png",
    "salpang_final_1776521568953.png": "salpang_icon.png",
    "meotpang_final_1776521661755.png": "meotpang_icon.png",
}

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

for src_name, dst_name in mapping.items():
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(dst_dir, dst_name)
    
    if os.path.exists(src_path):
        shutil.copy(src_path, dst_path)
        print(f"Successfully copied {dst_name}")
    else:
        # Check if file exists without absolute path if brain_dir check fails
        print(f"Error: {src_path} not found")
