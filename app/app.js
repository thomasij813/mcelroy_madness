var express = require('express');
var path = require('path');

var indexRoute = require('./routes/index.js');

var app = express();

var port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoute);

app.listen(port, function() {
  console.log('Listening on port ' + port);
});
