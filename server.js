const express = require('express');
const Blockchain = require('./blockchain.js');
const Transaction = require('./transaction.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const blockchain = new Blockchain();

// Debug endpoint
app.get('/api/debug', (req, res) => {
    res.json({
        chainLength: blockchain.getChainLength(),
        pendingTxCount: blockchain.pendingTransactions.length,
        blocks: blockchain.getAllBlocks(),
        chainValid: blockchain.isChainValid()
    });
});

// Get pending transactions
app.get('/api/pending-transactions', (req, res) => {
    res.json({
        pendingTransactions: blockchain.pendingTransactions.map(tx => tx.display()),
        count: blockchain.pendingTransactions.length
    });
});

app.get('/api/blockchain', (req, res) => {
    res.json({
        blocks: blockchain.getAllBlocks(),
        chainLength: blockchain.getChainLength(),
        pendingTransactions: blockchain.pendingTransactions.length,
        isValid: blockchain.isChainValid()
    });
});

app.get('/api/block/:index', (req, res) => {
    const block = blockchain.getBlock(parseInt(req.params.index));
    if (block) {
        res.json(block.display());
    } else {
        res.status(404).json({ error: 'Block not found' });
    }
});

app.post('/api/transaction', (req, res) => {
    const { from, to, amount } = req.body;

    console.log(`\n=== Creating Transaction ===`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Amount: ${amount}`);

    try {
        const tx = new Transaction(from, to, parseFloat(amount));
        console.log('Transaction created, checking validity...');

        if (tx.isValid()) {
            console.log('Transaction is valid');
            blockchain.pendingTransactions.push(tx);
            console.log(`Added to pending transactions. Total pending: ${blockchain.pendingTransactions.length}`);

            res.json({
                success: true,
                message: 'Transaction added to mempool',
                transaction: tx.display(),
                pendingCount: blockchain.pendingTransactions.length
            });
        } else {
            console.log('Transaction is invalid');
            res.status(400).json({
                success: false,
                message: 'Transaction is invalid'
            });
        }
    } catch (error) {
        console.error('Transaction creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/mine', (req, res) => {
    const { minerAddress } = req.body;

    console.log(`\n=== Mining Block ===`);
    console.log(`Miner: ${minerAddress}`);
    console.log(`Pending transactions: ${blockchain.pendingTransactions.length}`);

    try {
        if (blockchain.pendingTransactions.length === 0) {
            console.log('No pending transactions to mine');
            res.status(400).json({
                success: false,
                message: 'No pending transactions to mine'
            });
            return;
        }

        const newBlock = blockchain.minePendingTransactions(minerAddress);

        console.log(`Block mined! Hash: ${newBlock.hash.substring(0, 20)}...`);
        console.log(`Transactions in block: ${newBlock.transactions.length}`);

        res.json({
            success: true,
            message: 'Block mined successfully',
            block: newBlock.display(),
            reward: blockchain.miningReward
        });
    } catch (error) {
        console.error('Mining error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/validate', (req, res) => {
    const isValid = blockchain.isChainValid();
    res.json({
        valid: isValid,
        message: isValid ? 'Blockchain is valid' : 'Blockchain is invalid'
    });
});

app.post('/api/tamper', (req, res) => {
    const { blockIndex, transactionIndex } = req.body;

    if (blockIndex >= 0 && transactionIndex >= 0) {
        const block = blockchain.getBlock(blockIndex);
        if (block && block.transactions[transactionIndex]) {
            const original = block.transactions[transactionIndex].amount;
            block.transactions[transactionIndex].amount = original * 100;

            block.hash = block.calculateHash();

            res.json({
                success: true,
                message: `Tampered with block ${blockIndex}, transaction ${transactionIndex}`,
                originalAmount: original,
                newAmount: block.transactions[transactionIndex].amount
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Block or transaction not found'
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid block or transaction index'
        });
    }
});

app.get('/api/balance/:address', (req, res) => {
    const balance = blockchain.getBalance(req.params.address);
    console.log(`Checking balance for ${req.params.address}: ${balance}`);
    res.json({
        address: req.params.address,
        balance: balance
    });
});

app.get('/api/blocks-debug', (req, res) => {
    const blocksInfo = blockchain.chain.map(([hash, prevHash, block], index) => {
        return {
            index,
            hash: hash.substring(0, 20) + '...',
            prevHash: prevHash ? prevHash.substring(0, 10) + '...' : 'GENESIS',
            transactionCount: block.transactions.length,
            transactions: block.transactions.map(tx => ({
                from: tx.fromAddress || 'COINBASE',
                to: tx.toAddress,
                amount: tx.amount,
                isCoinbase: tx.isCoinbase
            }))
        };
    });

    res.json({
        totalBlocks: blockchain.chain.length,
        blocks: blocksInfo
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Blockchain server running at http://localhost:${port}`);
    console.log(`📚 API Endpoints:`);
    console.log(`   GET  /api/blockchain - Get blockchain info`);
    console.log(`   GET  /api/debug - Debug info`);
    console.log(`   GET  /api/pending-transactions - Get pending transactions`);
    console.log(`   POST /api/transaction - Add new transaction`);
    console.log(`   POST /api/mine - Mine pending transactions`);
    console.log(`   GET  /api/validate - Validate blockchain`);
    console.log(`   POST /api/tamper - Tamper with block (demo)`);
    console.log(`   GET  /api/balance/:address - Check balance`);
});