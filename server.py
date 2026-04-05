import http.server
import socketserver
import json
import base64
import os
import datetime

PORT = 8082
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'admin', 'uploads')

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))

                filename = ''.join(c if c.isalnum() or c in '.-_' else '_' for c in os.path.basename(payload['filename']))
                ext = os.path.splitext(filename)[1]
                save_name = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S%f')[:-4]}{ext}"
                save_path = os.path.join(UPLOAD_DIR, save_name)

                data_url = payload['data']
                base64_str = data_url.split(',')[1] if ',' in data_url else data_url
                file_bytes = base64.b64decode(base64_str)

                with open(save_path, 'wb') as f:
                    f.write(file_bytes)

                size_kb = len(file_bytes) / 1024
                print(f"  [UPLOAD] Saved: {save_name} ({size_kb:.1f} KB)")

                response_data = json.dumps({"ok": True, "url": f"/admin/uploads/{save_name}"})
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data.encode('utf-8'))
            except Exception as e:
                print(f"  [UPLOAD ERROR] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response_data = json.dumps({"ok": False, "error": str(e)})
                self.wfile.write(response_data.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

# Find existing PID on port and kill it (basic approach)
import subprocess
try:
    netstat = subprocess.check_output(f'netstat -ano | findstr :{PORT}', shell=True).decode()
    for line in netstat.splitlines():
        if 'LISTENING' in line:
            pid = line.strip().split()[-1]
            if pid != '0':
                print(f"Killing existing process on port {PORT} (PID {pid})")
                subprocess.run(['taskkill', '/F', '/PID', pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                import time; time.sleep(1)
except Exception:
    pass

import socket
hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        print("====================================================")
        print(f"  Server started!")
        print(f"  Local Access:      http://localhost:{PORT}/")
        print(f"  Network Access:    http://{local_ip}:{PORT}/")
        print(f"  Upload endpoint:   POST http://localhost:{PORT}/upload")
        print("====================================================")
        httpd.serve_forever()
except Exception as e:
    print(f"[ERROR] Server failed: {e}")
