import React, { useState, useEffect } from 'react';
import logo from './Spotify_Logo_CMYK_Black.png';
import PlaylistAnalyzer from './components/AnalyzerForm';
import requestBearerToken from "./Middleware/RequestToken";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


function App() {
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        const generateRandomString = (length) => {
            const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const values = crypto.getRandomValues(new Uint8Array(length));
            return Array.from(values)
                .map((x) => possible[x % possible.length])
                .join('');
        }

        const initiateAuthenticationFlow = async () => {
            let state = localStorage.getItem('spotify_auth_state');
            if (!state) {
                state = generateRandomString(16);
                localStorage.setItem('spotify_auth_state', state);
            }

            const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
            const redirectUri = process.env.REACT_APP_REDIRECT_URI;
            const scope = 'user-read-private user-read-email playlist-read-private';
            const codeVerifier = generateRandomString(128);
            localStorage.setItem('code_verifier', codeVerifier);
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            const authUrl = new URL("https://accounts.spotify.com/authorize");
            const params = {
                response_type: 'code',
                client_id: clientId,
                scope,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge,
                redirect_uri: redirectUri,
                state,
            };
            authUrl.search = new URLSearchParams(params).toString();

            window.location.href = authUrl.toString();
        };

        const handleRedirectCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const storedState = localStorage.getItem('spotify_auth_state');

            if (state === null || state !== storedState) {
                console.error('State mismatch or missing');
                return;
            }

            const tokenResponse = await requestBearerToken(code);
            if (tokenResponse !== null) {
                const { accessToken, expiresIn } = tokenResponse;
                setAccessToken(accessToken);
                document.cookie = `accessToken=${accessToken}; max-age=${expiresIn}; path=/;`;
                localStorage.removeItem('spotify_auth_state');
            } else {
                console.error('Error exchanging authorization code for bearer token');
            }
        };

        const generateCodeChallenge = async (codeVerifier) => {
            const hashed = await sha256(codeVerifier);
            return base64encode(hashed);
        };

        const sha256 = async (plain) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(plain);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            return digest;
        }

        const base64encode = (input) => {
            const bytes = new Uint8Array(input);
            const binary = String.fromCharCode(...bytes);
            return btoa(binary)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        };

        // Check if the URL contains the authorization code
        if (window.location.search.includes('code') && window.location.search.includes('state')) {
            handleRedirectCallback();
        } else {
            // If not, initiate the authentication flow
            initiateAuthenticationFlow();
        }
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" id="spotifyLogo" style={{ width: '500px', height: "auto" }}/>
                <br />
                <p>
                    Find missing spotify songs that are no longer playable in your public playlists!
                </p>
                <br />
                <PlaylistAnalyzer accessToken={accessToken}/>
            </header>
        </div>
    );

}

export default App;
