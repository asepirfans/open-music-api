const { Pool } = require('pg');
const InvariantError = require('../exeptions/InvariantError');
const NotFoundError = require('../exeptions/NotFoundError');

class PlaylistSongsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylistsById(playlistId) {
    const query = {
      text: `
      SELECT id, name
      FROM playlists
      WHERE id = $1
      `,
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlists tidak ditemukan');
    }

    return result.rows[0];
  }

  async getPlaylistSongById(playlistId) {
    const query = {
      text: `
            SELECT songs.id, songs.title, songs.performer
            FROM playlists
            INNER JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
            INNER JOIN songs ON songs.id = playlist_songs.song_id
            WHERE playlists.id = $1
            `,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Tidak ada song di dalam playlist ini');
    }

    return result.rows;
  }
}

module.exports = PlaylistSongsService;
