// 사용자 조회와 갱신 재시도를 포함한 전체 작업의 대기 시간을 제한합니다.
export const SESSION_TIMEOUT_MS = 8_000;
export const AUTH_UNAVAILABLE_HEADER = "x-readme-auth-unavailable";

export function createRequestBudget(timeoutMs = SESSION_TIMEOUT_MS) {
  const controller = new AbortController();
  let stage = "사용자 확인";
  const startedAt = Date.now();
  const timeoutError = new Error("인증 처리 대기 시간 초과");
  const releaseSignals: Array<() => void> = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError);
    }, timeoutMs);
  });

  const boundedFetch: typeof fetch = async (input, init) => {
    controller.signal.throwIfAborted();
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("/auth/v1/token")) stage = "토큰 갱신";
    else if (url.includes("/auth/v1/user")) stage = "사용자 확인";
    const originalSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    // Next 15의 Edge 런타임에도 동작하도록 AbortSignal.any에 의존하지 않습니다.
    if (originalSignal) {
      const cancel = () => controller.abort();
      if (originalSignal.aborted) cancel();
      else {
        originalSignal.addEventListener("abort", cancel, { once: true });
        releaseSignals.push(() => originalSignal.removeEventListener("abort", cancel));
      }
    }
    return fetch(input, { ...init, signal: controller.signal });
  };

  return {
    fetch: boundedFetch,
    get active() { return !controller.signal.aborted; },
    setStage(value: string) { stage = value; },
    async run<T>(work: () => Promise<T>, context: string): Promise<T> {
      try {
        return await Promise.race([Promise.resolve().then(work), deadline]);
      } catch {
        // 원본 오류에는 URL, 토큰 또는 사용자 정보가 포함될 수 있어 기록하지 않습니다.
        console.warn("인증 처리 일시 중단", { context, stage, elapsedMs: Date.now() - startedAt });
        throw new Error("인증 서비스를 잠시 이용할 수 없습니다.");
      } finally {
        clearTimeout(timer);
        releaseSignals.forEach((release) => release());
        controller.abort();
      }
    }
  };
}

export function isTemporaryAuthError(error: { name?: string; status?: number } | null) {
  return Boolean(error && (error.name === "AuthRetryableFetchError"
    || !error.status || error.status === 429 || error.status >= 500));
}
