import logo from './Spotify_Logo_CMYK_Black.png';
import React, { useEffect, useState }from "react";
import requestBearerToken from "./Middleware/RequestToken";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import PlaylistAnalyzer from "./components/AnalyzerForm";


function App() {
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
        // Store the token in a cookie
        document.cookie = `accessToken=${accessToken}; max-age=${expiresIn}; path=/;`;
        const tokenFromCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('accessToken='))
            ?.split('=')[1];

        // If the token is already in the cookie, then use it
        if (tokenFromCookie) {
            setAccessToken(tokenFromCookie);
        } else {
            async function fetchToken() {
                const tokenResponse = await requestBearerToken(clientId, clientSecret);

                if (tokenResponse !== null) {
                    const {accessToken, expiresIn} = tokenResponse;
                    setAccessToken(accessToken);

                    // Check expiration and request new token if necessary
                    if (expiresIn) {
                        const expirationTimeout = setTimeout(async () => {
                            const newTokenResponse = await requestBearerToken(clientId, clientSecret);
                            if (newTokenResponse !== null) {
                                const {accessToken: newAccessToken} = newTokenResponse;
                                setAccessToken(newAccessToken);
                            }
                        }, expiresIn * 1000); // Convert expiresIn to milliseconds
                        return () => clearTimeout(expirationTimeout);
                    }
                } else {
                    // Handle null response from requestBearerToken
                    console.error('Error fetching bearer token: requestBearerToken returned null');
                }
            }
            // Request a new one
            fetchToken();
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
