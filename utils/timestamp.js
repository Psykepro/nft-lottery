async function getDifferenceInSecondsFromBlocktimestamp(toTimestamp) {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  return toTimestamp.sub(timestampBefore);
}

async function moveToTimestamp(toTimestamp) {
  await ethers.provider.send("evm_mine", [toTimestamp.toNumber()]);
}

module.exports = {
  getDifferenceInSecondsFromBlocktimestamp,
  moveToTimestamp
}