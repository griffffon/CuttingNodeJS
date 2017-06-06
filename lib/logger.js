/**
 * Created by Grigoriy on 15.06.2016.
 */
var log4js = require('log4js');
var config = require('./../config/config');
log4js.configure(config.get('logger'));

var wLogger = log4js.getLogger('warnings-logger');
var eLogger = log4js.getLogger('errors-logger');
var iLogger = log4js.getLogger('info-logger');
var getResponseLogger = log4js.getLogger('getResponse-logger');
var smsLogger = log4js.getLogger('sms-logger');

wLogger.setLevel('WARN');
eLogger.setLevel('ERROR');
iLogger.setLevel('INFO');
getResponseLogger.setLevel('INFO');
smsLogger.setLevel('INFO');

exports.wLogger = wLogger;
exports.eLogger = eLogger;
exports.iLogger = iLogger;
exports.getResponseLogger = getResponseLogger;
exports.smsLogger = smsLogger;