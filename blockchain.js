const Block = require('./block.js');
const Transaction = require('./transaction.js');
const SHA256 = require('crypto-js/sha256');

class blockChain {
    constructor() {
        this.chain = [];
        this.blocks = new Map();
        this.difficulty = 0x1d00ffff;
        this.pendingTransactions = [];
        this.miningReward = 12.5;

        this.createGenesisBlock();
    }

    createGenesisBlock() {
        if (this.chain.length === null) {
            return "Genesis Block has Already been created";
        }

        const genesisTransactions = [
            new Transaction(
                null,
                '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                50
            )
        ];

        const genesisBlock = new Block(
            1,
            genesisTransactions,
            '0'.repeat(64),
            this.difficulty,
            2083236893
        );

        const genesisHash = SHA256(genesisBlock);
        this.chain.push([
            genesisBlock.hash,
            genesisBlock.prevBlock,
            genesisBlock
        ]);
        this.blocks.set(genesisBlock.hash, genesisBlock);
    }

    getLatestBlock() {
        if (this.chain.length === 0) return null;
        return this.chain[this.chain.length - 1][2];
    }

    getBlock(index) {
        if (index < 0 || index >= this.chain.length) return null;
        return this.chain[index][2];
    }

    getBlockByHash(hash) {
        return this.blocks.get(hash) || null;
    }

    addBlock(transactions, nonce) {
        const previousBlock = this.getLatestBlock();
        if (!previousBlock) {
            console.log('No previous block found');
            return null;
        }

        console.log(`\n=== Adding New Block ===`);
        console.log(`Previous block hash: ${previousBlock.hash.substring(0, 20)}...`);
        console.log(`Transactions to include: ${transactions.length}`);

        transactions.forEach((tx, i) => {
            console.log(`  TX ${i}: ${tx.fromAddress || 'COINBASE'} -> ${tx.toAddress} ${tx.amount} BTC`);
        });

        const newBlock = new Block(
            1,
            transactions,
            previousBlock.hash,
            this.difficulty,
            nonce
        );

        this.chain.push([
            newBlock.hash,
            newBlock.prevBlock,
            newBlock
        ]);

        this.blocks.set(newBlock.hash, newBlock);

        console.log(`Block added at index ${this.chain.length - 1}`);
        console.log(`Block hash: ${newBlock.hash.substring(0, 20)}...`);
        console.log(`Block contains ${newBlock.transactions.length} transactions`);

        return newBlock;
    }

    minePendingTransactions(miningRewardAddress) {
        console.log(`\n=== Mining Block ===`);
        console.log(`Miner: ${miningRewardAddress}`);
        console.log(`Pending transactions: ${this.pendingTransactions.length}`);

        if (this.pendingTransactions.length === 0) {
            console.log('No transactions to mine!');
            return null;
        }

        const coinbaseTx = new Transaction(
            null,
            miningRewardAddress,
            this.miningReward
        );

        console.log(`Coinbase transaction created: ${coinbaseTx.amount} BTC to ${miningRewardAddress}`);

        const blockTransactions = [coinbaseTx, ...this.pendingTransactions];
        console.log(`Total transactions in block: ${blockTransactions.length}`);

        const newBlock = this.addBlock(
            blockTransactions,
            Math.floor(Math.random() * 1000000)
        );

        if (newBlock) {
            console.log(`Block mined successfully!`);
            console.log(`Block hash: ${newBlock.hash.substring(0, 20)}...`);
            console.log(`Transactions included: ${newBlock.transactions.length}`);

            // Clear pending transactions
            this.pendingTransactions = [];
            console.log(`Pending transactions cleared`);

            console.log(`${this.miningReward} BTC rewarded to ${miningRewardAddress}`);
            return newBlock;
        } else {
            console.log('Failed to add block');
            return null;
        }
    }

    isChainValid() {
        console.log('\nValidating blockchain...');

        for (let i = 0; i < this.chain.length; i++) {
            const [currentHash, prevHash, block] = this.chain[i];

            if (currentHash !== block.hash) {
                console.log(`Stored hash mismatch at index ${i}`);
                return false;
            }

            if (block.hash !== block.calculateHash()) {
                console.log(`Block ${i} hash is invalid`);
                return false;
            }

            if (i > 0) {
                const [prevChainHash] = this.chain[i - 1];
                if (prevHash !== prevChainHash) {
                    console.log(`Previous hash link broken at index ${i}`);
                    return false;
                }
            }
        }

        return true;
    }

    getAllBlocks() {
        return this.chain.map(([hash, prevHash, block], index) => {
            // Debug: Log what's in each block
            console.log(`Block ${index}: ${block.transactions.length} transactions`);

            return {
                index,
                hash: hash.substring(0, 20) + '...',
                prevHash: prevHash ? prevHash.substring(0, 10) + '...' : 'GENESIS',
                transactions: block.transactions.length,  // This should show actual count
                timestamp: new Date(block.timestamp).toLocaleString(),
                actualTransactions: block.transactions.map(tx => ({
                    from: tx.fromAddress || 'COINBASE',
                    to: tx.toAddress,
                    amount: tx.amount
                }))
            };
        });
    }

    getChainLength() {
        return this.chain.length;
    }

    getPendingTransactions() {
        return this.pendingTransactions; // Return the array, not length
    }

    getBalance(address) {
        let balance = 0;
        console.log(`\n=== Calculating balance for ${address} ===`);

        for (const [, , block] of this.chain) {
            console.log(`Checking block with ${block.transactions.length} transactions`);

            for (const tx of block.transactions) {
                console.log(`TX: ${tx.fromAddress || 'COINBASE'} -> ${tx.toAddress} ${tx.amount}`);

                // Add if received
                if (tx.toAddress === address) {
                    balance += tx.amount;
                    console.log(`  +${tx.amount} (received)`);
                }

                // Subtract if sent (and not coinbase)
                if (tx.fromAddress === address && !tx.isCoinbase) {
                    balance -= tx.amount;
                    console.log(`  -${tx.amount} (sent)`);
                }
            }
        }

        console.log(`Final balance for ${address}: ${balance}`);
        return balance;
    }

    createTransaction(transaction) {
        if (transaction.isValid()) {
            this.pendingTransactions.push(transaction);
            console.log(`Transaction added: ${transaction.txid.substring(0, 10)}...`);
            return true;
        }
        return false;
    }
}

module.exports = blockChain;