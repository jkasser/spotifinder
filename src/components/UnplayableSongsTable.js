function UnplayableSongsTable({ unplayableSongs, userRegion }) {
    function formatDuration(duration_ms) {
        const minutes = Math.floor(duration_ms / 60000);
        const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
    }

    const marketMessage = userRegion
        ? `your region (${userRegion})`
        : 'the US region, which is the only region supported in the limited app';

    return (
        <div style={{ padding: '1vw' }}>
            {unplayableSongs.length > 0 ? (
                <div className="spotify-playlist">
                    <table style={{ width: '100%'}}>
                        <thead>
                        <tr>
                            <th colSpan="4" style={{ textAlign: 'center' }}>Unplayable Songs</th>
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
                        {unplayableSongs.some(track => track.restrictions?.reason === 'market') && (
                            <tfoot style={{ fontSize: '1vw', padding: '0.5vw', textAlign: 'center' }}>
                            <tr>
                                <td colSpan="4">* Market means that the song is not available in {marketMessage}.</td>
                            </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            ) : (
                <p>No unplayable songs found in this playlist.</p>
            )}
        </div>
    );
}

export default UnplayableSongsTable;
