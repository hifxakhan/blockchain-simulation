const SHA256 = require('crypto-js/sha256');

class Block {

    constructor(version, transactions, prevBlock, bits, nonce) {
        this.version = version;
        this.prevBlock = prevBlock;
        this.transactions = transactions || [];
        this.merkleRoot = this.calculateMerkleRoot();
        this.timestamp = Date.now();
        this.bits = bits;
        this.nonce = nonce;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.version.toString(16).padStart(8, '0') +
            this.prevBlock +
            this.merkleRoot +
            Math.floor(this.timestamp / 1000).toString(16).padStart(8, '0') +
            this.bits.toString(16).padStart(8, '0') +
            this.nonce.toString(16).padStart(8, '0')).toString();
    }

    calculateMerkleRoot() {

        if (this.transactions.length === 0) {
            return SHA256(SHA256("0")).toString();
        }

        let leaves = this.transactions.map(tx => {
            const txString = JSON.stringify(tx);
            return SHA256(txString).toString();
        });

        let powerOf2 = 1
        while (powerOf2 < leaves.length) {
            powerOf2 *= 2;
        }

        if (powerOf2 != leaves.length) {
            let duplicate = leaves[leaves.length - 1];
            let NumDuplicate = powerOf2 - leaves.length;

            for (let i = 0; i < NumDuplicate; i++) {
                leaves.push(duplicate);
            }

        }

        let currentLevel = leaves;
        while (currentLevel.length > 1) {
            let nextLevel = [];

            for (let i = 0; i < currentLevel.length; i += 2) {
                const combined = currentLevel[i] + currentLevel[i + 1];
                const parentHash = SHA256(SHA256(combined)).toString();
                nextLevel.push(parentHash);
            }

            if (nextLevel.length > 1 && nextLevel.length % 2 !== 0) {
                nextLevel.push(nextLevel[nextLevel.length - 1]);
            }

            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }

    display() {
    return {
        hash: this.hash.substring(0, 20) + '...',
        transactions: this.transactions.length,
        timestamp: new Date(this.timestamp).toLocaleString(),
        nonce: this.nonce
    };
}

}

module.exports = Block; 