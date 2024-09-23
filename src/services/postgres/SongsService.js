const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModelDetail } = require('../../utils');

class SongsService {
    constructor() {
        this._pool = new Pool();
    }

    async addSong({ title, year, performer, genre, duration, album_id }) {
        const id = `song-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO songs (id, title, year, performer, genre, duration, album_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            values: [
                id,
                title,
                year,
                performer,
                genre,
                duration,
                album_id,
            ],
        };

        const result = await this._pool.query(query);

        if (!result.rows[0].id) {
            throw new InvariantError('Lagu gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getSongs({ title, performer }) {
        if (title === undefined) {
            title = '';
          }
      
          if (performer === undefined) {
            performer = '';
          }
      
          const query = {
            text: 'SELECT id, title, performer FROM songs WHERE lower(title) LIKE $1 AND lower(performer) LIKE $2',
            values: [`%${title.toLowerCase()}%`, `%${performer.toLowerCase()}%`],
          };

        const songs = await this._pool.query(query);
        return songs.rows.map(mapDBToModelDetail);
    }

    async getSongById(id) {
        const query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [id],
        };
        const song = await this._pool.query(query);

        if (!song.rows.length) {
            throw new NotFoundError('Lagu tidak ditemukan');
        }

        return mapDBToModelDetail(song.rows[0]);
    }

    async editSongById(id, { title, year, performer, genre, duration, album_id }) {
        const query = {
            text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
            values: [title, year, performer, genre, duration, album_id, id],
        };

        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
        }
    }

    async deleteSongById(id) {
        const query = {
            text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rowCount) {
            throw new NotFoundError('Lagu tidak ditemukan');
        }
    }
}

module.exports = SongsService;