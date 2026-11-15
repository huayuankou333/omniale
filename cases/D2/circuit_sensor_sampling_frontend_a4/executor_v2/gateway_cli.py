#!/usr/bin/python3
"""Transparent batch-ngspice transport. No testbench or circuit is generated here."""
import base64
import json
import os
from pathlib import Path
import socket
import sys

def main():
    argv = sys.argv[1:]
    if any(a in ('-v', '--version') for a in argv):
        request = {'op': 'version'}
    else:
        if '-b' not in argv and '--batch' not in argv:
            raise ValueError('Use batch mode: ngspice -b your_testbench.spi')
        value_flags = {'-o', '--output', '-r', '--rawfile'}
        decks = []
        skip = False
        for a in argv:
            if skip:
                skip = False
            elif a in value_flags:
                skip = True
            elif not a.startswith('-'):
                decks.append(a)
        if len(decks) != 1:
            raise ValueError('Specify exactly one batch testbench file')
        deck = Path(decks[0]).resolve()
        request = {'op': 'simulate', 'argv': argv, 'cwd': os.getcwd(),
                   'deck_path': str(deck),
                   'deck_base64': base64.b64encode(deck.read_bytes()).decode()}
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as conn:
        conn.connect('/run/sim-gateway/broker.sock')
        conn.sendall(json.dumps(request).encode() + b'\n')
        conn.shutdown(socket.SHUT_WR)
        raw = bytearray()
        while data := conn.recv(65536):
            raw.extend(data)
    answer = json.loads(raw)
    sys.stdout.write(answer.get('stdout', ''))
    sys.stderr.write(answer.get('stderr', ''))
    return answer.get('exit_code', 1)

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        print('Simulation gateway: ' + str(exc), file=sys.stderr)
        raise SystemExit(2)
