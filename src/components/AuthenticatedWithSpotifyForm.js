import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Table } from "react-bootstrap";

function AuthenticatedPlaylistAnalyzer({ accessToken }) {
    const [isLoadingPlaylist, setLoadingPlaylist] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [unplayableSongs, setUnplayableSongs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchedPlaylist, setSearchedPlaylist] = useState(false); // Track if a playlist has been searched
    const [isPlaylistSelected, setIsPlaylistSelected] = useState(false); // Track if a playlist is selected
    const [buttonText, setButtonText] = useState('Submit'); // Button text state

    useEffect(() => {
        // Fetch playlists function
        const fetchPlaylists = async () => {
            setLoadingPlaylist(true);
            try {
                let allPlaylists = []; // Array to store all playlists

                let nextPage = 'https://api.spotify.com/v1/me/playlists'; // Initial endpoint

                // Loop until all pages are fetched
                while (nextPage) {
                    const response = await fetch(nextPage, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        allPlaylists = allPlaylists.concat(data.items); // Concatenate fetched playlists to the array
                        nextPage = data.next; // Update nextPage with the next page URL
                    } else {
                        setErrorMessage(data.error.message || 'Failed to fetch playlists.');
                        return; // Exit the function if there's an error
                    }
                }

                setPlaylists(allPlaylists); // Set the state with all fetched playlists
                setErrorMessage('');
            } catch (error) {
                console.error('Error fetching playlists:', error);
                setErrorMessage('Error fetching playlists. Please try again later.');
            } finally {
                setLoadingPlaylist(false);
            }
        };

        fetchPlaylists();
    }, [accessToken]);

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
            {errorMessage && <p>{errorMessage}</p>}

            <Form onSubmit={handlePlaylistSubmit}>
                <Form.Group controlId="formPlaylist" style={{ width: '40vw', margin: '0 auto' }}>
                    <Form.Label>Select A Playlist!</Form.Label>
                    <Form.Control as="select" onChange={handlePlaylistChange} style={{ width: '100%' }}>
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
                                style={{ marginRight: '5px' }} // Add space between spinner and text
                            />
                            Loading...
                        </>
                    ) : (
                        buttonText
                    )}
                </Button>
            </Form>

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

export default AuthenticatedPlaylistAnalyzer;
