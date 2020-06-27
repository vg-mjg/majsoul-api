var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = env => {
	if (!env) {
		env = {}
	}
	return {
		entry: ["./src/bootstrap.sass", "./src/index.tsx"],
		mode: env.production ? 'production' : 'development',
		devtool: "source-map",
		devServer: {
			historyApiFallback: true
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".json"]
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: "awesome-typescript-loader"
						}
					]
				},
				{
					enforce: "pre",
					test: /\.js$/,
					loader: "source-map-loader"
				},
				{
					test: /\.s[ac]ss$/i,
					exclude: path.join(__dirname, "src/bootstrap.sass"),
					use: [
						"style-loader",
						"@teamsupercell/typings-for-css-modules-loader",
						{
							loader: "css-loader",
							options: { modules: true }
						},
						'sass-loader'
					],
				},
				{
					include: path.join(__dirname, "src/bootstrap.sass"),
					use: [{
						loader: 'style-loader', // inject CSS to page
					}, {
						loader: 'css-loader', // translates CSS into CommonJS modules
					}, {
						loader: 'postcss-loader', // Run postcss actions
						options: {
							plugins: function () { // postcss plugins, can be exported to postcss.config.js
								return [
									require('autoprefixer')
								];
							}
						}
					}, {
						loader: 'sass-loader' // compiles Sass to CSS
					}]
				},
				{
					test: /\.(mp3)$/i,
					use: [
						{
							loader: 'file-loader',
						},
					],
				},
				{
					test: /\.(png|jp(e*)g|svg)$/,
					use: [
						{
							loader: 'url-loader',
							// options: {
							// 	limit: 8000, // Convert images < 8kb to base64 strings
							// 	name: 'images/[hash]-[name].[ext]'
							// }
						}
					]
				}
			]
		},
		optimization: {
			splitChunks: {
				chunks: 'all'
			}
		},
		plugins: [
			new HtmlWebpackPlugin({
				base: "/",
				title: "/mjg/ league"
			})
		]
	};
};
