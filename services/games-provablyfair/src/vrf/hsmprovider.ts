import fetch from "node-fetch";
import { IVRFProvider } from "./index";
import { v4 as uuidv4 } from "uuid";

export class HSMProvider implements IVRFProvider {
  async requestRandomness(seedHint = "") {
    const requestId = uuidv4();
    // send request to HSM to generate seed + sign (assumes HSM stores secrets)
    await fetch(process.env.HSM_API_ENDPOINT + "/request", {
      method: "POST",
      body: JSON.stringify({ requestId, seedHint }),
      headers: { "Content-Type": "application/json" }
    });
    return { requestId };
  }

  async getProof(requestId: string) {
    const r = await fetch(process.env.HSM_API_ENDPOINT + `/proof/${requestId}`);
    if (r.status !== 200) throw new Error("no proof yet");
    const proof = await r.json();
    return { requestId, seed: proof.seed, proof: proof.signature };
  }
}
