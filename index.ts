import { Address, Cell, TonClient } from "ton";
import BN from "bn.js";
import crypto from "crypto";
import { getHttpEndpoint } from "@orbs-network/ton-gateway";

(async () => {
  const toSha256Buffer = (s: string) => {
    return crypto.createHash("sha256").update(s).digest();
  };

  const SOURCES_REGISTRY = "EQANJEwItCel0Pwle7fHaL1FRYC2dZyyzKCOqK2yjrMcxN-g";
  const VERIFIER_ID = "orbs.com";

  const endpoint = await getHttpEndpoint(); // get the decentralized RPC endpoint

  console.log(endpoint)
  const tc = new TonClient({
    endpoint,
  });

  async function getVerificationDataForContract(
    codeCellHash: string
  ): Promise<string | null> {
    const { stack: sourceItemAddressStack } = await tc.callGetMethod(
      Address.parse(SOURCES_REGISTRY),
      "get_source_item_address",
      [
        ["num", new BN(toSha256Buffer(VERIFIER_ID)).toString()],
        ["num", new BN(Buffer.from(codeCellHash, "base64")).toString(10)],
      ]
    );

    const sourceItemAddr = Cell.fromBoc(
      Buffer.from(sourceItemAddressStack[0][1].bytes, "base64")
    )[0]
      .beginParse()
      .readAddress()!;

    const isDeployed = await tc.isContractDeployed(sourceItemAddr);
    console.log("isDeployed", sourceItemAddr.toFriendly(), isDeployed);

    if (isDeployed) {
      const { stack: sourceItemDataStack } = await tc.callGetMethod(
        sourceItemAddr,
        "get_source_item_data"
      );
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

  const exampleCodeCellHash = "/rX/aCDi/w2Ug+fg1iyBfYRniftK5YDIeIZtlZ2r1cA=";
  const nonExistentCodeCellHash = "/rX/aCDi/dddddd";
  console.log("💎 Fetching IPFS link for an existing verified code cell hash");
  await getVerificationDataForContract(exampleCodeCellHash);
  console.log("\n💎 Fetching IPFS link for a nonexistent code cell hash");
  await getVerificationDataForContract(nonExistentCodeCellHash);
})();
