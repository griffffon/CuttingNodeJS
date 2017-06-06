var config = require('./config/config');
var cluster = require('cluster');
var num_processes = require('os').cpus().length;
var net = require('net');

if (cluster.isMaster) {
    console.log('Master');

    // This stores our workers. We need to keep them to be able to reference
    // them based on source IP address. It's also useful for auto-restart,
    // for example.
    var workers = [];

    // Helper function for spawning worker at index 'i'.
    var spawn = function (i) {
        workers[i] = cluster.fork();

        // Optional: Restart worker on exit
        workers[i].on('exit', function (worker, code, signal) {
            console.log('respawning worker', i);
            spawn(i);
        });
    };

    // Spawn workers.
    for (var i = 0; i < num_processes; i++) {
        spawn(i);
    }

    // Helper function for getting a worker index based on IP address.
    // This is a hot path so it should be really fast. The way it works
    // is by converting the IP address to a number by removing the dots,
    // then compressing it to the number of slots we have.
    //
    // Compared against "real" hashing (from the sticky-session code) and
    // "real" IP number conversion, this function is on par in terms of
    // worker index distribution only much faster.
    var worker_index = function (ip, len) {
        var s = '';
        for (var i = 0, _len = ip.length; i < _len; i++) {
            if (ip[i] !== '.') {
                s += ip[i];
            }
        }

        return Number(s) % len;
    };

    function getWorker(ip, len) {
        var _ip = ip.split(/['.'|':']/),
            arr = [];

        for (el in _ip) {
            if (_ip[el] == '') {
                arr.push(0);
            } else {
                arr.push(parseInt(_ip[el], 16));
            }

            return Number(arr.join('')) % len;
        }
    }

    // Create the outside facing server listening on our port.
    var server = net.createServer({pauseOnConnect: true}, function (connection) {
        // We received a connection and need to pass it to the appropriate
        // worker. Get the worker for this connection's source IP and pass
        // it the connection.
        var worker = workers[getWorker(connection.remoteAddress, num_processes)];
        // var worker = workers[worker_index(connection.remoteAddress, num_processes)];
        worker.send('sticky-session:connection', connection);
    }).listen(config.get("port"));
}
else {
    var express = require('express');
    var helmet = require('helmet');

    const http = require('http');

    var favicon = require('serve-favicon');
    var morgan = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');

    // const session = require('express-session');
    // const MongoStore = require('connect-mongo/es5')(session);

    // var mongoose = require('mongoose');
    var fs = require('fs');

    // var multipart = require('connect-multiparty');
    // var multipartMiddleware = multipart();

    // var passport = require('passport');
    // var flash = require('connect-flash');
    var path = require('path');

    var eLogger = require('./lib/logger').eLogger;
    var wLogger = require('./lib/logger').wLogger;
    var iLogger = require('./lib/logger').iLogger;

    var app = express();

    app.use(helmet({
        frameguard: false //нужно для корректной работы метрик
    }));

    // var server = http.Server(app);
    var server = app.listen(0, 'localhost');

    // var connect = require('connect');
    // var sassMiddleware = require('node-sass-middleware');

    console.log('Fork');

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    //require('./config/passport')(passport); // pass passport for configuration

    //CRON ==========================================
    // require('./autoPayment');

    //app.use(favicon(path.join(__dirname, 'public/img', 'favicon.ico')));
    app.use(morgan('dev', {
        skip: function (req, res) {
            //Не выводим инфу в консоль о картинках, шрифтах и т.п.
            var regex = /^\/?[\w\/?.&-=]+\/?((\bimages\b)|(\bimg\b)|(\bfonts\b)|(\bcss\b)|(\buploads\b)|(\bjs\b))\/[\w\/?.%&-=]+$/;
            if (regex.test(req.url)) {
                return true;
            }
        }
    }));
    app.use(bodyParser.json({limit: '524288000'}));
    app.use(bodyParser.urlencoded({limit: '524288000', extended: false})); //extended: true;  Для экспорта проблемы при больших к-вах данных
    app.use(bodyParser.raw({limit: '524288000'}));
    app.use(cookieParser());
    // app.use(
    //     sassMiddleware({
    //         src        : __dirname + '/public/stylesheets/sass',
    //         dest       : __dirname + '/public/stylesheets/css',
    //         debug      : false,
    //         outputStyle: 'compressed',
    //         force      : true
    //     })
    // );
    app.use(express.static(path.join(__dirname, 'public')));

    // app.use(session({
    //     secret           : 'mySecretGeniusKey',
    //     resave           : true,
    //     saveUninitialized: true,
    //     store            : new MongoStore({
    //         db                : config.get('dbName'),
    //         mongooseConnection: mongoose.connection,
    //         clear_interval    : 10 * 60, //интервал очистки просроченых сессий (в секундах)
    //         autoRemove        : 'native'
    //     })
    // }));
    // app.use(passport.initialize());
    // app.use(passport.session());
    // app.use(flash());

    //Routers
    // main controller for routes
    var router = require('./routes/index'); // load router.js and pass in app and passport
    app.use('/', router);


    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        res.sendStatus(404);
        // res.render('error404', {url: req.url});
    });

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        //res.status(err.status || 500);
        eLogger.error(err);
        res.sendStatus(500);
        // res.render('error500', {
        //     code   : res.statusCode,
        //     message: err.message
        // });
    });

    // Listen to messages sent from the master. Ignore everything else.
    process.on('message', function (message, connection) {
        if (message !== 'sticky-session:connection') {
            return;
        }

        // Emulate a connection event on the server by emitting the
        // event with the connection the master sent us.
        server.emit('connection', connection);

        connection.resume();
    });
}