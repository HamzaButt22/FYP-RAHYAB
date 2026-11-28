import http.server, os, sys
root = sys.argv[1]; port = int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
    def log_message(self, *a): pass
    def send_head(self):
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(path): self.path = '/index.html'
        return super().send_head()
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
