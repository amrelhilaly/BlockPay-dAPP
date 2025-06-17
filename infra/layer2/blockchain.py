import hashlib, json, time

class Block:
    def __init__(self, index, timestamp, data, previous_hash, nonce=0):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.compute_hash()

    def compute_hash(self):
        return hashlib.sha256(
            json.dumps(self.__dict__, sort_keys=True).encode()
        ).hexdigest()

class Blockchain:
    difficulty = 4

    def __init__(self):
        self.chain = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis = Block(0, time.time(), "Genesis", "0")
        self.chain.append(self.proof_of_work(genesis))

    def proof_of_work(self, block):
        block.nonce = 0
        computed = block.compute_hash()
        while not computed.startswith('0' * Blockchain.difficulty):
            block.nonce += 1
            computed = block.compute_hash()
        block.hash = computed
        return block

    @property
    def last_block(self):
        return self.chain[-1]

    def add_block(self, block):
        block.previous_hash = self.last_block.hash
        self.chain.append(self.proof_of_work(block))
