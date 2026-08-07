#!/usr/bin/env python3
"""Write the status JSON the website reads.

Runs on the box itself, on a timer, and drops a small JSON file into the web
root. The page fetches it same-origin.

Doing it here rather than from the visitor's browser is deliberate: the servers
only listen on the box's own address, and BrickSMP is an external server on a
lobby network whose rules forbid advertising a direct join address. Nothing in
the output names a host or a port, only whether something is up.
"""

import json, os, socket, struct, sys, time

OUT = sys.argv[1] if len(sys.argv) > 1 else "/var/www/brickworks/status.json"
HOST = "51.83.6.164"          # servers bind the public address, not loopback
TIMEOUT = 4

# haproxy_protocol is on for the proxy, so a bare TCP connection is dropped.
# Everything else takes a plain connection.
TARGETS = [
    ("proxy",    "Network proxy", 25568, True),
    ("limbo",    "Limbo",         25592, False),
    ("bricksmp", "BrickSMP",      25661, False),
]


def _varint(n):
    out = b""
    while True:
        b = n & 0x7F
        n >>= 7
        out += bytes([b | 0x80]) if n else bytes([b])
        if not n:
            return out


def ping(port, proxy_protocol=False):
    """Minecraft server list ping. Returns the status dict, or raises."""
    s = socket.create_connection((HOST, port), TIMEOUT)
    s.settimeout(TIMEOUT)
    try:
        if proxy_protocol:
            # PROXY protocol v1 header, else Velocity drops us without a word.
            s.sendall(f"PROXY TCP4 127.0.0.1 {HOST} 65535 {port}\r\n".encode())
        handshake = (b"\x00" + _varint(770) + _varint(len(HOST)) + HOST.encode()
                     + struct.pack(">H", port) + _varint(1))
        s.sendall(_varint(len(handshake)) + handshake)
        s.sendall(_varint(1) + b"\x00")

        def read_varint():
            n = shift = 0
            while True:
                d = s.recv(1)
                if not d:
                    raise EOFError("connection closed")
                n |= (d[0] & 0x7F) << shift
                if not d[0] & 0x80:
                    return n
                shift += 7

        read_varint()            # packet length
        read_varint()            # packet id
        length = read_varint()
        buf = b""
        while len(buf) < length:
            chunk = s.recv(length - len(buf))
            if not chunk:
                raise EOFError("truncated status")
            buf += chunk
        return json.loads(buf.decode("utf-8"))
    finally:
        s.close()


def host_stats():
    with open("/proc/loadavg") as f:
        load1 = float(f.read().split()[0])
    mem = {}
    with open("/proc/meminfo") as f:
        for line in f:
            k, v = line.split(":", 1)
            mem[k] = int(v.split()[0])
    with open("/proc/uptime") as f:
        uptime = float(f.read().split()[0])
    st = os.statvfs("/")
    used = (st.f_blocks - st.f_bfree) / st.f_blocks * 100

    total, avail = mem["MemTotal"], mem.get("MemAvailable", mem["MemFree"])
    return {
        "id": "host", "name": "Main box", "up": True,
        "cpu": round(min(load1 / (os.cpu_count() or 1) * 100, 100), 1),
        "memory": round((total - avail) / total * 100, 1),
        "disk": round(used, 1),
        "uptime_days": int(uptime // 86400),
    }


def main():
    services = []
    for sid, name, port, proxied in TARGETS:
        entry = {"id": sid, "name": name}
        try:
            data = ping(port, proxied)
            players = data.get("players") or {}
            entry["up"] = True
            online, cap = players.get("online"), players.get("max")
            if isinstance(online, int) and online >= 0:
                entry["players"] = online
            # limbo reports max -1; a negative cap is not a real number to show
            if isinstance(cap, int) and cap > 0:
                entry["max"] = cap
        except Exception:
            entry["up"] = False
        services.append(entry)

    try:
        services.append(host_stats())
    except Exception:
        services.append({"id": "host", "name": "Main box", "up": False})

    payload = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": services,
    }

    # Write through a temp file so the site never reads a half-written status.
    tmp = OUT + ".tmp"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(tmp, "w") as f:
        json.dump(payload, f)
    os.replace(tmp, OUT)
    os.chmod(OUT, 0o644)
    print(json.dumps(payload))


if __name__ == "__main__":
    main()
