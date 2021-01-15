
module.exports = {
  apps: [{
    name        : "Dispatcher",
    script      : "export FLASK_APP=dispatcher.py && flask run -p 5000",
    instances   : 1
  }, {
    name        : "Workers",
    interpreter : "python",
    script      : "worker.py",
    watch       : false,
    instances   : 3
  }]
}