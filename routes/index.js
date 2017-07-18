var express = require('express');
var fs = require('fs');
var router = express.Router();
var async = require('async');

var wLogger = require('../lib/logger').wLogger;
var eLogger = require('../lib/logger').eLogger;
var iLogger = require('../lib/logger').iLogger;

var multer = require('multer');
var storageFiles = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/upload/');
    },
    filename   : function (req, file, callback) {
        var date = new Date();
        var dateStr = date.getDate() + (date.getMonth() + 1) + date.getFullYear() + '_' + date.getHours() + date.getMinutes() + date.getSeconds();
        callback(null, dateStr + '_' + file.originalname);
    }
});

var dbConnect = require('../lib/mysql').connection;

var Detail = require('../classes/detail').Detail;
var Row = require('../classes/row').Row;
var Material = require('../classes/material').Material;
var Options = require('../classes/options').Options;

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('start');
});

router.post('/newModel', function (req, res) {
    var uploadFile = multer({storage: storageFiles}).fields([{name: 'file'}]);

    uploadFile(req, res, function (err) {
        if (err) {
            eLogger.error(err);
            res.sendStatus(500);
        } else {
            if (res.req.files && (res.req.files.file.length > 0)) {
                var modelID;

                var model = {};
                var details = [];

                var array = fs.readFileSync(res.req.files.file[0].path).toString().split('\n');

                var currPos = 0;

                for (var i = 0; i < array.length; i++) {
                    var line = array[i];

                    //Сохраняем 3 первых статических поля
                    if (i < 3) {
                        if (i === 0) {
                            model.name = line;
                        } else if (i === 1) {
                            model.serviceInfo = line;
                        } else if (i === 2) {
                            model.detailsNum = parseInt(line, 10);
                        }
                    } else {
                        if (i < (3 + model.detailsNum)) {
                            details.push({
                                name  : line,
                                points: []
                            });
                        } else if ((i > (3 + model.detailsNum - 1)) && (i <= (3 + 2 * model.detailsNum - 1))) {
                            var j = i - model.detailsNum - 3;
                            details[j].count = line.split(' ')[0];
                            details[j].demand = line.split(' ')[1];
                        } else if (i > (3 + 2 * model.detailsNum - 1)) {
                            var totalPoints = 0;
                            for (var k = 0; k < details.length; k++) {
                                totalPoints += parseInt(details[k].count, 10);
                                if ((currPos < totalPoints) && (currPos >= (totalPoints - details[k].count))) {
                                    details[k].points.push({
                                        X: line.split(' ')[0],
                                        Y: line.split(' ')[1]
                                    });
                                }
                            }
                            currPos++;
                        }
                    }
                }

                details.forEach(function (detail) {
                    var width = 0;
                    var height = 0;
                    var square = 0;

                    var minX = 0;
                    var maxX = 0;
                    var minY = 0;
                    var maxY = 0;
                    detail.points.forEach(function (point) {
                        if (parseInt(point.X, 10) < minX) {
                            minX = parseInt(point.X, 10);
                        }

                        if (parseInt(point.X, 10) > maxX) {
                            maxX = parseInt(point.X, 10);
                        }

                        if (parseInt(point.Y, 10) < minY) {
                            minY = parseInt(point.Y, 10);
                        }

                        if (parseInt(point.Y, 10) > maxY) {
                            maxY = parseInt(point.Y, 10);
                        }
                    });

                    //Ставим точки против часовой стрелки
                    detail.points = bypass(detail.points);

                    //Сдвигаем центр детали в (0; 0)
                    var xc = (maxX + minX) / 2;
                    var yc = (maxY + minY) / 2;
                    for (var i = 0; i < detail.points.length; i++) {
                        detail.points[i].X = detail.points[i].X - xc;
                        detail.points[i].Y = detail.points[i].Y - yc;
                    }

                    width = Math.abs(maxX - minX);
                    height = Math.abs(maxY - minY);
                    square = width * height;

                    detail.width = width;
                    detail.height = height;
                    detail.square = square;
                });

                var modelCommand = 'INSERT INTO `model` (`name`, `description`, `service_info`) VALUES("' + model.name + '", "", "' + model.serviceInfo + '");';
                dbConnect.query(modelCommand, function (error, results, fields) {
                    if (error) {
                        eLogger.error(error);
                        res.sendStatus(500);
                    } else {
                        modelID = results.insertId;

                        async.eachSeries(details, function (detail, callback) {
                                var detailCommand = 'INSERT INTO `detail`' +
                                    '(`model_id`,' +
                                    '`name`,' +
                                    '`description`,' +
                                    '`points_num`,' +
                                    '`width`,' +
                                    '`height`,' +
                                    '`depth`,' +
                                    '`anyzotropy`,' +
                                    '`square`,' +
                                    '`demand`)' +

                                    'VALUES' +
                                    '("' + modelID + '",' +
                                    '"' + detail.name + '",' +
                                    '"",' +
                                    '"' + detail.count + '",' +
                                    '"' + detail.width + '",' +
                                    '"' + detail.height + '",' +
                                    '"0",' +
                                    '"0",' +
                                    '"' + detail.square + '",' +
                                    '"' + detail.demand + '");';

                                dbConnect.query(detailCommand, function (error, results, fields) {
                                    if (error) {
                                        eLogger.error(error);
                                        res.sendStatus(500);
                                    } else {
                                        var detailID = results.insertId;

                                        var pointsSetCommand = 'INSERT INTO `points_set`' +
                                            '(`name`,' +
                                            '`detail_id`)' +
                                            'VALUES' +
                                            '("",' +
                                            '"' + detailID + '");';

                                        dbConnect.query(pointsSetCommand, function (error, results, fields) {
                                            if (error) {
                                                eLogger.error(error);
                                                res.sendStatus(500);
                                            } else {
                                                var pointsSetID = results.insertId;

                                                async.eachSeries(detail.points, function (point, callback2) {
                                                    var pointCommand = 'INSERT INTO `point`' +
                                                        '(`point_set_id`,' +
                                                        '`X`,' +
                                                        '`Y`,' +
                                                        '`priority`)' +
                                                        'VALUES' +
                                                        '("' + pointsSetID + '",' +
                                                        '"' + point.X + '",' +
                                                        '"' + point.Y + '",' +
                                                        '"0");';

                                                    dbConnect.query(pointCommand, function (error, results, fields) {
                                                        if (error) {
                                                            eLogger.error(error);
                                                            res.sendStatus(500);
                                                        } else {
                                                            callback2();
                                                        }
                                                    });
                                                });
                                            }
                                        });

                                        callback();
                                    }
                                });
                            },
                            function (err) {
                                res.redirect('/models/' + modelID);
                            });
                    }
                });
            } else {
                res.sendStatus(200);
            }
        }
    });
});

//Функция обхода точек (проверка условия расположения против часовой стрелки)
function bypass(points) {
    var result = [];
    var n1 = Math.floor(points.length / 3);
    var n2 = Math.ceil(2 * points.length / 3);

    var AB = {
        X: points[n1].X - points[0].X,
        Y: points[n1].Y - points[0].Y
    };
    var BC = {
        X: points[n2].X - points[n1].X,
        Y: points[n2].Y - points[n1].Y
    };

    var ABxBC = AB.X * BC.Y - BC.X * AB.Y;

    if (ABxBC >= 0) {//поворот против часовой стрелки
        return points;
    } else {
        var totalPoints = points.length - 1;

        while (totalPoints >= 0) {
            result.push(points[totalPoints]);
            totalPoints--;
        }

        return result;
    }
}

router.get('/models', function (req, res, next) {
    dbConnect.query('SELECT * FROM model', function (error, results, fields) {
        if (error) {
            eLogger.error(error);
            res.sendStatus(500);
        } else {
            res.render('models', {
                models: results
            });
        }
    });
});

router.get('/models/:id', function (req, res) {
    async.parallel([
        function (callback) {
            var modelSelectCommand = 'SELECT * FROM `model` WHERE `model`.`id` = ' + parseInt(req.params.id, 10) + ';';

            dbConnect.query(modelSelectCommand, function (error, results, fields) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, results);
                }
            });
        },
        function (callback) {
            var modelSelectCommand = 'SELECT * FROM `detail` WHERE `model_id` = ' + parseInt(req.params.id, 10) + ';';

            dbConnect.query(modelSelectCommand, function (error, results, fields) {
                if (error) {
                    callback(error, null);
                } else {
                    var details = [];

                    async.eachSeries(results, function (result, res_callback) {
                        var detail = {
                            id         : result.id,
                            model_id   : result.model_id,
                            name       : result.name,
                            description: result.description,
                            points_num : result.points_num,
                            width      : result.width,
                            height     : result.height,
                            depth      : result.height,
                            anyzotropy : result.anyzotropy,
                            square     : result.square,
                            demand     : result.demand,
                            points     : []
                        };

                        var pointsSetSelectCommand = 'SELECT * FROM points_set WHERE points_set.detail_id = ' + detail.id + ';';
                        dbConnect.query(pointsSetSelectCommand, function (error, results, fields) {
                            if (error) {
                                res_callback(error);
                            } else {
                                var pointsSelectCommand = 'SELECT * FROM point WHERE point_set_id = ' + results[0].id + ';';
                                dbConnect.query(pointsSelectCommand, function (error, results, fields) {
                                    if (error) {
                                        res_callback(error);
                                    } else {
                                        results.forEach(function (r) {
                                            detail.points.push({
                                                X       : r.X,
                                                Y       : r.Y,
                                                priority: r.priority
                                            });
                                        });

                                        details.push(detail);
                                        res_callback();
                                    }
                                });
                            }
                        });
                    }, function (err) {
                        if (err) {
                            eLogger.error(err);
                            callback(err, null);
                        } else {
                            callback(null, details);
                        }
                    });

                }
            });
        }
    ], function (err, results) {
        if (err) {
            eLogger.error(err);
            res.sendStatus(500);
        } else {
            res.render('model', {
                model  : results[0][0],
                details: results[1]
            });
        }
    });
});

router.get('/set/:id', function (req, res) {
    res.render('set', {
        rows: null
    });
});

router.post('/generate', function (req, res) {
    var material = new Material(req.body.matWidth, req.body.matHeight, req.body.matDepth);
    var options = new Options(req.body.edgeDistance, req.body.detailsBridge);

    var whereArray = '';
    var details_ids = [];
    for (var key in req.body) {
        if (key.indexOf('detail-') > -1) {
            details_ids.push(key.split('-')[1]);
        }
    }

    details_ids.forEach(function (id) {
        whereArray += '"' + id + '"';
        if (details_ids.indexOf(id) !== (details_ids.length - 1)) {
            whereArray += ', ';
        }
    });

    var detailsSelectCommand = 'SELECT * FROM `cutting`.`detail` INNER JOIN `points_set` ON `detail`.`id`=`points_set`.`detail_id` INNER JOIN `point` ON `points_set`.`id`=`point`.`point_set_id` WHERE `detail`.`id` IN (' + whereArray + ');';
    dbConnect.query(detailsSelectCommand, function (error, results, fields) {
        if (error) {
            eLogger.error(error);
            res.sendStatus(500);
        } else {
            var details = [];

            var detailsLoc = [];
            // var details = results;

            results.forEach(function (result) {
                var currDetailIndex = -1;
                for (var i = 0; i < detailsLoc.length; i++) {
                    if (currDetailIndex === -1) {
                        if (parseInt(result.detail_id, 10) === parseInt(detailsLoc[i].detail_id, 10)) {
                            currDetailIndex = i;
                        }
                    }
                }

                if (currDetailIndex >= 0) {
                    detailsLoc[currDetailIndex].points.push({
                        x: result.X,
                        y: result.Y
                    });
                } else {
                    detailsLoc.push({
                        detail_id  : result.detail_id,
                        name       : result.name,
                        description: result.description,
                        anyzotropy : result.anyzotropy,
                        demand     : result.demand,
                        depth      : result.depth,
                        width      : result.width,
                        height     : result.height,
                        points     : [{
                            x: result.X,
                            y: result.Y
                        }]
                    });
                }
            });

            detailsLoc.forEach(function (detailLoc) {
                var detail = new Detail(detailLoc.detail_id, detailLoc.name, detailLoc.description, detailLoc.anyzotropy,
                    detailLoc.demand, detailLoc.depth, detailLoc.width, detailLoc.height, detailLoc.points);
                detail.updatePolarPoint();
                details.push(detail);
            });

            var materialInsertCommand = 'INSERT INTO `material` ' +
                '(`name`, ' +
                '`description`, ' +
                '`width`, ' +
                '`height`, ' +
                '`depth`,' +
                '`anyzotropy`,' +
                '`square`)' +
                'VALUES' +
                '("Матеріал",' +
                '"Матеріал",' +
                material.width + ',' +
                material.height + ',' +
                material.depth + ',' +
                '0,' +
                material.square +
                ');';

            dbConnect.query(materialInsertCommand, function (error, results, fields) {
                if (error) {
                    eLogger.error(error);
                    res.sendStatus(500);
                } else {
                    generateRows(details, material, options, function (err, rows) {
                        if (err) {
                            eLogger.error(err);
                            res.sendStatus(500);
                        } else {
                            console.log(rows);
                            res.render('rows_temp', {
                                rows    : rows,
                                material: material
                            });
                            //res.redirect('/schemes/0');
                            // res.render('schemes', {
                            //     rows: rows
                            // });
                            // res.send(rows);
                        }
                    });
                    /*generate(details, material, function (err, set) {
                     if (err) {
                     eLogger.error(err);
                     res.sendStatus(500);
                     } else {
                     res.send(details);
                     }
                     });*/
                }
            });
        }
    })
    ;
});

function generate(details, material, options, callback) {
    generateRows(details, material, options, function (err, rows) {
        if (err) {
            callback(err, null);
        } else {
            generateLayouts(rows, material, options, function (err, layouts) {
                if (err) {
                    callback(err, null);
                } else {
                    generateSections(layouts, material, options, function (err, sections) {
                        if (err) {
                            callback(err, null);
                        } else {
                            generateScheme(sections, material, options, function (err, schemes) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    generateSet(schemes, material, options, function (err, set) {
                                        if (err) {
                                            callback(err, null);
                                        } else {
                                            callback(null, set);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function generateRows(details, material, options, callback) {
    var rows = [];
    details.forEach(function (detail) {
        var row = new Row(detail, material, options);
        var currentRow = row;
        var addedRow = false;

        for (var i = 0; i < detail.demand; i++) {
            if (!currentRow.add()) {
                rows.push(currentRow);
                currentRow = new Row(detail, material, options);
                currentRow.add();

                addedRow = true;
            } else {
                addedRow = false;
            }
        }

        if (!addedRow) {
            rows.push(currentRow);
        }
    });

    callback(null, rows);
}

function generateLayouts(rows, material, options, callback) {

}

function generateSections(layouts, material, options, callback) {

}

function generateScheme(sections, material, options, callback) {

}

function generateSet(scheme, material, options, callback) {

}

module.exports = router;
