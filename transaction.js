const SHA256 = require('crypto-js/sha256');

class Transaction {
    constructor(fromAddress, toAddress, amount, timestamp = Date.now()) {
        this.version = 1;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = timestamp;

        this.txid = this.calculateTXID();

        this.inputs = [];
        this.outputs = [];

        this.isCoinbase = fromAddress === null || fromAddress === '0';

        this.initializeTransaction();
    }

    calculateTXID() {
        const data = this.version.toString() +
            (this.fromAddress || '') +
            this.toAddress +
            this.amount.toString() +
            this.timestamp.toString();
        return SHA256(data).toString();
    }

    initializeTransaction() {
        if (!this.isCoinbase) {
            this.inputs.push({
                vout: 0,
                scriptSig: `Sign: ${this.fromAddress}`,
                amount: this.amount
            });
        }

        this.outputs.push({
            value: this.amount,
            scriptPubKey: `Pay-to: ${this.toAddress}`
        });

        // For simplicity, we're not handling change outputs here
        // In a real system, you'd need UTXO management
    }

    isValid() {
        // Basic validation
        if (!this.toAddress || this.amount <= 0) {
            console.log('Invalid: Missing toAddress or amount <= 0');
            return false;
        }

        // Verify TXID
        if (this.txid !== this.calculateTXID()) {
            console.log('Invalid: TXID mismatch');
            return false;
        }

        // Coinbase transactions are always valid
        if (this.isCoinbase) {
            return true;
        }

        // Regular transactions need a fromAddress
        if (!this.fromAddress) {
            console.log('Invalid: Missing fromAddress');
            return false;
        }

        // Check inputs and outputs
        if (this.inputs.length === 0) {
            console.log('Invalid: No inputs');
            return false;
        }

        if (this.outputs.length === 0) {
            console.log('Invalid: No outputs');
            return false;
        }

        // Simple validation - in a real system you'd check signatures
        return true;
    }

    getFee() {
        if (this.isCoinbase) return 0;
        
        const inputTotal = this.inputs.reduce((sum, input) => sum + input.amount, 0);
        const outputTotal = this.outputs.reduce((sum, output) => sum + output.value, 0);
        
        return inputTotal - outputTotal;
    }

    display() {
        return {
            txid: this.txid.substring(0, 20) + '...',
            from: this.fromAddress || 'COINBASE',
            to: this.toAddress,
            amount: this.amount,
            timestamp: new Date(this.timestamp).toLocaleString(),
            isCoinbase: this.isCoinbase
        };
    }
}

module.exports = Transaction;