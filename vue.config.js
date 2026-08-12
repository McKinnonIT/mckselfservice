module.exports = {
  devServer: {
    port: 8081, // server.js owns 8080
    // The API lives in server.js. Run it alongside `npm run serve`: npm run dev:api
    proxy: {
      '/api-internal': { target: 'http://localhost:8080' },
    },
  },
};
