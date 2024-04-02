import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Table } from "react-bootstrap";

function PlaylistAnalyzer({ accessToken }) {
    const [isLoadingPlaylist, setLoadingPlaylist] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [unplayableSongs, setUnplayableSongs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchedPlaylist, setSearchedPlaylist] = useState(false); // Track if a playlist has been searched
    const [isPlaylistSelected, setIsPlaylistSelected] = useState(false); // Track if a playlist is selected

    useEffect(() => {
        const fetchPlaylists = async () => {
            setLoadingPlaylist(true);
            try {
                const response = await fetch('https://api.spotify.com/v1/me/playlists', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setPlaylists(data.items);
                    setErrorMessage('');
                } else {
                    setErrorMessage(data.error.message || 'Failed to fetch playlists.');
                }
            } catch (error) {
                console.error('Error fetching playlists:', error);
                setErrorMessage('Error fetching playlists. Please try again later.');
            } finally {
                setLoadingPlaylist(false);
            }
        };

        fetchPlaylists();
    }, [accessToken]);

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
                        if (!track.track.is_playable || track.track.is_local) {
                            unplayableTracks.push(track.track);
                        }
                    });
                }

                nextPage = data.next;
            }

            setUnplayableSongs(unplayableTracks);
            setErrorMessage('');
            setSearchedPlaylist(true); // Set to true when a playlist has been searched
        } catch (error) {
            console.error('Error fetching unplayable songs:', error);
            setErrorMessage('Error fetching unplayable songs. Please try again later.');
        } finally {
            setLoadingPlaylist(false);
        }
    };

    const handlePlaylistChange = (event) => {
        const selectedPlaylistId = event.target.value;
        setSelectedPlaylist(selectedPlaylistId);
        setIsPlaylistSelected(!!selectedPlaylistId); // Update isPlaylistSelected based on whether a playlist is selected
    };

    const handlePlaylistSubmit = (event) => {
        event.preventDefault();
        fetchUnplayableSongs();
    };

    return (
        <div>
            {errorMessage && <p>{errorMessage}</p>}

            {isLoadingPlaylist ? (
                <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
            ) : (
                <Form onSubmit={handlePlaylistSubmit}>
                    <Form.Group controlId="formPlaylist">
                        <Form.Label>Select Playlist</Form.Label>
                        <Form.Control as="select" onChange={handlePlaylistChange}>
                            <option value="">Select Playlist</option>
                            {playlists.map(playlist => (
                                <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Button variant="success" type="submit" disabled={!isPlaylistSelected}>
                        Submit
                    </Button>
                </Form>
            )}

            {searchedPlaylist && (
                <div className="table-container">
                    {unplayableSongs.length > 0 ? (
                        <Table striped bordered hover size="sm" variant="dark" responsive="sm" style={{ marginTop: '20px', marginBottom: '40px' }}>
                            <thead>
                            <tr>
                                <th colSpan="2" style={{ fontSize: '2vw', padding: '10px' }}>Unplayable Songs</th>
                            </tr>
                            <tr>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Artist</th>
                                <th style={{ fontSize: '1.8vw', padding: '10px' }}>Song</th>
                            </tr>
                            </thead>
                            <tbody>
                            {unplayableSongs.map((track, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>{track.artists[0].name}</td>
                                    <td style={{ fontSize: '1.6vw', padding: '0.5vw' }}>{track.name}</td>
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

export default PlaylistAnalyzer;
