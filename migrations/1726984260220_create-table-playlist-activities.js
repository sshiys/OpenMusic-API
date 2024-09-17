exports.up = (pgm) => {
    pgm.createTable('playlist_activities', {
      id: {
        type: 'VARCHAR(50)',
        primaryKey: true,
      },
      playlist_id: {
        type: 'VARCHAR(50)',
        notNull: true,
        references: '"playlists"',
        onDelete: 'CASCADE',
      },
      song_id: {
        type: 'VARCHAR(50)',
        notNull: true,
        references: '"songs"',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: 'VARCHAR(50)',
        notNull: true,
        references: '"users"',
        onDelete: 'CASCADE',
      },
      action: {
        type: 'VARCHAR(50)',
        notNull: true,
      },
      time: {
        type: 'TIMESTAMP',
        notNull: true,
      },
    });
    pgm.createIndex('playlist_activities', ['playlist_id', 'song_id', 'user_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_activities');
};
  