exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_profiles', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    bio: {
      type: 'text',
      notNull: false, // NULL許容
    },
    avatar_url: {
      type: 'varchar(2048)',
      notNull: false, // NULL許容
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

  // updated_at を自動更新するトリガーを設定 (usersテーブルで作成した関数を再利用)
  pgm.sql(`
    CREATE TRIGGER set_timestamp_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('user_profiles');
};
