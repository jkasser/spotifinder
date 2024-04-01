import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Table } from "react-bootstrap";

function PlaylistAnalyzer({ accessToken }) {
    const [isLoadingUsername, setLoadingUsername] = useState(false);
    const [isLoadingPlaylist, setLoadingPlaylist] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [unplayableSongs, setUnplayableSongs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchedPlaylist, setSearchedPlaylist] = useState(false); // Track if a playlist has been searched

    const handleUsernameSubmit = async (event) => {
        event.preventDefault();
        const enteredUsername = event.target.elements.username.value;
        setLoadingUsername(true);
        try {
            // only get the first 100 playlists
            const response = await fetch(`https://api.spotify.com/v1/users/${enteredUsername}/playlists?limit=25`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            const data = await response.json();
            if (data.items.length === 0) {
                setErrorMessage('No playlists found for the entered username.');
            } else {
                setPlaylists(data.items);
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
            setErrorMessage('Error fetching playlists. Please try again later.');
        } finally {
            setLoadingUsername(false);
        }
    }

    const handlePlaylistSubmit = async (event) => {
        event.preventDefault();
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
    }

    return (
        <div>
            <Form onSubmit={handleUsernameSubmit}>
                <Form.Group controlId="formUsername">
                    <Form.Label>Enter Spotify Username</Form.Label>
                    <Form.Control type="text" name="username" placeholder="Username" />
                </Form.Group>
                <Button variant="success" type="submit" disabled={isLoadingUsername || isLoadingPlaylist} className="search-button">
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
                    <Form.Group controlId="formPlaylist">
                        <Form.Label>Select Playlist</Form.Label>
                        <Form.Control as="select" onChange={(e) => setSelectedPlaylist(e.target.value)}>
                            <option value="">Select Playlist</option>
                            {playlists.map(playlist => (
                                <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Button variant="success" type="submit" disabled={isLoadingPlaylist}>
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

            {searchedPlaylist && unplayableSongs.length > 0 && (
                <div className="table-container">

                    <Table striped bordered hover size="sm" variant="dark" responsive="sm" style={{ marginTop: '20px', marginBottom: '40px' }}>
                        <thead>
                        <tr>
                            <th colSpan="2">Unplayable Songs</th>
                        </tr>
                        <tr>
                            <th style={{ fontSize: '2vw' }}>Artist</th>
                            <th style={{ fontSize: '2vw' }}>Song</th>
                        </tr>
                        </thead>
                        <tbody>
                        {unplayableSongs.map((track, index) => {
                            if (track && track.name) {
                                return (
                                    <tr key={index}>
                                        <td style={{ fontSize: '1.6vw' }}>{track.artists[0].name}</td>
                                        <td style={{ fontSize: '1.6vw' }}>{track.name}</td>
                                    </tr>
                                );
                            } else {
                                return null;
                            }
                        })}
                        </tbody>
                    </Table>
                </div>
            )}
            {searchedPlaylist && unplayableSongs.length === 0 && (
                <p>No unplayable songs found in this playlist.</p>
            )}
        </div>
    );
}

export default PlaylistAnalyzer;
