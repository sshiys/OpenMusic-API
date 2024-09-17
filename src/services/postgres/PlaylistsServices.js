const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  // Playlist management
  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);
    console.log(result);
    if (!result.rowCount) {
      console.error(error);
      throw new InvariantError('Playlist creation failed');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
             FROM playlists 
             LEFT JOIN users ON users.id = playlists.owner
             LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
             WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };
  
    const result = await this._pool.query(query);
    console.log(result);
    return result.rows; // Return the list of playlists for the user
  }
  

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    console.log(result);
    if (!result.rowCount) {
      console.error(error);
      throw new NotFoundError('Playlist deletion failed. Id not found');
    }
  }

  // Song management in playlists
  async addSongToPlaylist(playlistId, songId, userId) {
  const id = `playlist-song-${nanoid(16)}`;
  const query = {
    text: 'INSERT INTO playlistsongs VALUES ($1, $2, $3) RETURNING id',
    values: [id, playlistId, songId],
  };

  const result = await this._pool.query(query);
  if (!result.rowCount) {
    throw new InvariantError('Failed to add song to playlist.');
  }

  // Log the activity in playlist_activities
  await this.addPlaylistActivity(playlistId, { userId, songId, action: 'add' });
}
  

async getPlaylistSongsById(playlistId) {
  // Fetch the playlist details
  const playlistQuery = {
    text: 'SELECT id, name FROM playlists WHERE id = $1',
    values: [playlistId],
  };
  
  const playlistResult = await this._pool.query(playlistQuery);
  if (!playlistResult.rowCount) {
    throw new NotFoundError('Playlist not found');
  }
  
  // Fetch all songs associated with the playlist
  const songQuery = {
    text: `SELECT songs.id, songs.title, songs.performer 
           FROM songs 
           LEFT JOIN playlistsongs ON songs.id = playlistsongs.song_id 
           WHERE playlistsongs.playlist_id = $1`,
    values: [playlistId],
  };
  const songResult = await this._pool.query(songQuery);

  const playlist = playlistResult.rows[0];
  playlist.songs = songResult.rows; // Assign songs to the playlist

  return playlist;
}

async deletePlaylistSongsHandler(request, h) {
  this._validator.validatePlaylistSongPayload(request.payload);
  const { songId } = request.payload;
  const { playlistId } = request.params;
  const { id: credentialId } = request.auth.credentials;

  await this._service.verifyPlaylistAccess(playlistId, credentialId); // Verify access first
  await this._service.deletePlaylistSong(playlistId, songId); // Then delete
  await this._service.addPlaylistActivity(playlistId, { userId: credentialId, songId, action: 'delete' });

  return h.response({
    status: 'success',
    message: 'Song removed from playlist',
  }).code(200);
}

  

  //playlist activities
  async addPlaylistActivity(playlistId, { userId, songId, action }) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_activities (id, playlist_id, user_id, song_id, action, time) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [id, playlistId, userId, songId, action, time],
    };
    
    await this._pool.query(query);
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_activities.action, playlist_activities.time 
             FROM playlist_activities 
             LEFT JOIN users ON users.id = playlist_activities.user_id 
             LEFT JOIN songs ON songs.id = playlist_activities.song_id 
             WHERE playlist_activities.playlist_id = $1`,
      values: [playlistId],
    };
  
    const result = await this._pool.query(query);
    console.log(result);
    return result.rows;
  }
  
  async verifyPlaylistOwner(id, owner) {
    const query = {
        text: 'SELECT * FROM playlists WHERE id = $1',
        values: [id],
    };

    const result = await this._pool.query(query);
    
    if (!result.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
        throw new AuthorizationError(
            'Anda tidak berhak mengakses resource ini'
        );
    }
}

async verifyPlaylistAccess(playlistId, userId) {
    try {
        await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        try {
            await this._collaborationService.verifyCollaborator(
                playlistId,
                userId
            );
        } catch {
            throw error;
        }
    }
}

}

module.exports = PlaylistService;
