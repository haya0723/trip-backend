exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('favorite_places', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    place_id: { 
      type: 'varchar(255)',
      notNull: true,
    },
    name: { 
      type: 'varchar(255)',
      notNull: false,
    },
    address: { 
      type: 'text',
      notNull: false,
    },
    category: { 
      type: 'varchar(100)',
      notNull: false,
    },
    latitude: { 
      type: 'decimal(9,6)',
      notNull: false,
    },
    longitude: { 
      type: 'decimal(9,6)',
      notNull: false,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('favorite_places', 'favorite_places_user_id_place_id_unique', {
    unique: ['user_id', 'place_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('favorite_places');
};
