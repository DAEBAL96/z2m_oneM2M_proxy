var fs = require('fs');
var shortid = require('shortid');

global.resp_mqtt_ri_arr = [];
global.resp_mqtt_path_arr = {};
global.socket_q = {};

global.conf = require('./conf.js');
global.z2m_conf = require('./z2m_conf_init.js');

global.sh_state = 'crtae'; // z2m oneM2M resource Tree initializing
global.mqtt_client = null;

require('./z2m.js');