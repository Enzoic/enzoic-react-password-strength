var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname,
        filename: '../dist/universal.js',
        libraryTarget: 'umd',
        library: 'PasswordPingReactPasswordMeter',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: /src/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015', 'stage-2'],
                },
            }, {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader",
                }),
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader'
            },
        ],
    },
    plugins: [
        new ExtractTextPlugin('../dist/style.css'),
    ],
    externals: {
        'react': 'react',
    },
};
