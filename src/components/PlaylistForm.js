import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

const PlaylistForm = ({
                          isLoading,
                          buttonText,
                          onSubmit,
                          onChange,
                          playlists,
                          selectedPlaylist,
                          handlePlaylistChange,
                          isPlaylistSelected
                      }) => (
    <Form onSubmit={onSubmit}>
        <Form.Group controlId="formPlaylist" style={{ width: '40vw', margin: '0 auto' }}>
            <Form.Label>Select A Playlist!</Form.Label>
            <Form.Control as="select" onChange={handlePlaylistChange} style={{ width: '100%' }}>
                <option value="">Select Playlist</option>
                {playlists.map(playlist => (
                    <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                ))}
            </Form.Control>
        </Form.Group>
        <Button variant="success" type="submit" disabled={!isPlaylistSelected || isLoading}>
            {isLoading ? (
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
);

export default PlaylistForm;
