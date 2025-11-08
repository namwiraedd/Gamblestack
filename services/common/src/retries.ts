export async function withRetry<T>(fn:()=>Promise<T>, retries=5, baseMs=200) {
  let attempt = 0;
  while (true) {
    try { return await fn(); } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      const wait = baseMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}
