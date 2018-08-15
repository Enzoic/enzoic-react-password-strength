module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname,
        filename: '../dist/index.js',
        libraryTarget: 'umd',
        library: 'PasswordPingReactPasswordMeter',
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
        ],
    },
    externals: {
        'react': 'react'
    },
    resolve: {
        extensions: ['.js'],
    },
};
