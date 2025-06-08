exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('memories', {
    media_urls: {
      type: 'text[]', // 配列型
      notNull: false, // NULLを許容
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('memories', 'media_urls');
};
