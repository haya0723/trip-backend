exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    schedule_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedules(id)',
      onDelete: 'CASCADE',
    },
    time: {
      type: 'time',
      notNull: false,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    category: {
      type: 'varchar(50)',
      notNull: false,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    location_name: {
      type: 'varchar(255)',
      notNull: false,
    },
    location_address: {
      type: 'text',
      notNull: false,
    },
    location_latitude: {
      type: 'decimal(9,6)',
      notNull: false,
    },
    location_longitude: {
      type: 'decimal(9,6)',
      notNull: false,
    },
    estimated_duration_minutes: {
      type: 'integer',
      notNull: false,
    },
    type: { // 'activity', 'meal', 'travel', 'hotel_checkin' など
      type: 'varchar(50)',
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

  pgm.sql(`
    CREATE TRIGGER set_timestamp_events
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('events');
};
