const API_BASE = 'http://localhost:3000/api';
let blockchainData = {
    blocks: [],
    pendingTransactions: 0,
    isValid: true
};

// Load blockchain on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBlockchain();
    // Auto-refresh every 5 seconds
    setInterval(loadBlockchain, 5000);
});

// Show message
function showMessage(text, type = 'success') {
    const existing = document.querySelector('.message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.className = `message message-${type}`;
    
    const icon = type === 'success' ? '✅' : 
                type === 'error' ? '❌' : '⚠️';
    
    message.innerHTML = `${icon} ${text}`;
    document.body.appendChild(message);

    setTimeout(() => {
        if (message.parentNode) {
            message.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => message.remove(), 300);
        }
    }, 4000);
}

// Load blockchain data
async function loadBlockchain() {
    try {
        const response = await fetch(`${API_BASE}/blockchain`);
        const data = await response.json();
        
        blockchainData = {
            blocks: data.blocks || [],
            pendingTransactions: data.pendingTransactions || 0,
            isValid: data.isValid
        };
        
        updateUI();
        
        // Update miner balance
        const minerAddress = document.getElementById('minerAddress').value;
        if (minerAddress) {
            updateBalance(minerAddress);
        }
    } catch (error) {
        console.error('Error loading blockchain:', error);
        showMessage('Cannot connect to server. Make sure server is running.', 'error');
    }
}

// Load pending transactions
async function loadPendingTransactions() {
    try {
        const response = await fetch(`${API_BASE}/pending-transactions`);
        const data = await response.json();
        const transactionList = document.getElementById('transactionList');
        
        if (data.pendingTransactions.length === 0) {
            transactionList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #90e0ef;">
                    <i class="fas fa-exchange-alt" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                    <p>No pending transactions</p>
                    <p style="font-size: 0.85rem; margin-top: 10px;">Create a transaction to get started!</p>
                </div>
            `;
        } else {
            transactionList.innerHTML = '';
            data.pendingTransactions.forEach(tx => {
                const txElement = document.createElement('div');
                txElement.className = 'transaction-item';
                txElement.innerHTML = `
                    <div class="tx-header">
                        <div class="tx-hash">${tx.txid || 'New Transaction'}</div>
                        <div class="tx-amount">${tx.amount} BTC</div>
                    </div>
                    <div class="tx-addresses">
                        <div class="tx-from">${tx.from}</div>
                        <div class="tx-arrow">→</div>
                        <div class="tx-to">${tx.to}</div>
                    </div>
                    <div style="font-size: 0.8rem; color: #90e0ef; margin-top: 8px;">
                        ${tx.timestamp}
                    </div>
                `;
                transactionList.appendChild(txElement);
            });
        }
    } catch (error) {
        console.error('Error loading pending transactions:', error);
    }
}

// Update UI
function updateUI() {
    // Update stats
    document.getElementById('blockCount').textContent = blockchainData.blocks.length;
    document.getElementById('pendingTx').textContent = blockchainData.pendingTransactions;
    document.getElementById('chainStatus').textContent = blockchainData.isValid ? '✅' : '❌';
    
    // Update blocks
    const blocksContainer = document.getElementById('blocksContainer');
    blocksContainer.innerHTML = '';

    if (blockchainData.blocks.length === 0) {
        blocksContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #90e0ef;">
                <i class="fas fa-cube" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>No blocks in blockchain</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Mine the first block to start!</p>
            </div>
        `;
    } else {
        blockchainData.blocks.forEach(block => {
            const blockCard = document.createElement('div');
            blockCard.className = 'block-card';
            
            // Calculate transaction types
            const totalTransactions = block.transactions || 0;
            const userTransactions = block.index === 0 ? 0 : totalTransactions - 1;
            const isGenesis = block.index === 0;
            
            blockCard.innerHTML = `
                <div class="block-header">
                    <div class="block-number">Block #${block.index}</div>
                    <div class="block-status ${blockchainData.isValid ? 'status-valid' : 'status-invalid'}">
                        ${blockchainData.isValid ? 'VALID' : 'INVALID'}
                    </div>
                </div>
                <div class="block-hash">${block.hash}</div>
                <div class="block-details">
                    <div class="detail-row">
                        <span class="detail-label">Previous Hash:</span>
                        <span class="detail-value">${block.prevHash}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transactions:</span>
                        <span class="detail-value">
                            ${totalTransactions === 1 ? '1 (Genesis)' : 
                              `${totalTransactions} (1 Coinbase + ${userTransactions} User)`}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${block.timestamp}</span>
                    </div>
                </div>
                ${isGenesis ? '' : `
                <div class="block-transactions">
                    <div style="color: #90e0ef; font-size: 0.9rem; margin-bottom: 8px;">
                        <i class="fas fa-list"></i> Transaction Summary:
                    </div>
                    <div class="tx-summary">
                        <div style="color: #00b894;">
                            <i class="fas fa-coins"></i> 1 Coinbase
                        </div>
                        <div style="color: #00b4d8;">
                            <i class="fas fa-users"></i> ${userTransactions} User
                        </div>
                        <div style="color: #90e0ef;">
                            <i class="fas fa-calculator"></i> Total: ${totalTransactions}
                        </div>
                    </div>
                </div>
                `}
            `;
            blocksContainer.appendChild(blockCard);
        });
    }
    
    // Load pending transactions
    loadPendingTransactions();
}

// Update balance
async function updateBalance(address) {
    try {
        const response = await fetch(`${API_BASE}/balance/${address}`);
        const data = await response.json();
        if (data.balance !== undefined) {
            document.getElementById('minerBalance').textContent = data.balance.toFixed(2);
        }
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

// Create transaction
async function createTransaction() {
    const from = document.getElementById('fromAddress').value.trim();
    const to = document.getElementById('toAddress').value.trim();
    const amount = document.getElementById('amount').value;

    if (!from || !to || !amount || amount <= 0) {
        showMessage('Please fill all fields with valid values', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, amount: parseFloat(amount) })
        });

        const data = await response.json();
        
        if (data.success) {
            const pendingCount = data.pendingCount || blockchainData.pendingTransactions + 1;
            showMessage(`Transaction added! Pending: ${pendingCount}`, 'success');
            
            // Auto-mine if we have 3+ pending transactions
            if (pendingCount >= 3) {
                showMessage(`Auto-mining block with ${pendingCount} transactions...`, 'warning');
                setTimeout(() => {
                    mineBlock();
                }, 1500);
            }
            
            loadBlockchain();
        } else {
            showMessage(data.message || 'Transaction failed', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Create multiple transactions at once
async function createMultipleTransactions(count) {
    const addresses = ['Alice123', 'Bob456', 'Charlie789', 'David012', 'Eve345', 'Frank678', 'Grace901'];
    let successCount = 0;
    
    showMessage(`Creating ${count} transactions...`, 'warning');
    
    for (let i = 0; i < count; i++) {
        const from = addresses[i % addresses.length];
        const to = addresses[(i + 1) % addresses.length];
        const amount = Math.floor(Math.random() * 20) + 1;
        
        try {
            const response = await fetch(`${API_BASE}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, amount })
            });
            
            const data = await response.json();
            if (data.success) {
                successCount++;
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    showMessage(`${successCount}/${count} transactions added!`, 'success');
    loadBlockchain();
}

// Mine block
async function mineBlock() {
    const minerAddress = document.getElementById('minerAddress').value.trim();

    if (!minerAddress) {
        showMessage('Please enter miner address', 'error');
        return;
    }

    // Check if there are pending transactions
    if (blockchainData.pendingTransactions === 0) {
        showMessage('No pending transactions to mine!', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/mine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ minerAddress })
        });

        const data = await response.json();
        
        if (data.success) {
            const reward = data.reward || 12.5;
            showMessage(`Block mined! ${reward} BTC rewarded to miner`, 'success');
            loadBlockchain();
        } else {
            showMessage(data.message || 'Mining failed', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Validate chain
async function validateChain() {
    try {
        const response = await fetch(`${API_BASE}/validate`);
        const data = await response.json();
        
        if (data.valid) {
            showMessage('✅ Blockchain is valid!', 'success');
        } else {
            showMessage('❌ Blockchain is invalid!', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Tamper demo
async function tamperDemo() {
    try {
        const response = await fetch(`${API_BASE}/tamper`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockIndex: 1, transactionIndex: 0 })
        });

        const data = await response.json();
        
        if (data.success) {
            showMessage('Tampered with block! Checking validity...', 'warning');
            
            setTimeout(async () => {
                const validateResponse = await fetch(`${API_BASE}/validate`);
                const validateData = await validateResponse.json();
                
                if (validateData.valid) {
                    showMessage('Blockchain still valid', 'warning');
                } else {
                    showMessage('✅ Tamper detection working!', 'success');
                }
                loadBlockchain();
            }, 1000);
        } else {
            showMessage(data.message || 'Tamper demo failed', 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}