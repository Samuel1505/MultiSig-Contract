# BoardMultiSig Smart Contract

## Overview
The **BoardMultiSig** contract is a multi-signature wallet that requires a predefined number of board members to approve transactions before execution. This ensures security and decentralization for fund management.

## Features
- Requires **exactly 20 board members** for deployment.
- Board members can propose transactions.
- Transactions require **majority approvals** before execution.
- Ensures **secure token transfers** from the wallet.
- Prevents unauthorized access and approvals.

## Technologies Used
- Solidity
- Hardhat
- TypeScript
- Chai (for testing)
- Ethers.js

## Prerequisites
Before running this project, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (>= 16.x recommended)
- [Hardhat](https://hardhat.org/)
- [Ethers.js](https://docs.ethers.io/v5/)

## Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/Samuel1505/MultiSig-Contract/BoardMultiSig.git
   cd MultiSig
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Smart Contract Deployment
To deploy the **BoardMultiSig** contract, follow these steps:
1. Compile the contract:
   ```sh
   npx hardhat compile
   ```
2. Deploy the contract (local network):
   ```sh
   npx hardhat run scripts/deploy.ts --network localhost
   ```
   Replace `localhost` with the desired network (`goerli`, `mainnet`, etc.).

## Running Tests
The project includes a comprehensive test suite. To run the tests:
```sh
npx hardhat test
```
This will execute unit tests for contract deployment, transaction proposals, approvals, and execution.

```

## Common Issues & Fixes
### Error: "Must have exactly 20 board members"
- Ensure **at least 22 signers** are available in `getSigners()`.
- Check that exactly **20 members** are passed during contract deployment.

### Error: "Not enough signers! You need at least 22 accounts."
- Modify Hardhat configuration to increase test accounts.
- Use `accounts: { count: 25 }` in `hardhat.config.ts`.



## Author
- Samuel Owen(https://github.com/Samuel1505)

