export type VRFProof = {
  requestId: string;
  seed: string; // secret seed revealed later
  proof?: any;
  publishedAt?: string;
};

export interface IVRFProvider {
  requestRandomness(seedHint?: string): Promise<{ requestId: string }>;
  getProof(requestId: string): Promise<VRFProof>;
}
