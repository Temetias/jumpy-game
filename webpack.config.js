const path = require("path");

module.exports = {
	entry: "./script.js",
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: "script.js",
		libraryExport: "default",
		libraryTarget: "var",
		library: "game"
	},
};
