import React, { useState, useEffect } from "react";
import requestBearerToken from "./Middleware/RequestToken";
import PlaylistAnalyzer from "./components/AnalyzerForm";

function App() {
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        const sha256 = async (plain) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(plain)
            return window.crypto.subtle.digest('SHA-256', data)
        }

        const generateCodeChallenge = (codeVerifier) => {
            const base64encode = (input) => {
                return btoa(String.fromCharCode(...new Uint8Array(input)))
                    .replace(/=/g, '')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');
            }
            return base64encode(sha256(codeVerifier));
        }

        const handleRedirectCallback = async () => {
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
    }, []); // Empty dependency array ensures this effect runs only once

    function generateRandomString(length) {
        const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }
        return randomString;
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
