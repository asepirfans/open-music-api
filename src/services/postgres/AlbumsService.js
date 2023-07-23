const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel } = require('../../utils/albums');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum(name, year) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const { rows, rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: `
      SELECT albums.id, albums.name, albums.year, albums.cover, songs.id
      AS song_id, songs.title, songs.performer
      FROM albums
      LEFT JOIN songs ON albums.id = songs.album_id
      WHERE albums.id = $1
    `,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    return mapDBToModel(result);
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id ',
      values: [name, year, id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumLike(albumId, userId) {
    const queryTestLike = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const { rowCount } = await this._pool.query(queryTestLike);
    if (rowCount) {
      throw new InvariantError('Album Gagal Ditambahkan');
    } else {
      const id = `albumLikes-${nanoid(16)}`;
      const queryAddLike = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };
      const { rows } = await this._pool.query(queryAddLike);
      if (!rows[0].id) {
        throw new InvariantError('Album Gagal Ditambahkan');
      }
      await this._cacheService.delete(`likes:${albumId}`);
    }
  }

  async getAlbumLike(id) {
    try {
      const result = await this._cacheService.get(`likes:${id}`);
      return {
        likes: JSON.parse(result),
        source: 'cache',
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };
      const { rowCount } = await this._pool.query(query);
      await this._cacheService.set(`likes:${id}`, JSON.stringify(rowCount));
      return {
        likes: rowCount,
        source: 'database',
      };
    }
  }

  async deleteAlbumLike(albumId, userId) {
    const queryTestLike = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const { rowCount, rows } = await this._pool.query(queryTestLike);
    if (rowCount) {
      const queryDeleteLike = {
        text: 'DELETE FROM user_album_likes WHERE id = $1',
        values: [rows[0].id],
      };
      const result = await this._pool.query(queryDeleteLike);
      await this._cacheService.delete(`likes:${albumId}`, JSON.stringify(result.rowCount));
    }
  }
}

module.exports = AlbumsService;
