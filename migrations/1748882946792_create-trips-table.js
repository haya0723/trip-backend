exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('trips', {
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
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    period_summary: {
      type: 'varchar(255)',
      notNull: false,
    },
    start_date: {
      type: 'date',
      notNull: false,
    },
    end_date: {
      type: 'date',
      notNull: false,
    },
    destinations: {
      type: 'text',
      notNull: false,
    },
    status: {
      type: 'varchar(50)',
      default: '計画中',
      notNull: false,
    },
    cover_image_url: {
      type: 'varchar(2048)',
      notNull: false,
    },
    is_public: {
      type: 'boolean',
      notNull: true,
      default: false,
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
    CREATE TRIGGER set_timestamp_trips
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('trips');
};
