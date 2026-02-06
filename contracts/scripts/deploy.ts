import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(50));
    console.log("FlashDuel Contract Deployment");
    console.log("=".repeat(50));
    console.log("Deployer:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    console.log("=".repeat(50));

    // Deploy MockUSDC
    console.log("\n1. Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("   MockUSDC deployed to:", usdcAddress);

    // Deploy FlashDuel
    console.log("\n2. Deploying FlashDuel...");
    const FlashDuel = await ethers.getContractFactory("FlashDuel");
    const flashDuel = await FlashDuel.deploy(usdcAddress);
    await flashDuel.waitForDeployment();
    const flashDuelAddress = await flashDuel.getAddress();
    console.log("   FlashDuel deployed to:", flashDuelAddress);

    // Mint test USDC to deployer
    console.log("\n3. Minting test USDC...");
    const mintAmount = ethers.parseUnits("100000", 6);
    await usdc.mint(deployer.address, mintAmount);
    console.log("   Minted 100,000 USDC to deployer");

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("MockUSDC:", usdcAddress);
    console.log("FlashDuel:", flashDuelAddress);
    console.log("=".repeat(50));

    console.log("\nAdd these to your frontend .env.local:");
    console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
    console.log(`NEXT_PUBLIC_FLASHDUEL_ADDRESS=${flashDuelAddress}`);

    console.log("\nTo verify on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${usdcAddress}`);
    console.log(`npx hardhat verify --network sepolia ${flashDuelAddress} "${usdcAddress}"`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});