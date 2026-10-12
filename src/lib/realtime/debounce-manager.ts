export function createDebouncedRefetch(fetchFn: () => Promise<void> | void, delayMs: number = 200) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fetchFn();
            timeoutId = null;
        }, delayMs);
    };
}
