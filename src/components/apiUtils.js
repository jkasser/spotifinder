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


export const fetchUnplayableSongs = async (endpoint, accessToken) => {
    try {
        let unplayableTracks = [];
        let nextPage = endpoint;

        while (nextPage) {
            const response = await fetch(nextPage, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error.message || 'Failed to fetch unplayable songs.');
            }

            const data = await response.json();

            if (data.items) {
                const tracks = data.items;

                tracks.forEach(track => {
                    if (!track.track.is_playable && !track.track.is_local) {
                        unplayableTracks.push(track.track);
                    }
                });
            }

            nextPage = data.next;
        }

        return unplayableTracks;
    } catch (error) {
        console.error('Error fetching unplayable songs:', error);
        throw new Error('Error fetching unplayable songs. Please try again later.');
    }
};
