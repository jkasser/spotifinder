export default async function requestBearerToken(clientId, clientSecret) {
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error('Failed to obtain bearer token from Spotify');
        }

        const data = await response.json();
        return {
            bearerToken: data.access_token,
            expiresIn: data.expires_in
        };
    } catch (error) {
        console.error('Error requesting bearer token:', error);
        return null;
    }
}
