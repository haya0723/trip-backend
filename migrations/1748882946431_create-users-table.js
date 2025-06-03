exports.shorthands = undefined;

exports.up = (pgm) => {
  // pgcrypto拡張機能がなければ作成 (UUID生成のため)
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    nickname: {
      type: 'varchar(50)',
      notNull: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
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

  // updated_at を自動更新するトリガー関数の作成
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // users テーブルにトリガーを設定
  pgm.sql(`
    CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('users');
  // トリガー関数も削除 (他のテーブルで使われていない場合、今回は他のテーブルでも使うので削除しない)
  // pgm.sql(`DROP FUNCTION IF EXISTS trigger_set_timestamp();`);
};
