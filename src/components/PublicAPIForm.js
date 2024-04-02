import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Table } from "react-bootstrap";

function PublicPlaylistAnalyzer({accessToken}) {
    const [isLoadingUsername, setLoadingUsername] = useState(false);
    const [isLoadingPlaylist, setLoadingPlaylist] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [unplayableSongs, setUnplayableSongs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchedPlaylist, setSearchedPlaylist] = useState(false); // Track if a playlist has been searched
    const [usernameValue, setUsernameValue] = useState(''); // Track the value of the username field
    const [isPlaylistSelected, setIsPlaylistSelected] = useState(false); // Track if a playlist is selected
    const [buttonText, setButtonText] = useState('Submit'); // Button text state

    const handleUsernameChange = (event) => {
        setUsernameValue(event.target.value); // Update the username value when it changes
    };

    const handleUsernameSubmit = async (event) => {
        event.preventDefault();
        const enteredUsername = event.target.elements.username.value;
        setLoadingUsername(true);
        try {
            let allPlaylists = [];
            let nextPage = `https://api.spotify.com/v1/users/${enteredUsername}/playlists`;

            while (nextPage) {
                const response = await fetchWithRetries(nextPage, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                console.log(response)
                const data = await response.json();

                if (data.items.length > 0) {
                    allPlaylists = [...allPlaylists, ...data.items];
                }

                nextPage = data.next;
            }

            if (allPlaylists.length === 0) {
                setErrorMessage('No public playlists found for the entered username.');
            } else {
                setPlaylists(allPlaylists);
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
            setErrorMessage('Error fetching playlists. Please try again later.');
        } finally {
            setLoadingUsername(false);
        }
    }

    // Fetch unplayable songs function
    const fetchUnplayableSongs = async () => {
        setLoadingPlaylist(true);
        try {
            const unplayableTracks = [];
            let nextPage = `https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks?market=US`;

            while (nextPage) {
                const response = await fetch(nextPage, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                const data = await response.json();

                if (data.items) {
                    const tracks = data.items;

                    tracks.forEach(track => {
                        if (!track.track.is_playable || (track.track.is_local & track.track.is_playable)) {
                            unplayableTracks.push(track.track);
                        }
                    });
                }

                nextPage = data.next;
            }

            setUnplayableSongs(unplayableTracks);
            // debug console output
            // console.log(unplayableTracks)
            setErrorMessage('');
            setSearchedPlaylist(true); // Set to true when a playlist has been searched
        } catch (error) {
            console.error('Error fetching unplayable songs:', error);
            setErrorMessage('Error fetching unplayable songs. Please try again later.');
        } finally {
            setLoadingPlaylist(false);
        }
    };

    // Handle playlist change function
    const handlePlaylistChange = (event) => {
        const selectedPlaylistId = event.target.value;
        setSelectedPlaylist(selectedPlaylistId);
        setIsPlaylistSelected(!!selectedPlaylistId); // Update isPlaylistSelected based on whether a playlist is selected
    };

    // Handle playlist submit function
    const handlePlaylistSubmit = async (event) => {
        event.preventDefault();
        setLoadingPlaylist(true); // Set loading state to true
        setButtonText(''); // Clear button text
        await fetchUnplayableSongs(); // Wait for fetching unplayable songs
        setLoadingPlaylist(false); // Set loading state to false
        setButtonText('Submit'); // Change button text back to "Submit" after fetching
    };

    function formatDuration(duration_ms) {
        const minutes = Math.floor(duration_ms / 60000);
        const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
    }

    return (
        <div>
            <Form onSubmit={handleUsernameSubmit}>
                <Form.Group controlId="formUsername" style={{ width: '40vw', margin: '0 auto' }}>
                    <Form.Label>Enter Spotify Username</Form.Label>
                    <Form.Control type="text" name="username" placeholder="Username" value={usernameValue} onChange={handleUsernameChange} />
                </Form.Group>
                <Button variant="success" type="submit" disabled={!usernameValue || isLoadingUsername || isLoadingPlaylist} className="search-button">
                    {isLoadingUsername ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                            {' Loading...'}
                        </>
                    ) : 'Submit'}
                </Button>
            </Form>

            {errorMessage && <p>{errorMessage}</p>}

            {playlists.length > 0 && (
                <Form onSubmit={handlePlaylistSubmit}>
                    <Form.Group controlId="formPlaylist" style={{ width: '40vw', margin: '0 auto' }}>
                        <Form.Label>Select Playlist</Form.Label>
                        <Form.Control as="select" onChange={handlePlaylistChange}>
                            <option value="">Select Playlist</option>
                            {playlists.map(playlist => (
                                <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Button variant="success" type="submit" disabled={!isPlaylistSelected || isLoadingPlaylist}>
                        {isLoadingPlaylist ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                                {' Loading...'}
                            </>
                        ) : 'Submit'}
                    </Button>
                </Form>
            )}

            {searchedPlaylist && (
                <div className="table-container" style={{ width: '80vw', margin: '0 auto' }}>
                    {unplayableSongs.length > 0 ? (
                        <Table striped bordered hover size="sm" variant="dark" responsive="sm">
                            <thead>
                            <tr>
                                <th colSpan="4" style={{ fontSize: '2vw', padding: '10px' }}>Unplayable Songs</th>
                            </tr>
                            <tr>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Artist</th>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Song</th>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Duration</th>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Reason</th>
                            </tr>
                            </thead>
                            <tbody>
                            {unplayableSongs.map((track, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>{track.artists[0]?.name || 'N/A'}</td>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>
                                        <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                            {track.name || 'N/A'}
                                        </a>
                                    </td>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>{formatDuration(track.duration_ms) || 'N/A'}</td>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>{track.restrictions?.reason ? track.restrictions.reason : 'N/A'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    ) : (
                        <p>No unplayable songs found in this playlist.</p>
                    )}
                </div>


            )}
        </div>
    );
}

export default PublicPlaylistAnalyzer;


// Helper function to fetch with retries
const fetchWithRetries = async (url, options, retries = 3) => {
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