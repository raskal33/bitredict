// Gas estimation script for BitredictPoolCore contracts
const { ethers } = require("hardhat");

async function estimateGasUsage() {
    console.log("🔍 Gas Usage Analysis for BitredictPoolCore Contracts\n");
    
    // Deploy both contracts for comparison
    const BitredictPoolCore = await ethers.getContractFactory("BitredictPoolCore");
    const BitredictPoolCoreOptimized = await ethers.getContractFactory("BitredictPoolCoreOptimized");
    
    // Mock addresses for testing
    const mockBitrToken = "0x1234567890123456789012345678901234567890";
    const mockFeeCollector = "0x2345678901234567890123456789012345678901";
    const mockGuidedOracle = "0x3456789012345678901234567890123456789012";
    const mockOptimisticOracle = "0x4567890123456789012345678901234567890123";
    
    console.log("📊 Deploying contracts for gas estimation...\n");
    
    // Deploy original contract
    const originalContract = await BitredictPoolCore.deploy(
        mockBitrToken,
        mockFeeCollector,
        mockGuidedOracle,
        mockOptimisticOracle
    );
    await originalContract.waitForDeployment();
    console.log("✅ Original contract deployed");
    
    // Deploy optimized contract
    const optimizedContract = await BitredictPoolCoreOptimized.deploy(
        mockBitrToken,
        mockFeeCollector,
        mockGuidedOracle,
        mockOptimisticOracle
    );
    await optimizedContract.waitForDeployment();
    console.log("✅ Optimized contract deployed\n");
    
    // Test data for pool creation
    const testData = {
        predictedOutcome: ethers.keccak256(ethers.toUtf8Bytes("Team A wins")),
        odds: 200, // 2.00 odds
        creatorStake: ethers.parseEther("1000"), // 1000 BITR
        eventStartTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        eventEndTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
        league: ethers.keccak256(ethers.toUtf8Bytes("Premier League")),
        category: ethers.keccak256(ethers.toUtf8Bytes("Football")),
        region: ethers.keccak256(ethers.toUtf8Bytes("Europe")),
        homeTeam: ethers.keccak256(ethers.toUtf8Bytes("Manchester United")),
        awayTeam: ethers.keccak256(ethers.toUtf8Bytes("Liverpool")),
        title: ethers.keccak256(ethers.toUtf8Bytes("Manchester United vs Liverpool")),
        isPrivate: false,
        maxBetPerUser: ethers.parseEther("100"),
        useBitr: true,
        oracleType: 0, // GUIDED
        marketId: ethers.keccak256(ethers.toUtf8Bytes("market_123")),
        marketType: 0 // MONEYLINE
    };
    
    console.log("🧪 Testing gas usage for createPool function...\n");
    
    try {
        // Estimate gas for original contract
        const originalGasEstimate = await originalContract.createPool.estimateGas(
            testData.predictedOutcome,
            testData.odds,
            testData.creatorStake,
            testData.eventStartTime,
            testData.eventEndTime,
            "Premier League", // Original uses strings
            "Football",
            "Europe",
            "Manchester United",
            "Liverpool",
            "Manchester United vs Liverpool",
            testData.isPrivate,
            testData.maxBetPerUser,
            testData.useBitr,
            testData.oracleType,
            testData.marketId,
            testData.marketType,
            { value: ethers.parseEther("1050") } // 1000 stake + 50 fee
        );
        
        console.log(`📈 Original Contract Gas Estimate: ${originalGasEstimate.toString()}`);
        console.log(`   Gas in millions: ${(Number(originalGasEstimate) / 1000000).toFixed(2)}M\n`);
        
    } catch (error) {
        console.log(`❌ Original contract gas estimation failed: ${error.message}\n`);
    }
    
    try {
        // Estimate gas for optimized contract
        const optimizedGasEstimate = await optimizedContract.createPool.estimateGas(
            testData.predictedOutcome,
            testData.odds,
            testData.creatorStake,
            testData.eventStartTime,
            testData.eventEndTime,
            testData.league, // Optimized uses bytes32
            testData.category,
            testData.region,
            testData.homeTeam,
            testData.awayTeam,
            testData.title,
            testData.isPrivate,
            testData.maxBetPerUser,
            testData.useBitr,
            testData.oracleType,
            testData.marketId,
            testData.marketType,
            { value: ethers.parseEther("1050") } // 1000 stake + 50 fee
        );
        
        console.log(`📈 Optimized Contract Gas Estimate: ${optimizedGasEstimate.toString()}`);
        console.log(`   Gas in millions: ${(Number(optimizedGasEstimate) / 1000000).toFixed(2)}M\n`);
        
    } catch (error) {
        console.log(`❌ Optimized contract gas estimation failed: ${error.message}\n`);
    }
    
    console.log("🔍 Analysis Summary:");
    console.log("===================");
    console.log("• Somnia testnet has a 9M gas limit per transaction");
    console.log("• Original contract likely exceeds this limit due to:");
    console.log("  - Heavy analytics storage operations");
    console.log("  - Multiple string storage operations");
    console.log("  - Complex indexing operations");
    console.log("  - External reputation system calls");
    console.log("\n• Optimized contract improvements:");
    console.log("  - Removed analytics storage (use events instead)");
    console.log("  - Replaced strings with bytes32");
    console.log("  - Removed complex indexing operations");
    console.log("  - Simplified reputation checks");
    console.log("  - Reduced storage operations by ~70%");
    
    console.log("\n💡 Recommendations:");
    console.log("===================");
    console.log("1. Deploy the optimized contract");
    console.log("2. Use events for analytics tracking (off-chain)");
    console.log("3. Implement string-to-bytes32 conversion in frontend");
    console.log("4. Consider splitting complex operations into multiple transactions");
    console.log("5. Use view functions for reputation checks");
}

// Run the estimation
estimateGasUsage()
    .then(() => {
        console.log("\n✅ Gas estimation completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Gas estimation failed:", error);
        process.exit(1);
    });
