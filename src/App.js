import React, { useState, useEffect } from 'react';
import logo from './Spotify_Logo_CMYK_Black.png';
import AuthenticatedPlaylistAnalyzer from './components/AuthenticatedWithSpotifyForm';
import PublicPlaylistAnalyzer from "./components/PublicAPIForm";
import requestKPCEToken from "./Middleware/RequestPKCEToken";
import requestBearerToken from "./Middleware/RequestBearerToken";
import Button from "react-bootstrap/Button";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [accessToken, setAccessToken] = useState('');
    const [bearerToken, setBearerToken] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [limitedApp, setLimitedApp] = useState(false);
    const [clientId, setClientId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        setClientId(clientId);
    }, []);

    const generateRandomString = (length) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values)
            .map((x) => possible[x % possible.length])
            .join('');
    }

    const initiateAuthenticationFlow = async () => {
        setIsLoading(true);
        let state = localStorage.getItem('spotify_auth_state');
        if (!state) {
            state = generateRandomString(16);
            localStorage.setItem('spotify_auth_state', state);
        }

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


    async function initiateLimitedFlow() {
        setIsLoading(true);
        const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
        const tokenResponse = await requestBearerToken(clientId, clientSecret);
        if (tokenResponse !== null) {
            const { bearerToken, expiresIn } = tokenResponse;
            setBearerToken(bearerToken);
            setLimitedApp(true);
            setIsLoading(false);
            // Set the bearer token as a cookie
            document.cookie = `bearerToken=${bearerToken}; max-age=${expiresIn}; path=/;`;
            // Check expiration and request new token if necessary
            if (expiresIn) {
                const expirationTimeout = setTimeout(async () => {
                    const newTokenResponse = await requestBearerToken(clientId, clientSecret);
                    if (newTokenResponse !== null) {
                        const { accessToken: newBearerToken } = newTokenResponse;
                        setBearerToken(newBearerToken);
                    }
                }, expiresIn * 1000); // Convert expiresIn to milliseconds
                return () => clearTimeout(expirationTimeout);
            }
        } else {
            // Handle null response from requestBearerToken
            console.error('Error fetching bearer token: requestBearerToken returned null');
            setIsLoading(false);
        }
    }


    const handleRedirectCallback = async () => {
        setIsLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('spotify_auth_state');

        if (state === null || state !== storedState) {
            console.error('State mismatch or missing');
            setIsLoading(false);
            return;
        }

        const tokenResponse = await requestKPCEToken(code);
        if (tokenResponse !== null) {
            const { accessToken, expiresIn } = tokenResponse;
            setAccessToken(accessToken);
            setAuthenticated(true); // Set authenticated to true
            document.cookie = `accessToken=${accessToken}; max-age=${expiresIn}; path=/;`;
            localStorage.removeItem('spotify_auth_state');
        } else {
            console.error('Error exchanging authorization code for bearer token');
            setIsLoading(false);
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

    useEffect(() => {

        // Check if the URL contains the authorization code
        if (window.location.search.includes('code') && window.location.search.includes('state')) {
            handleRedirectCallback();
        }
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" id="spotifyLogo" style={{ width: '500px', height: 'auto' }} />
                <br />
                <p>Find missing Spotify songs that are no longer playable in your public playlists!</p>
                <br />
                {(authenticated || limitedApp || isLoading) ? null : (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <Button variant="success" size="lg" onClick={initiateAuthenticationFlow}>Authenticate with Spotify</Button>
                        <Button variant="success" size="lg" onClick={initiateLimitedFlow}>Use Limited App</Button>
                    </div>
                )}
                {authenticated && <AuthenticatedPlaylistAnalyzer accessToken={accessToken} />}
                {limitedApp && <PublicPlaylistAnalyzer accessToken={bearerToken}/>}
            </header>
        </div>

    );
}

export default App;
