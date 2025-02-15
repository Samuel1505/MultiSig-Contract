// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestToken {
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;
    
    constructor() {
        _totalSupply = 1000000 * 10**18;
        _balances[msg.sender] = _totalSupply;
    }
    
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        return true;
    }
}