/**
 * Created by Il Yeup, Ahn in KETI on 2017-02-23.
 */

/**
 * Copyright (c) 2018, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


let fs = require("fs");
var ip = require("ip");
var z2m_conf_init = require('./z2m_conf_init.js');
// var z2m_conf = JSON.parse(fs.readFileSync('./z2m_configuration.json', 'utf8'));
var z2m_conf = z2m_conf_init();


/* z2m_conf obj key list
- base_topic --> z2m mqtt base topic
- mqtt_server --> z2m application connecting mqtt server ip + port
- device_list --> somethings that was Registerd z2m GW */

var conf = {};
var cse = {};
var ae = {};
var cnt_arr = [];
var sub_arr = [];
var acp = {};

conf.useprotocol = 'http'; // select one for 'http' or 'mqtt' or 'coap' or 'ws'
// --> 처리

conf.sim = 'disable'; // enable / disable   --> 처리

// configuration that to connect the cse resource
cse.host        = 'localhost';
cse.port        = '7579';
cse.name        = 'Mobius';
cse.id          = '/Mobius2';
cse.mqttport    = '1883';
cse.wsport      = '7577';

// configuration that to build the cse resource
//ae.name         = 'zigbee2mqtt';
ae.name         = z2m_conf.base_topic
ae.id           = 'S'+ae.name;
ae.parent       = '/' + cse.name;
ae.appid        = 'zigbee.apid';
ae.port         = '9727';
ae.bodytype     = 'json'; // select 'json' or 'xml' or 'cbor'
ae.tasport      = '3105';

// build cnt conf
var cnt_count = 0;
z2m_device_list = Object.keys(z2m_conf.device_list);
while (cnt_count < z2m_device_list.length){
    cnt_arr[cnt_count] = {};
    cnt_arr[cnt_count].parent = '/' + cse.name + '/' + ae.name;
    cnt_arr[cnt_count].name = z2m_device_list[cnt_count];
    cnt_count++;
}

acp.parent = '/' + cse.name + '/' + ae.name;
acp.name = 'acp-' + ae.name;
acp.id = ae.id;

conf.usesecure  = 'disable';

if(conf.usesecure === 'enable') {
    cse.mqttport = '8883';
}

conf.cse = cse;
conf.ae = ae;
conf.cnt = cnt_arr;
conf.sub = sub_arr;
conf.acp = acp;


module.exports = conf;
