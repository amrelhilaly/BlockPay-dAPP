// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockPay {
    struct Transaction {
        address sender;
        address receiver;
        uint256 amount;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    function sendPayment(address _receiver) external payable {
        require(msg.value > 0, "Amount must be greater than zero");

        transactions.push(Transaction({
            sender: msg.sender,
            receiver: _receiver,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        payable(_receiver).transfer(msg.value);
    }

    function getTransaction(uint256 index) external view returns (Transaction memory) {
        return transactions[index];
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }
}
