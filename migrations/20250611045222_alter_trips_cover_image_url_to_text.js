exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn('trips', 'cover_image_url', {
    type: 'text',
    notNull: false, // 既存の制約を維持
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('trips', 'cover_image_url', {
    type: 'varchar(2048)',
    notNull: false, // 既存の制約を維持
  });
};
