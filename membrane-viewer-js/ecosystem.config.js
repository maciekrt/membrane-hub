
module.exports = {
  apps: [{
    name: "Membrane Hub",
    script: "npm run start -- -p 3000",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
