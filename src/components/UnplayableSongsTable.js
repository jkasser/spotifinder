// UnplayableSongsTable.js

import React from 'react';
import { Table } from "react-bootstrap";

function UnplayableSongsTable({ unplayableSongs }) {
    function formatDuration(duration_ms) {
        const minutes = Math.floor(duration_ms / 60000);
        const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
    }

    return (
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
    );
}

export default UnplayableSongsTable;
