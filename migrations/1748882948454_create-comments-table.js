exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'SET NULL', 
    },
    trip_id: { 
      type: 'uuid',
      notNull: true,
      references: 'trips(id)',
      onDelete: 'CASCADE',
    },
    parent_comment_id: { 
      type: 'uuid',
      notNull: false,
      references: 'comments(id)',
      onDelete: 'CASCADE',
    },
    body: {
      type: 'text',
      notNull: true,
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

  pgm.sql(`
    CREATE TRIGGER set_timestamp_comments
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('comments');
};
