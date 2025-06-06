exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn('schedules', 'hotel_check_in_time', {
    type: 'timestamptz',
    notNull: false,
    using: 'hotel_check_in_time::text::timestamptz', // USING句を追加
  });
  pgm.alterColumn('schedules', 'hotel_check_out_time', {
    type: 'timestamptz',
    notNull: false,
    using: 'hotel_check_out_time::text::timestamptz', // USING句を追加
  });
};

exports.down = (pgm) => {
  // ロールバックする場合は元の time 型に戻す
  // timestamptz から time へのキャストも USING が必要になる場合がある
  pgm.alterColumn('schedules', 'hotel_check_in_time', {
    type: 'time',
    notNull: false,
    using: 'hotel_check_in_time::text::time', 
  });
  pgm.alterColumn('schedules', 'hotel_check_out_time', {
    type: 'time',
    notNull: false,
    using: 'hotel_check_out_time::text::time',
  });
};
