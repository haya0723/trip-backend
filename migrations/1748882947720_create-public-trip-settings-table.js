exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('public_trip_settings', {
    trip_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'trips(id)',
      onDelete: 'CASCADE',
    },
    public_description: {
      type: 'text',
      notNull: false,
    },
    overall_author_comment: {
      type: 'text',
      notNull: false,
    },
    publish_scope: {
      type: 'varchar(50)',
      default: 'public',
      notNull: false,
    },
    include_photos: {
      type: 'varchar(50)',
      default: 'all',
      notNull: false,
    },
    include_videos: {
      type: 'varchar(50)',
      default: 'all',
      notNull: false,
    },
    include_notes: {
      type: 'varchar(50)',
      default: 'anonymized',
      notNull: false,
    },
    allow_comments: {
      type: 'boolean',
      notNull: true,
      default: true,
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
    CREATE TRIGGER set_timestamp_public_trip_settings
    BEFORE UPDATE ON public_trip_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('public_trip_settings');
};
