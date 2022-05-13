require("dotenv").config();

const express = require("express");
const asyncHandler = require("express-async-handler");

/**
 * 1) Import required libraries:
 *
 *  - "ethers" helps us create a Wallet object based on a private key, which helps us sign transactions.
 *  - "flair-sdk" provides a contract object with ability to submit meta transactions.
 */
const { Wallet } = require("ethers");
const { createFlairContractWithMetaTransactions } = require("flair-sdk");

/**
 * 2) Load configurations from environment variables (or any config management you use):
 *
 *  - "chainId" is the numeric ID of the chain where your NFT contract is deployed (1 for Ethereum, 4 for Rinkeby Testnet, 137 for Polygon).
 *  - "flairClientId" unique client ID of your Flair account, used for billing purposes.
 *  - "signer" is created based on private key of the minter wallet, used to sign NFT minting meta transactions.
 *  - "nftCollectionAddress" contract address for your deployed NFT collection on the blockchain.
 */
const chainId = Number(process.env.MINT_CHAIN_ID);
const flairClientId = process.env.FLAIR_CLIENT_ID;
const signer = new Wallet(process.env.MINTER_PRIVATE_KEY);
const nftCollectionAddress = process.env.NFT_COLLECTION_ADDRESS;

/**
 * 3) Create client instance for the ethers.js-compatible contract augmented with meta transactions.
 *
 * In this example we use one of ready-made presets (ERC721OneOfOneCollection).
 * To use a custom built contract you can manually create the meta transactions client instance (new ).
 *
 * @type {import('flair-sdk').MetaTransactionsAugmentedContract<
 *   import('flair-sdk').V1_6_ERC721OneOfOneCollection
 * >}
 */
const nftContract = createFlairContractWithMetaTransactions({
  env: 'dev',
  chainId,
  flairClientId,
  contractKey: "collections/ERC721/presets/ERC721OneOfOneCollection",
  addressOrName: nftCollectionAddress,
  signer,
});

/**
 * 4) Example endpoints:
 *
 *  - "GET /mint" endpoint simply uploads a new metadata to IPFS and mints a new 1-of-1 NFT based on that metadata.
 */
const app = express();

app.get(
  "/mint",
  asyncHandler(async (req, res) => {
    // "to" is the wallet address that receives the new NFT
    const to = "0x07ac68355ff8663c09644bc50bb02b60140842a8";

    // "count" is the number of NFTs to send to this wallet
    const count = 2;

    // TODO upload to IPFS

    // "tokenURIs" an array with exact size of "count" of metadata URLs for the newly minted NFTs
    const tokenURIs = ["ipfs://xxxxx/1", "ipfs://xxxxx/2"];

    // Sign a meta transaction and submit it to the Flair backend relayer for processing
    const data = await nftContract.metaTransaction.mintWithTokenURIsByOwner(
      to,
      count,
      tokenURIs
    );

    // The response is a successfully submitted (but not yet mined) meta transaction.
    // Note that depending on traffic on the blockchain it might take a few minutes to be mined and processed.
    res.send(data);
  })
);

const port = 8080;

app.listen(port, () => {
  console.log(`Flair SDK Example - Mint NFTs via Meta Transactions!`);
  console.log(`- Listening on port ${port}`);
  console.log(``);
  console.log(`Now you can mint NFTs by opening: http://localhost:${port}/mint`);
});
