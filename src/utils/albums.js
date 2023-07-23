const mapDBToModel = (result) => {
  const albumData = result.rows[0];
  const album = {
    id: albumData.id,
    name: albumData.name,
    year: parseInt(albumData.year, 10),
    coverUrl: albumData.cover,
    songs: albumData.song_id ? result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      performer: row.performer,
    })) : [],
  };

  return album;
};

module.exports = { mapDBToModel };
