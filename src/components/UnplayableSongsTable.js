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
<div className="spotify-playlist">
  <table>
    <thead>
      <tr>
        <th colSpan="4">Unplayable Songs</th>
      </tr>
      <tr>
        <th>Artist</th>
        <th>Song</th>
        <th>Duration</th>
        <th>Reason</th>
      </tr>
    </thead>
    <tbody>
      {unplayableSongs.map((track, index) => (
      <tr key={index}>
        <td>{track.artists[0]?.name || 'N/A'}</td>
        <td>
          <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
            {track.name || 'N/A'}
          </a>
        </td>
        <td>{formatDuration(track.duration_ms) || 'N/A'}</td>
        <td>{track.restrictions?.reason || 'N/A'}</td>
      </tr>
      ))}
    </tbody>
  </table>
            ) : (
                <p>No unplayable songs found in this playlist.</p>
            )}
        </div>
    );
}

export default UnplayableSongsTable;
