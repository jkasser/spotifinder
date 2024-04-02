const requestBearerToken = async (code) => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.REACT_APP_REDIRECT_URI;
    const codeVerifier = localStorage.getItem('code_verifier');

    // Construct the request body
    const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
    });

    try {
        // Make the fetch request to exchange the authorization code for a bearer token
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
            },
            body: requestBody
        });

        // Check if the response is OK
        if (response.ok) {
            // Parse the response body as JSON
            const data = await response.json();
            // Extract the access token and expiration time from the response
            const accessToken = data.access_token;
            const expiresIn = data.expires_in;
            // Return the access token and expiration time
            return { accessToken, expiresIn };
        } else {
            // If the response is not OK, log an error and return null
            console.error('Failed to exchange authorization code for bearer token:', response.statusText);
            return null;
        }
    } catch (error) {
        // If an error occurs during the fetch request, log the error and return null
        console.error('Error exchanging authorization code for bearer token:', error);
        return null;
    }
};

export default requestBearerToken;
