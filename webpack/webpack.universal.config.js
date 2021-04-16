var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname,
        filename: '../dist/universal.js',
        libraryTarget: 'umd',
        library: 'EnzoicReactPasswordMeter',
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
        // Don't bundle react or react-dom
        react: {
            commonjs: "react",
            commonjs2: "react",
            amd: "React",
            root: "React"
        },
        "react-dom": {
            commonjs: "react-dom",
            commonjs2: "react-dom",
            amd: "ReactDOM",
            root: "ReactDOM"
        }
    }
};
