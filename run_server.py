#!/usr/bin/env python
import sys
import traceback

def puts(s):
    sys.stdout.write("%s\n" % s)

try:
    import optparse
    import SimpleHTTPServer
    import SocketServer
except ImportError:
    traceback.print_exc()
    puts('-' * 80)
    puts('Python 2.4 or greater is required.')
    puts('-' * 80)
    sys.exit(1)


class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({'.webapp': 'application/x-web-app-manifest+json'})


if __name__ == '__main__':
    op = optparse.OptionParser(usage='%prog [options]')
    op.add_option('-H', '--host', help='Host to bind webserver. Default: %default',
                  default='0.0.0.0')
    op.add_option('-p', '--port', help='Port to bind webserver. Default: %default',
                  default=9100)
    (options, args) = op.parse_args()
    httpd = SocketServer.TCPServer((options.host, options.port), Handler)
    puts("Manifest URL: http://%s:%s/manifest.webapp" % (options.host, options.port))
    puts("Serving app at http://%s:%s/" % (options.host, options.port))
    httpd.serve_forever()
