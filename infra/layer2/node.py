from flask import Flask, request, jsonify
from blockchain import Blockchain, Block
import time, os

app = Flask(__name__)
chain = Blockchain()

@app.route('/chain', methods=['GET'])
def get_chain():
    return jsonify([b.__dict__ for b in chain.chain]), 200

@app.route('/mine', methods=['POST'])
def mine():
    payload = request.get_json().get('data')
    new_block = Block(
        index=chain.last_block.index + 1,
        timestamp=time.time(),
        data=payload,
        previous_hash=chain.last_block.hash
    )
    chain.add_block(new_block)
    return jsonify(new_block.__dict__), 201

if __name__ == '__main__':
    port = int(os.getenv("NODE_PORT", 5000))
    app.run(host='0.0.0.0', port=port)
