#!/usr/bin/env python3
"""Tiny local HTTP server for manually testing the extension.

Serves a trivial page while sending an X-Powered-By (or Server) header that
claims to be a chosen PHP version, so you can watch the extension's badge
react without needing a real PHP install.

Usage:
    python3 test/serve.py --version 8.1.10
    python3 test/serve.py --version 8.3.40 --header server
    python3 test/serve.py --version 7.4.1 --port 8765
"""
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer


def make_handler(version: str, header_name: str):
    class Handler(BaseHTTPRequestHandler):
        def _respond(self):
            body = (
                f"<html><body><h1>php2shell-checker extension test page</h1>"
                f"<p>Sending {header_name}: PHP/{version}</p></body></html>"
            ).encode("utf-8")
            self.send_response(200)
            if header_name == "server":
                self.send_header("Server", f"nginx/1.18.0 PHP/{version}")
            else:
                self.send_header("Server", "nginx/1.18.0")
                self.send_header("X-Powered-By", f"PHP/{version}")
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self._respond()

        def do_HEAD(self):
            self.send_response(200)
            if header_name == "server":
                self.send_header("Server", f"nginx/1.18.0 PHP/{version}")
            else:
                self.send_header("Server", "nginx/1.18.0")
                self.send_header("X-Powered-By", f"PHP/{version}")
            self.end_headers()

        def log_message(self, fmt, *args):
            pass  # keep test output quiet

    return Handler


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="8.1.10", help="PHP version string to advertise")
    ap.add_argument("--header", choices=["x-powered-by", "server"], default="x-powered-by")
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args()

    handler = make_handler(args.version, args.header)
    httpd = HTTPServer(("127.0.0.1", args.port), handler)
    print(f"serving on http://127.0.0.1:{args.port}  ({args.header}: PHP/{args.version})")
    print("Ctrl-C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
