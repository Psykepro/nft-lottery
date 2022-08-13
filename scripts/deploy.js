const { DeployAllContracts } = require("../utils/deploy.js");

async function main() {
  await DeployAllContracts();
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});


