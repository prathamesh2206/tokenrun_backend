const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { programs } = require('@metaplex-foundation/js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.MINT_AUTHORITY_PRIVATE_KEY)));

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const mintAddress = new PublicKey(process.env.TOKEN_MINT_ADDRESS);

async function addMetadata() {
  const metadataPDA = await programs.metadata.Metadata.getPDA(mintAddress);

  const data = {
    name: 'run tokens',
    symbol: 'RUN',
    uri: 'https://link-to-your-metadata-json', 
    sellerFeeBasisPoints: 500, // 5% royalties
    creators: null,
  };

  const transaction = new Transaction().add(
    programs.metadata.createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint: mintAddress,
        mintAuthority: keypair.publicKey,
        payer: keypair.publicKey,
        updateAuthority: keypair.publicKey,
      },
      { data, isMutable: true }
    )
  );

  await connection.sendTransaction(transaction, [keypair]);
  console.log('Metadata added!');
}

addMetadata();
