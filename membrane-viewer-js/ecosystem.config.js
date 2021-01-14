
module.exports = {
  apps: [{
    name: "Membrane Hub",
    script: "./run.sh",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
