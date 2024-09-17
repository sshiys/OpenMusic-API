class PlaylistHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

  }

  // Add a playlist
  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    return h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: { playlistId },
    }).code(201);
  }

  // Get all playlists for a user
  async getPlaylistHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);

    return h.response({
      status: 'success',
      data: { playlists },
    }).code(200);
  }

  // Delete a playlist
  async deletePlaylistHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(playlistId, credentialId);
    await this._service.deletePlaylist(playlistId);

    return h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
  }

  // Add a song to a playlist
  async postPlaylistSongsHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.addSongToPlaylist(playlistId, songId, credentialId);
    await this._service.addPlaylistActivity(playlistId, { userId: credentialId, songId, action: 'add' });

    return h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    }).code(201);
  }

  // Get all songs in a playlist
  async getPlaylistSongsHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._service.getPlaylistSongsById(playlistId);

    return h.response({
      status: 'success',
      data: { playlist },
    }).code(200);
  }

  // Remove a song from a playlist
  async deletePlaylistSongsHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.deletePlaylistSong(playlistId, songId);
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.addPlaylistActivity(playlistId, { userId: credentialId, songId, action: 'delete' });

    return h.response({
      status: 'success',
      message: 'Song removed from playlist',
    }).code(200);
  }

  // Get all activities of a playlist
  async getPlaylistActivitiesHandler(request, h) {
    const { id: playlistId } = request.params;
    const activities = await this._service.getPlaylistActivities(playlistId);

    return h.response({
      status: 'success',
      data: { activities },
    }).code(200);
  }
}

module.exports = PlaylistHandler;
