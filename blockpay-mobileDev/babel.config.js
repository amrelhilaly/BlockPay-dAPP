module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // this flag lets Hermes-friendly Babel rewrite import.meta.env
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
