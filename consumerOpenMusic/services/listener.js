class Listener {
  constructor(playlistsService, mailSender) {
    this._playlistsService = playlistsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());
      const playlistById = await this._playlistsService.getPlaylistsById(playlistId);
      const playlistSong = await this._playlistsService.getPlaylistSongById(playlistId);
      const playlists = { ...playlistById, songs: playlistSong };
      const result = await this._mailSender.sendEmail(
        targetEmail,
        JSON.stringify({ playlist: playlists }),
      );
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Listener;
