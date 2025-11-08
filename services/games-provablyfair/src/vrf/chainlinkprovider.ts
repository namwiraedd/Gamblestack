// This file is a placeholder: Chainlink VRF is on-chain. The provider should:
// 1) deploy/own a VRF consumer contract OR use an existing service
// 2) request randomness on-chain and watch events for fulfillment
// 3) when fulfilled, fetch proof + log it
// Here we provide an abstraction. Integrate the on-chain contract logic in production.
import { IVRFProvider } from "./index";
import { v4 as uuidv4 } from "uuid";
export class ChainlinkProvider implements IVRFProvider {
  async requestRandomness(seedHint = "") {
    // call on-chain contract to request randomness (web3/ethers)
    const requestId = uuidv4(); // placeholder
    return { requestId };
  }
  async getProof(requestId: string) {
    // fetch fulfillment event, extract proof / seed
    return { requestId, seed: "onchain-seed", proof: { /* onchain proof object */ } };
  }
}
