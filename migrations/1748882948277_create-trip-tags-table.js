exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('trip_tags', {
    trip_id: {
      type: 'uuid',
      notNull: true,
      references: 'trips(id)',
      onDelete: 'CASCADE',
    },
    tag_id: {
      type: 'uuid',
      notNull: true,
      references: 'tags(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('trip_tags', 'trip_tags_pkey', {
    primaryKey: ['trip_id', 'tag_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('trip_tags');
};
