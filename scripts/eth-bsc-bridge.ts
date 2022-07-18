import hardhat, { ethers } from 'hardhat';
import { HardhatNetworkConfig } from 'hardhat/types';

import BridgeEth from '../artifacts/contracts/BridgeEth.sol/BridgeEth.json';
import BridgeBsc from '../artifacts/contracts/BridgeBsc.sol/BridgeBsc.json';
import TokenEth from '../artifacts/contracts/TokenEth.sol/TokenEth.json';
import TokenBsc from '../artifacts/contracts/TokenBsc.sol/TokenBsc.json';

interface HardhatNetworkConfigWithUrl extends HardhatNetworkConfig {
  url?: string;
}

async function main() {
  const ethNetworkConfig = hardhat.config.networks['rinkeby'] as HardhatNetworkConfigWithUrl;
  const bscNetworkConfig = hardhat.config.networks['bscTestnet'] as HardhatNetworkConfigWithUrl;

  const ethProvider = new ethers.providers.JsonRpcProvider(ethNetworkConfig.url);
  const bscProvider = new ethers.providers.JsonRpcProvider(bscNetworkConfig.url);

  const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIV_KEY, ethProvider);

  const BridgeEthContract = new ethers.ContractFactory(BridgeEth.abi, BridgeEth.bytecode, adminWallet);
  const BridgeBscContract = new ethers.ContractFactory(BridgeBsc.abi, BridgeBsc.bytecode, adminWallet);
  const TokenEthContract = new ethers.ContractFactory(TokenEth.abi, TokenEth.bytecode, adminWallet);
  const TokenBscContract = new ethers.ContractFactory(TokenBsc.abi, TokenBsc.bytecode, adminWallet);

  const tokenEthContract = await TokenEthContract.deploy();
  const tokenBscContract = await TokenBscContract.deploy();

  await tokenEthContract.deployed();
  await tokenBscContract.deployed();

  const bridgeEthContract = await BridgeEthContract.deploy(tokenEthContract.address);
  const bridgeBscContract = await BridgeBscContract.deploy(tokenBscContract.address);

  await bridgeEthContract.deployed();
  await bridgeBscContract.deployed();

  console.log(`TokenEth contract address: ${tokenEthContract.address}`);
  console.log(`TokenBsc contract address: ${tokenBscContract.address}`);
  console.log(`BridgeEth contract address: ${bridgeEthContract.address}`);
  console.log(`BridgeBsc contract address: ${bridgeBscContract.address}`);

  bridgeEthContract.on('Transfer', async (from, to, amount, timestamp, nonce, step) => {
    const tx = await bridgeBscContract.mint(to, amount, nonce);

    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`
      Processed transfer:
      - from ${from} 
      - to ${to} 
      - amount ${amount} tokens
      - date ${timestamp}`);

    const ethBalance = await tokenEthContract.balanceOf(to);
    const bscBalance = await tokenBscContract.balanceOf(to);

    console.log(`
      Updated balances:
      - ETH: ${ethBalance} tokens
      - BSC: ${bscBalance} tokens`);
  });

  console.log('Bridge is listening...');

  await bridgeEthContract.burn(adminWallet.address, ethers.utils.parseEther('1'));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
