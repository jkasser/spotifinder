import React, { useState, useEffect } from "react";
import requestBearerToken from "./Middleware/RequestToken";
import PlaylistAnalyzer from "./components/AnalyzerForm";

function App() {
    const [accessToken, setAccessToken] = useState('');

    const sha256 = async (plain) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }

    const base64encode = (input) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    useEffect(() => {
        const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        const redirectUri = process.env.REACT_APP_REDIRECT_URI;
        const scopes = encodeURIComponent('playlist-read-private');
        const state = encodeURIComponent(generateRandomString(16));
        const codeVerifier = generateRandomString(128);

        const codeChallenge = generateCodeChallenge(codeVerifier);

        const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

        if (window.location.search.includes('code') && window.location.search.includes('state')) {
            handleRedirectCallback();
        } else {
            window.location.href = url;
        }
    }, [generateCodeChallenge]);

    async function handleRedirectCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        const storedState = localStorage.getItem('spotify_auth_state');

        if (state === null || state !== storedState) {
            console.error('State mismatch or missing');
            return;
        }

        localStorage.removeItem('spotify_auth_state');

        const tokenResponse = await requestBearerToken(code);
        if (tokenResponse !== null) {
            const { accessToken, expiresIn } = tokenResponse;
            setAccessToken(accessToken);

            document.cookie = `accessToken=${accessToken}; max-age=${expiresIn}; path=/;`;
        } else {
            console.error('Error exchanging authorization code for bearer token');
        }
    }

    function generateRandomString(length) {
        const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }
        return randomString;
    }

    function generateCodeChallenge(codeVerifier) {
        return base64encode(sha256(codeVerifier));
    }

    return (
        <div className="App">
            {accessToken ? (
                <PlaylistAnalyzer accessToken={accessToken} />
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default App;
