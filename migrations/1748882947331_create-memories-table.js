exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('memories', {
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
    event_id: {
      type: 'uuid',
      notNull: false,
      references: 'events(id)',
      onDelete: 'CASCADE',
    },
    trip_id: {
      type: 'uuid',
      notNull: false,
      references: 'trips(id)',
      onDelete: 'CASCADE',
    },
    notes: {
      type: 'text',
      notNull: false,
    },
    rating: {
      type: 'integer',
      notNull: false,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // CHECK制約: event_id と trip_id のどちらか一方がNULLで、もう一方がNOT NULLであること
  pgm.addConstraint('memories', 'memories_event_or_trip_check', {
    check: '(event_id IS NOT NULL AND trip_id IS NULL) OR (event_id IS NULL AND trip_id IS NOT NULL)',
  });

  pgm.sql(`
    CREATE TRIGGER set_timestamp_memories
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('memories');
};
