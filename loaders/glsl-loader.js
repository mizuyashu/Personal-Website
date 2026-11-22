// Turbopack loader: imports a .glsl file as a string (see next.config.ts).
module.exports = function glslLoader(source) {
  return `export default ${JSON.stringify(source)};`;
};
