import os, time, hashlib
from web3 import Web3
import requests

L1_WS      = os.getenv("L1_WS", "ws://localhost:8546")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 10))
NODE_URL   = f"http://localhost:{os.getenv('NODE_PORT', '5000')}/mine"

w3 = Web3(Web3.WebsocketProvider(L1_WS))

def get_block_hashes(start, end):
    return [w3.eth.get_block(i).hash.hex() for i in range(start, end+1)]

def merkle_root(leaves):
    def _hash(a, b): return hashlib.sha256((a+b).encode()).hexdigest()
    layer = leaves
    while len(layer) > 1:
        layer = [
            _hash(layer[i], layer[i+1] if i+1 < len(layer) else layer[i])
            for i in range(0, len(layer), 2)
        ]
    return layer[0]

def relay():
    last = w3.eth.block_number - (w3.eth.block_number % BATCH_SIZE)
    while True:
        latest = w3.eth.block_number
        if latest >= last + BATCH_SIZE:
            start, end = last+1, last+BATCH_SIZE
            root = merkle_root(get_block_hashes(start, end))
            payload = {"data": {"l1_start": start, "l1_end": end, "merkle_root": root}}
            try:
                r = requests.post(NODE_URL, json=payload)
                print(f"Relayed L2 block {start}–{end}, status {r.status_code}")
            except Exception as e:
                print("Relay error:", e)
            last += BATCH_SIZE
        time.sleep(5)

if __name__ == "__main__":
    relay()
