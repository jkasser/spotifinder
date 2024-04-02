import React, { useState, useEffect } from "react";
import requestBearerToken from "./Middleware/RequestToken";
import PlaylistAnalyzer from "./components/AnalyzerForm";
import CryptoJS from "crypto-js";

function App() {
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
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

                // Store access token and expiration in cookies
                document.cookie = `accessToken=${accessToken}; max-age=${expiresIn}; path=/;`;
                document.cookie = `expiresIn=${expiresIn}; max-age=${expiresIn}; path=/;`;

                // Schedule token expiration check
                setTimeout(checkTokenExpiration, expiresIn * 1000);
            } else {
                console.error('Error exchanging authorization code for bearer token');
            }
        };

        const checkTokenExpiration = () => {
            const expiresInCookie = parseInt(getCookie('expiresIn'));
            const currentTime = Math.floor(Date.now() / 1000);
            if (expiresInCookie <= currentTime) {
                // Token expired, redirect for reauthentication
                redirectToSpotifyLogin();
            } else {
                // Token still valid, schedule next expiration check
                const timeToExpiration = expiresInCookie - currentTime;
                setTimeout(checkTokenExpiration, timeToExpiration * 1000);
            }
        };

        const redirectToSpotifyLogin = () => {
            const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
            const redirectUri = process.env.REACT_APP_REDIRECT_URI;
            const scopes = encodeURIComponent('playlist-read-private');
            const state = generateRandomString(16);

            // Save state to local storage for comparison during redirect callback
            localStorage.setItem('spotify_auth_state', state);

            const codeVerifier = generateRandomString(128);
            const codeChallenge = generateCodeChallenge(codeVerifier);

            const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

            window.location.href = url;
        };

        const generateRandomString = (length) => {
            const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let randomString = '';
            for (let i = 0; i < length; i++) {
                randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
            }
            return randomString;
        };

        const generateCodeChallenge = (codeVerifier) => {
            // Use crypto-js to generate SHA256 hash and then base64 encode it
            const hashed = CryptoJS.SHA256(codeVerifier);
            const base64encoded = CryptoJS.enc.Base64.stringify(hashed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

            return base64encoded;
        };

        const getCookie = (name) => {
            const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
            return cookieValue ? cookieValue.pop() : '';
        };

        // Check if access token exists in cookies
        const storedAccessToken = getCookie('accessToken');
        const expiresInCookie = parseInt(getCookie('expiresIn'));
        if (storedAccessToken && expiresInCookie) {
            setAccessToken(storedAccessToken);
            setTimeout(checkTokenExpiration, expiresInCookie * 1000);
        } else if (window.location.search.includes('code') && window.location.search.includes('state')) {
            // If in the redirect state, handle the callback
            handleRedirectCallback();
        } else {
            // No valid access token found, redirect for authentication
            redirectToSpotifyLogin();
        }
    }, []); // Empty dependency array ensures this effect runs only once

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
