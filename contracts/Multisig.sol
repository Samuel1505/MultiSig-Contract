// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract BoardMultiSig {
    // Events
    event TransactionProposed(uint256 indexed txId, address token, address recipient, uint256 amount);
    event TransactionApproved(uint256 indexed txId, address approver);
    event TransactionExecuted(uint256 indexed txId);
    
    // Structs
    struct Transaction {
        address token;        // ERC20 token address
        address recipient;    // Recipient of the transfer
        uint256 amount;      // Amount of tokens to transfer
        bool executed;       // Whether the transaction has been executed
        uint256 approvalCount; // Number of approvals received
        mapping(address => bool) hasApproved; // Track who has approved
    }
    
    // State variables
    address[] public boardMembers;
    mapping(address => bool) public isBoardMember;
    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;
    uint256 public constant REQUIRED_APPROVALS = 20;
    bool private locked;
    
    // Custom modifier for reentrancy protection
    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }
    
    modifier onlyBoardMember() {
        require(isBoardMember[msg.sender], "Not a board member");
        _;
    }
    
    modifier txExists(uint256 _txId) {
        require(_txId < transactionCount, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }
    
    modifier notApproved(uint256 _txId) {
        require(!transactions[_txId].hasApproved[msg.sender], "Already approved");
        _;
    }
    
    // Constructor
    constructor(address[] memory _boardMembers) {
        require(_boardMembers.length == REQUIRED_APPROVALS, "Must have exactly 20 board members");
        
        for (uint i = 0; i < _boardMembers.length; i++) {
            address member = _boardMembers[i];
            require(member != address(0), "Invalid member address");
            require(!isBoardMember[member], "Duplicate member");
            
            isBoardMember[member] = true;
            boardMembers.push(member);
        }
    }
    
    // Main functions
    function proposeTransaction(
        address _token,
        address _recipient,
        uint256 _amount
    ) public onlyBoardMember returns (uint256) {
        require(_token != address(0), "Invalid token address");
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 txId = transactionCount;
        Transaction storage transaction = transactions[txId];
        transaction.token = _token;
        transaction.recipient = _recipient;
        transaction.amount = _amount;
        transaction.executed = false;
        transaction.approvalCount = 0;
        
        transactionCount++;
        
        emit TransactionProposed(txId, _token, _recipient, _amount);
        return txId;
    }
    
    function approveTransaction(uint256 _txId)
        public
        onlyBoardMember
        txExists(_txId)
        notExecuted(_txId)
        notApproved(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        transaction.hasApproved[msg.sender] = true;
        transaction.approvalCount++;
        
        emit TransactionApproved(_txId, msg.sender);
        
        if (transaction.approvalCount == REQUIRED_APPROVALS) {
            executeTransaction(_txId);
        }
    }
    
    function executeTransaction(uint256 _txId)
        internal
        noReentrant
        txExists(_txId)
        notExecuted(_txId)
    {
        Transaction storage transaction = transactions[_txId];
        require(
            transaction.approvalCount == REQUIRED_APPROVALS,
            "Not enough approvals"
        );
        
        transaction.executed = true;
        
        IERC20 token = IERC20(transaction.token);
        require(
            token.transfer(transaction.recipient, transaction.amount),
            "Transfer failed"
        );
        
        emit TransactionExecuted(_txId);
    }
    
    // View functions
    function getTransaction(uint256 _txId)
        public
        view
        returns (
            address token,
            address recipient,
            uint256 amount,
            bool executed,
            uint256 approvalCount
        )
    {
        Transaction storage transaction = transactions[_txId];
        return (
            transaction.token,
            transaction.recipient,
            transaction.amount,
            transaction.executed,
            transaction.approvalCount
        );
    }
    
    function isApproved(uint256 _txId, address _boardMember)
        public
        view
        returns (bool)
    {
        return transactions[_txId].hasApproved[_boardMember];
    }
    
    function getBoardMembers() public view returns (address[] memory) {
        return boardMembers;
    }
}