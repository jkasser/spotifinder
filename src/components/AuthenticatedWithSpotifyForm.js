import React, { useState, useEffect } from 'react';
import PlaylistForm from "./PlaylistForm";
import UnplayableSongsTable from "./UnplayableSongsTable";
import {fetchUnplayableSongs} from "./apiUtils";

function AuthenticatedPlaylistAnalyzer({ accessToken }) {
    const [isLoadingPlaylists, setLoadingPlaylists] = useState(true); // State to track loading playlists
    const [isLoadingPlaylist, setLoadingPlaylist] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [unplayableSongs, setUnplayableSongs] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchedPlaylist, setSearchedPlaylist] = useState(false);
    const [isPlaylistSelected, setIsPlaylistSelected] = useState(false);
    const [buttonText, setButtonText] = useState('Submit');
    const [userRegion, setUserRegion] = useState('');

    useEffect(() => {
        const fetchUserRegion = async () => {
            try {
                const response = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserRegion(data.country); // Set the user's region from the API response
                } else {
                    setErrorMessage('Failed to fetch user information.');
                }
            } catch (error) {
                console.error('Error fetching user region:', error);
                setErrorMessage('Error fetching user information. Please try again later.');
            }
        };

        fetchUserRegion();
    }, [accessToken]);

    useEffect(() => {
        const fetchPlaylists = async () => {
            setLoadingPlaylists(true); // Set loading state to true when fetching starts
            try {
                let allPlaylists = [];
                let nextPage = 'https://api.spotify.com/v1/me/playlists';

                while (nextPage) {
                    const response = await fetch(nextPage, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        }
                    });

                    const data = await response.json();
                    console.log(data)
                    if (response.ok) {
                        allPlaylists = allPlaylists.concat(data.items);
                        nextPage = data.next;
                    } else {
                        setErrorMessage(data.error.message || 'Failed to fetch playlists.');
                        return;
                    }
                }

                setPlaylists(allPlaylists);
                setErrorMessage('');
            } catch (error) {
                console.error('Error fetching playlists:', error);
                setErrorMessage('Error fetching playlists. Please try again later.');
            } finally {
                setLoadingPlaylists(false); // Set loading state to false when fetching ends
            }
        };

        fetchPlaylists();
    }, [accessToken]);


    const handlePlaylistChange = (event) => {
        const selectedPlaylistId = event.target.value;
        setSelectedPlaylist(selectedPlaylistId);
        setIsPlaylistSelected(!!selectedPlaylistId);
    };

    const handlePlaylistSubmit = async (event) => {
        event.preventDefault();
        const userRegionEndpoint = `https://api.spotify.com/v1/playlists/${selectedPlaylist}/tracks?market=${userRegion}`;
        setLoadingPlaylist(true);
        setButtonText('');
        try {
            const unplayableTracks = await fetchUnplayableSongs(userRegionEndpoint, accessToken);
            setUnplayableSongs(unplayableTracks);
            setSearchedPlaylist(selectedPlaylist);
        } catch (error) {
            console.error('Error fetching unplayable songs:', error);
            setErrorMessage('Error fetching unplayable songs. Please try again later.');
        } finally {
            setLoadingPlaylist(false);
            setButtonText('Submit');
        }
    };


    return (
        <div>
            {isLoadingPlaylists ? ( // Display loading indicator while fetching playlists
                <div className="loading-indicator">Loading playlists...</div>
            ) : (
                <>
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
                        />
                    )}
                    {searchedPlaylist && <UnplayableSongsTable unplayableSongs={unplayableSongs} userRegion={userRegion} />}
                </>
            )}
        </div>
    );
}

export default AuthenticatedPlaylistAnalyzer;
