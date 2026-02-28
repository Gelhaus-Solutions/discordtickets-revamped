const importJSON = (...modules) => [
  modules[0].locale_id,
  [].concat(...modules.map((mod) => mod.json))
];
const getSupportedLocales = () => {
  const files = Object.keys({ "/src/lib/locales/en-GB/_common.json": 0, "/src/lib/locales/en-GB/misc.json": 0 });
  return Array.from(
    new Set(
      files.map((file) => {
        const parts = file.split("/");
        return parts[parts.length - 2];
      })
    )
  );
};
export {
  getSupportedLocales as g,
  importJSON as i
};
