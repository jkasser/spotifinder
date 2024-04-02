export const fetchWithRetries = async (url, options, retries = 3) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok && retries > 0) {
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter) {
                console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return fetchWithRetries(url, options, retries - 1);
            }
        }
        return response;
    } catch (error) {
        throw new Error('Request failed.');
    }
};