import React, { useState, useEffect } from 'react';
import PlaylistForm from "./PlaylistForm";
import UnplayableSongsTable from "./UnplayableSongsTable";

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

    return (
        <div>
            {errorMessage && <p>{errorMessage}</p>}

            {playlists.length > 0 && (
                <PlaylistForm
                    isLoading={isLoadingPlaylist}
                    buttonText={buttonText}
                    onSubmit={handlePlaylistSubmit}
                    playlists={playlists}
                    selectedPlaylist={selectedPlaylist}
                    handlePlaylistChange={handlePlaylistChange}
                    isPlaylistSelected={isPlaylistSelected}
                />)}

            {searchedPlaylist && <UnplayableSongsTable unplayableSongs={unplayableSongs} />}
        </div>
    );
}

export default AuthenticatedPlaylistAnalyzer;
