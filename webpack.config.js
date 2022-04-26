'use strict';

const path = require('path');
const { styles } = require( '@ckeditor/ckeditor5-dev-utils' );

module.exports = {
    mode: 'development',
    entry: {
        index: './public/thepudomdhamtravel/src/index.js',
        login: './public/thepudomdhamtravel/src/login.js',
        headline: './public/thepudomdhamtravel/src/headline.js',
        article: './public/thepudomdhamtravel/src/article.js',
        about: './public/thepudomdhamtravel/src/about.js',
        contact: './public/thepudomdhamtravel/src/contact.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, './public/thepudomdhamtravel/dist'),
        clean: true,
    },  
    module: {
        rules: [
            {
                test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,

                use: [ 'raw-loader' ]
            },
            {
                test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,

                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            injectType: 'singletonStyleTag',
                            attributes: {
                                'data-cke': true
                            }
                        }
                    },
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: styles.getPostCssConfig( {
                                themeImporter: {
                                    themePath: require.resolve( '@ckeditor/ckeditor5-theme-lark' )
                                },
                                minify: true
                            } )
                        }
                    }
                ]
            }
        ]
    },

    // Useful for debugging.
    devtool: 'source-map',

    // By default webpack logs warnings if the bundle is bigger than 200kb.
    performance: { hints: false }
};