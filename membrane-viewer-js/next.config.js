// next.config.js
const withOptimizedImages = require('@mrroll/next-optimized-images');

module.exports = withOptimizedImages({
    /* config for next-optimized-images */
    module: {
        rules: [
            {
                test: /\.(jpe?g|png|webp)$/i,
                use: {
                    loader: 'responsive-loader',
                    options: { adapter: require('responsive-loader/sharp') } }
    }
    ]
}
    // your config for other plugins or the general next.js here...
});