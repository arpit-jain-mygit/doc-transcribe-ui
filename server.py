#!/usr/bin/env python3
import io
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_ORIGIN = os.environ.get("API_ORIGIN", "http://127.0.0.1:8080")
PORT = int(os.environ.get("PORT", "4200"))
HOST = os.environ.get("HOST", "0.0.0.0")


class AppHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization,Content-Type")
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_GET(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        self.send_error(405, "Method Not Allowed")

    def do_PUT(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        self.send_error(405, "Method Not Allowed")

    def do_PATCH(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        self.send_error(405, "Method Not Allowed")

    def do_DELETE(self):
        if self.path.startswith("/api/"):
            self._proxy()
            return
        self.send_error(405, "Method Not Allowed")

    def _proxy(self):
        upstream_path = self.path[len("/api"):]
        upstream_url = f"{API_ORIGIN}{upstream_path}"

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length) if content_length > 0 else None

        headers = {}
        for key in self.headers.keys():
            low = key.lower()
            if low in {"host", "origin", "referer", "connection", "content-length"}:
                continue
            headers[key] = self.headers.get(key)

        req = Request(upstream_url, data=body, method=self.command, headers=headers)

        try:
            with urlopen(req, timeout=60) as resp:
                payload = resp.read()
                self.send_response(resp.status)
                for key, value in resp.getheaders():
                    if key.lower() in {"content-encoding", "transfer-encoding", "connection"}:
                        continue
                    self.send_header(key, value)
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as e:
            payload = e.read()
            self.send_response(e.code)
            for key, value in e.headers.items():
                if key.lower() in {"content-encoding", "transfer-encoding", "connection"}:
                    continue
                self.send_header(key, value)
            self.end_headers()
            if payload:
                self.wfile.write(payload)
        except URLError as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            msg = {"error": "Upstream unavailable", "details": str(e)}
            self.wfile.write(json.dumps(msg).encode("utf-8"))


def main():
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Server running at http://{HOST}:{PORT} -> API_ORIGIN={API_ORIGIN}")
    server.serve_forever()


if __name__ == "__main__":
    main()
