const express = require("express");
const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());  
async function transaction(address, amount) {
    try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        
        const mintAuthority = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(process.env.MINT_AUTHORITY_PRIVATE_KEY))
        );

        const mintAddress = new PublicKey(process.env.TOKEN_MINT_ADDRESS); 
        const recipientTokenAccountAddress = new PublicKey(address);
        
        const tokenDecimals = 6; // Change   token's decimals
        const amountToMint = amount * (10 ** tokenDecimals);

        const instruction = Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mintAddress,
            recipientTokenAccountAddress,
            mintAuthority.publicKey,
            [],
            amountToMint
        );

        const transaction = new Transaction().add(instruction);
        
        // Get recent blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = mintAuthority.publicKey;

        // Sign and send transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [mintAuthority]
        );

        console.log("Tokens minted. Transaction signature:", signature);
        return { success: true, signature };

    } catch (error) {
        console.error("Error in transaction:", error);
        throw error;
    }
}

app.post("/api/v1/reward", async (req, res) => {
    try {
        const { score, address } = req.body;

        if (!score || !address) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required fields: score and address" 
            });
        }

        try {
            new PublicKey(address);
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid Solana address format" 
            });
        }

        
        const tokensToMint = ((score ** 1) * 0.01)

        const result = await transaction(address, tokensToMint);

        res.json({
            success: true,
            data: {
                signature: result.signature,
                tokensMinted: tokensToMint,
                score
            }
        });

    } catch (error) {
        console.error("Error processing reward:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to process reward" 
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: "Internal server error" 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});