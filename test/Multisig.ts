import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("BoardMultiSig", function () {
    let Token: any;
    let testToken: Contract;
    let BoardMultiSig: any;
    let multiSig: Contract;
    let owner: SignerWithAddress;
    let boardMembers: SignerWithAddress[];
    let recipient: SignerWithAddress;
    let addresses: SignerWithAddress[];
    const REQUIRED_APPROVALS = 20;

    before(async function () {
        // Deploy the test token contract
        Token = await ethers.getContractFactory("TestToken");
        BoardMultiSig = await ethers.getContractFactory("BoardMultiSig");
    });

    beforeEach(async function () {
        // Get signers
        const allSigners = await ethers.getSigners();
        [owner, recipient, ...addresses] = allSigners;
        
        // Get 20 board members from addresses
        boardMembers = addresses.slice(0, REQUIRED_APPROVALS);
        
        // Deploy test token
        testToken = await Token.deploy();
        await testToken.waitForDeployment();
        
        // Deploy multisig with 20 board members
        multiSig = await BoardMultiSig.deploy(
            boardMembers.map((member: SignerWithAddress) => member.address)
        );
        await multiSig.waitForDeployment();

        // Transfer tokens to multisig
        await testToken.transfer(await multiSig.getAddress(), ethers.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the correct number of board members", async function () {
            const members = await multiSig.getBoardMembers();
            expect(members.length).to.equal(REQUIRED_APPROVALS);
        });

        it("Should correctly register board members", async function () {
            for (let member of boardMembers) {
                const isMember = await multiSig.isBoardMember(member.address);
                expect(isMember).to.be.true;
            }
        });

        it("Should reject deployment with incorrect number of board members", async function () {
            const invalidMembers = boardMembers.slice(0, 19);
            await expect(
                BoardMultiSig.deploy(invalidMembers.map((m: SignerWithAddress) => m.address))
            ).to.be.revertedWith("Must have exactly 20 board members");
        });
    });

    describe("Transaction Proposal", function () {
        it("Should allow board member to propose transaction", async function () {
            const amount = ethers.parseEther("100");
            
            await expect(
                multiSig.connect(boardMembers[0]).proposeTransaction(
                    await testToken.getAddress(),
                    recipient.address,
                    amount
                )
            ).to.emit(multiSig, "TransactionProposed")
              .withArgs(0, await testToken.getAddress(), recipient.address, amount);
        });

        it("Should reject proposal from non-board member", async function () {
            await expect(
                multiSig.connect(recipient).proposeTransaction(
                    await testToken.getAddress(),
                    recipient.address,
                    ethers.parseEther("100")
                )
            ).to.be.revertedWith("Not a board member");
        });

        it("Should reject zero amount proposals", async function () {
            await expect(
                multiSig.connect(boardMembers[0]).proposeTransaction(
                    await testToken.getAddress(),
                    recipient.address,
                    0
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("Transaction Approval and Execution", function () {
        let txId: number;
        const amount = ethers.parseEther("100");

        beforeEach(async function () {
            // Create a transaction to approve
            const tx = await multiSig.connect(boardMembers[0]).proposeTransaction(
                await testToken.getAddress(),
                recipient.address,
                amount
            );
            await tx.wait();
            txId = 0;
        });

        it("Should track approvals correctly", async function () {
            await multiSig.connect(boardMembers[0]).approveTransaction(txId);
            
            expect(await multiSig.isApproved(txId, boardMembers[0].address)).to.be.true;
            expect(await multiSig.isApproved(txId, boardMembers[1].address)).to.be.false;
        });

        it("Should prevent double approval", async function () {
            await multiSig.connect(boardMembers[0]).approveTransaction(txId);
            
            await expect(
                multiSig.connect(boardMembers[0]).approveTransaction(txId)
            ).to.be.revertedWith("Already approved");
        });

        it("Should execute transaction after all approvals", async function () {
            // Get initial balance
            const initialBalance = await testToken.balanceOf(recipient.address);

            // Have all board members approve
            for (let member of boardMembers) {
                await multiSig.connect(member).approveTransaction(txId);
            }

            // Verify execution
            const tx = await multiSig.getTransaction(txId);
            expect(tx.executed).to.be.true;

            // Check recipient received tokens
            const finalBalance = await testToken.balanceOf(recipient.address);
            expect(finalBalance - initialBalance).to.equal(amount);
        });

        it("Should fail if not enough approvals", async function () {
            // Only 19 members approve
            for (let i = 0; i < REQUIRED_APPROVALS - 1; i++) {
                await multiSig.connect(boardMembers[i]).approveTransaction(txId);
            }

            const tx = await multiSig.getTransaction(txId);
            expect(tx.executed).to.be.false;
        });
    });

    describe("View Functions", function () {
        it("Should return correct transaction details", async function () {
            const amount = ethers.parseEther("100");
            
            await multiSig.connect(boardMembers[0]).proposeTransaction(
                await testToken.getAddress(),
                recipient.address,
                amount
            );

            const tx = await multiSig.getTransaction(0);
            expect(tx.token).to.equal(await testToken.getAddress());
            expect(tx.recipient).to.equal(recipient.address);
            expect(tx.amount).to.equal(amount);
            expect(tx.executed).to.be.false;
            expect(tx.approvalCount).to.equal(0);
        });

        it("Should return board members", async function () {
            const members = await multiSig.getBoardMembers();
            expect(members.length).to.equal(REQUIRED_APPROVALS);
            for (let i = 0; i < REQUIRED_APPROVALS; i++) {
                expect(members[i]).to.equal(boardMembers[i].address);
            }
        });
    });
});