import { Address, Cell, TonClient } from "ton";
import BN from "bn.js";
import crypto from "crypto";

export const toSha256Buffer = (s: string) => {
  return crypto.createHash("sha256").update(s).digest();
};

const SOURCES_REGISTRY = "EQBfL6AgP-lNiYXFADmcD5yFPwK9DXhaLNlZl-9cWJAJEmQe";
const VERIFIER_ID = "orbs.com";

const tc = new TonClient({
  endpoint: "https://scalable-api.tonwhales.com/jsonRPC",
});

async function getVerificationDataForContract(
  codeCellHash: string
): Promise<string | null> {
  const { stack: sourceItemAddressStack } = await tc.callGetMethod(
    Address.parse(SOURCES_REGISTRY),
    "get_source_item_address",
    [
      ["num", new BN(toSha256Buffer("orbs.com")).toString()], // TODO const
      ["num", new BN(Buffer.from(codeCellHash, "base64")).toString(10)],
    ]
  );

  const sourceItemAddr = Cell.fromBoc(
    Buffer.from(sourceItemAddressStack[0][1].bytes, "base64")
  )[0]
    .beginParse()
    .readAddress()!;

  const isDeployed = await tc.isContractDeployed(sourceItemAddr);
  console.log("isDeployed", isDeployed);

  if (isDeployed) {
    const { stack: sourceItemDataStack } = await tc.callGetMethod(
      sourceItemAddr,
      "get_nft_data"
    ); // TODO rename
    const ipfsLink = Cell.fromBoc(
      Buffer.from(sourceItemDataStack[4][1].bytes, "base64")
    )[0]
      .beginParse()
      .readRemainingBytes()
      .toString();

    console.log("IPFS Link", ipfsLink);
    return ipfsLink;
  }

  return null;
}

(async () => {
  const exampleCodeCellHash = "/rX/aCDi/w2Ug+fg1iyBfYRniftK5YDIeIZtlZ2r1cA=";
  await getVerificationDataForContract(exampleCodeCellHash);
})();
