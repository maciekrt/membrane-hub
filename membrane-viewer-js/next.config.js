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
    },
    webpack: (config, { isServer }) => {
        // Fixes npm packages that depend on 'fs' module
        if (!isServer) {
            config.node = {
                fs: "empty", // when i put this line i get the 'net' error
                net: "empty" // then i put the 'net' line
            };
        }

        return config;
    }
    // your config for other plugins or the general next.js here...
});
