async function awaitReceipt(tx, successMessage=undefined, failedMessage=undefined) {
  const receipt = await tx.wait(1);
  let success = true;
  if (receipt.status === 1) {
    if (successMessage) {
      console.log(successMessage)
    }
  } else {
    if (failedMessage) {
      console.log(failedMessage)
    }
    success = false;
  }
  return [receipt, success];
}

module.exports = {
  awaitReceipt
}