module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname,
        filename: '../dist/index.js',
        libraryTarget: 'umd',
        library: 'EnzoicReactPasswordMeter',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: /src/,
                query: {
                    presets: ['react', 'es2015', 'stage-2'],
                },
            }, {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader'
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-url-loader',
                        options: {
                            limit: 10000,
                        },
                    },
                ],
            }
        ],
    },
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
    },
    resolve: {
        extensions: ['.js'],
    },
};
