import { NFTStorage, File } from "nft.storage"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config();

async function main() {
  const client = new NFTStorage({ token: process.env.NFT_API })
  const metadata = await client.store({
    name: "LotteryTicketNft",
    description: "This is lottery ticket NFT.",
    image: new File(
      [await fs.promises.readFile("assets/ticket.jpg")],
      "ticket.jpg",
      { type: "image/jpeg" }
      ),
  })
    console.log("Metadata stored on Filecoin and IPFS with URL:", metadata.url)
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});