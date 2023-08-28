/**
 * Copyright (c) 2018, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Created by ryeubi on 2015-08-31.
 */

let fs = require('fs');
let express = require('express');
let http = require('http');
let mqtt = require('mqtt');

let bodyParser = require('body-parser');
let url = require('url');
let util = require('util');

let js2xmlparser = require("js2xmlparser");
let xml2js = require('xml2js');
let shortid = require('shortid');
let cbor = require('cbor');

let EventEmitter = require('events');

let app = express();
let server = null;

let mqtt_sub_client = null;

global.callback_q = {};
let count_q = {};

let onem2m_options = {};
let _this = null;

// module.exports = Onem2mClient;
function Onem2mClient(options) {
    onem2m_options = options;

    EventEmitter.call(this);

    _this = this;

    if (options.protocol === 'mqtt') {
        mqtt_init();
    }
}

Onem2mClient.prototype = new EventEmitter();

let proto = Onem2mClient.prototype;

function http_request(path, method, ty, bodyString, callback) {
    let options = {
        hostname: onem2m_options.host,
        port: onem2m_options.port,
        path: path,
        method: method,
        headers: {
            'X-M2M-RI': shortid.generate(),
            'Accept': 'application/' + onem2m_options.bodytype,
            'X-M2M-Origin': onem2m_options.aei,
            'Locale': 'en'
        }
    };

    if (bodyString.length > 0) {
        options.headers['Content-Length'] = bodyString.length;
    }

    if (method === 'post') {
        let a = (ty === '') ? '' : ('; ty=' + ty);
        options.headers['Content-Type'] = 'application/vnd.onem2m-res+' + onem2m_options.bodytype + a;
    }
    else if (method === 'put') {
        options.headers['Content-Type'] = 'application/vnd.onem2m-res+' + onem2m_options.bodytype;
    }

    if (onem2m_options.usesecure === 'enable') {
        options.ca = fs.readFileSync('ca-crt.pem');
        options.rejectUnauthorized = false;

        let http = require('https');
    }
    else {
        http = require('http');
    }

    let res_body = '';
    let req = http.request(options, function (res) {
        //console.log('[crtae response : ' + res.statusCode);
        //res.setEncoding('utf8');

        res.on('data', function (chunk) {
            res_body += chunk;
        });

        res.on('end', function () {
            try {
                jsonObj = JSON.parse(res_body);
                callback(res, jsonObj);
            }
            catch (e) {
                console.log('[http_adn] json parse error]');
                let jsonObj = {};
                jsonObj.dbg = res_body;
                callback(res, jsonObj);
            }
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });

    //console.log(bodyString);
    console.log(path);
    req.write(bodyString);
    req.end();
};

let crtae = function (parent, rn, api, callback) {
    if (onem2m_options.protocol === 'http') {
        let results_ae = {};
        let bodyString = '';
        results_ae['m2m:ae'] = {};
        results_ae['m2m:ae'].api = api;
        results_ae['m2m:ae'].rn = rn;
        results_ae['m2m:ae'].rr = true;
        //results_ae['m2m:ae'].acpi = '/mobius-yt/acp1';
        bodyString = JSON.stringify(results_ae);
        http_request(parent, 'post', '2', bodyString, function (res, res_body) {
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        let rqi = shortid.generate();

        callback_q[rqi] = callback;

        resp_mqtt_ri_arr.push(rqi);
        resp_mqtt_path_arr[rqi] = parent;

        let req_message = {};
        req_message['m2m:rqp'] = {};
        req_message['m2m:rqp'].op = '1'; // create
        req_message['m2m:rqp'].to = parent;
        req_message['m2m:rqp'].fr = onem2m_options.aei;
        req_message['m2m:rqp'].rqi = rqi;
        req_message['m2m:rqp'].ty = '2'; // ae
        req_message['m2m:rqp'].pc = {};
        req_message['m2m:rqp'].pc['m2m:ae'] = {};
        req_message['m2m:rqp'].pc['m2m:ae'].rn = rn;
        req_message['m2m:rqp'].pc['m2m:ae'].api = api;
        req_message['m2m:rqp'].pc['m2m:ae'].rr = 'true';
        // data type 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }
};

let rtvae = function (target, callback) {
    if (onem2m_options.protocol === 'http') {
        http_request(target, 'get', '', '', function (res, res_body) {
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        let rqi = shortid.generate();

        callback_q[rqi] = callback;

        resp_mqtt_ri_arr.push(rqi);
        resp_mqtt_path_arr[rqi] = target;

        let req_message = {};
        req_message['m2m:rqp'] = {};
        req_message['m2m:rqp'].op = '2'; // retrieve
        req_message['m2m:rqp'].to = target;
        req_message['m2m:rqp'].fr = onem2m_options.aei;
        req_message['m2m:rqp'].rqi = rqi;
        req_message['m2m:rqp'].pc = {};
         // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));
        console.log(req_topic + ' (json) ---->');
    }
};

let udtae = function (target, callback) {
    if (onem2m_options.protocol === 'http') {
        let bodyString = '';
        let results_ae = {};
        results_ae['m2m:ae'] = {};
        results_ae['m2m:ae'].lbl = 'seahorse';
        bodyString = JSON.stringify(results_ae);

        http_request(target, 'put', '', bodyString, function (res, res_body) {
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        // to do
    }
    else if (onem2m_options.protocol === 'coap') {
        // to do
    }
    else if (onem2m_options.protocol === 'ws') {
        // to do
    }
};

let delae = function (target, callback) {
    if (onem2m_options.protocol === 'http') {
        http_request(target, 'delete', '', '', function (res, res_body) {
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        // to do
    }
    else if (onem2m_options.protocol === 'coap') {
        // to do
    }
    else if (onem2m_options.protocol === 'ws') {
        // to do
    }
};

let z2m_crtct = function (parent, rn) {
    if (onem2m_options.protocol === 'http') {
        let results_ct = {};

        let bodyString = '';
        results_ct['m2m:cnt'] = {};
        results_ct['m2m:cnt'].rn = rn;
        results_ct['m2m:cnt'].lbl = [rn];
        bodyString = JSON.stringify(results_ct);
        console.log(bodyString);

        http_request(parent, 'post', '3', bodyString, function (res, res_body) {
            console.log(' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(res_body);
        });
    }
};

let z2m_rtvct = function (target, count, callback) {
    if (onem2m_options.protocol === 'http') {
        http_request(target, 'get', '', '', function (res, res_body) {
            console.log(count + ' - ' + target + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(res_body);
            callback(res.headers['x-m2m-rsc'], res_body, count);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        let rqi = shortid.generate();

        callback_q[rqi] = callback;

        resp_mqtt_ri_arr.push(rqi);
        resp_mqtt_path_arr[rqi] = target;

        let req_message = {};
        req_message['m2m:rqp'] = {};
        req_message['m2m:rqp'].op = '2'; // retrieve
        req_message['m2m:rqp'].to = target;
        req_message['m2m:rqp'].fr = onem2m_options.aei;
        req_message['m2m:rqp'].rqi = rqi;
        req_message['m2m:rqp'].pc = {};
        // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));
        console.log(req_topic + ' (json) ---->');
    }
};

let z2m_udtct = function (target, lbl, callback) {
    console.log("udtct 이제 들어옴", lbl)
    if (onem2m_options.protocol === 'http') {
        let results_ct = {};
        let bodyString = '';
        results_ct['m2m:cnt'] = {};
        results_ct['m2m:cnt'].lbl = [lbl];
        bodyString = JSON.stringify(results_ct);
        console.log(bodyString, '  type JSON');
        console.log(typeof bodyString)

        http_request(target, 'put', '', bodyString, function (res, res_body) {
            console.log(' - ' + target + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        // to do
    }
    else if (onem2m_options.protocol === 'coap') {
        // to do
    }
    else if (onem2m_options.protocol === 'ws') {
        // to do
    }
};

let z2m_delct = function (target, callback) {
    if (onem2m_options.protocol === 'http') {
        http_request(target, 'delete', '', '', function (res, res_body) {
            console.log(' - ' + target + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        // to do
    }
    else if (onem2m_options.protocol === 'coap') {
        // to do
    }
    else if (onem2m_options.protocol === 'ws') {
        // to do
    }
};

let z2m_crtci = function (parent, content, callback) {  // proto.create_z2m_cin = z2m_crtci;
    if (onem2m_options.protocol === 'http') {
        let results_ci = {};
        let bodyString = '';
        results_ci['m2m:cin'] = {};
        results_ci['m2m:cin'].con = content;

        bodyString = JSON.stringify(results_ci);

        http_request(parent, 'post', '4', bodyString, function (res, res_body) {
            callback(res.headers['x-m2m-rsc'], res_body, parent);
        });
    }
};

let crtsub = function (parent, rn, nu, count, callback) {
    if (onem2m_options.protocol === 'http') {
        let results_ss = {};
        let bodyString = '';
        results_ss['m2m:sub'] = {};
        results_ss['m2m:sub'].rn = rn;
        results_ss['m2m:sub'].enc = { net: [1, 2, 3, 4] };
        results_ss['m2m:sub'].nu = [nu];
        results_ss['m2m:sub'].nct = 2;
        //results_ss['m2m:sub'].exc = 0;

        bodyString = JSON.stringify(results_ss);
        console.log(bodyString);

        http_request(parent, 'post', '23', bodyString, function (res, res_body) {
            console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(JSON.stringify(res_body));
            callback(res.headers['x-m2m-rsc'], res_body, count);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        let rqi = shortid.generate();

        callback_q[rqi] = callback;
        count_q[rqi] = count;

        resp_mqtt_ri_arr.push(rqi);
        resp_mqtt_path_arr[rqi] = parent;

        let req_message = {};
        req_message['m2m:rqp'] = {};
        req_message['m2m:rqp'].op = '1'; // create
        req_message['m2m:rqp'].to = parent;
        req_message['m2m:rqp'].fr = onem2m_options.aei;
        req_message['m2m:rqp'].rqi = rqi;
        req_message['m2m:rqp'].ty = '23'; // sub
        req_message['m2m:rqp'].pc = {};
        req_message['m2m:rqp'].pc['m2m:sub'] = {};
        req_message['m2m:rqp'].pc['m2m:sub'].rn = rn;
        req_message['m2m:rqp'].pc['m2m:sub'].enc = {};
        req_message['m2m:rqp'].pc['m2m:sub'].enc.net = [];
        req_message['m2m:rqp'].pc['m2m:sub'].enc.net.push('3');
        req_message['m2m:rqp'].pc['m2m:sub'].nu = [];
        req_message['m2m:rqp'].pc['m2m:sub'].nu.push(nu);
        req_message['m2m:rqp'].pc['m2m:sub'].nct = '2';
        // 'json'
        mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));

        console.log(req_topic + ' (json) ' + JSON.stringify(req_message['m2m:rqp']) + ' ---->');
    }

    if (url.parse(nu).protocol === 'http:') {
        if (!server) {
            server = http.createServer(app);
            server.listen(url.parse(nu).port, function () {
                console.log('http_server running at ' + onem2m_options.aeport + ' port');
            });
        }
    }
    else if (url.parse(nu).protocol === 'mqtt:') {
        let noti_topic = util.format('/oneM2M/req/+/%s/#', onem2m_options.aei);
        mqtt_connect(url.parse(nu).host, url.parse(nu).port, noti_topic);
    }
};

let delsub = function (target, count, callback) {
    if (onem2m_options.protocol === 'http') {
        http_request(target, 'delete', '', '', function (res, res_body) {
            console.log(count + ' - ' + target + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(res_body);
            callback(res.headers['x-m2m-rsc'], res_body, count);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        let rqi = shortid.generate();

        callback_q[rqi] = callback;
        count_q[rqi] = count;

        resp_mqtt_ri_arr.push(rqi);
        resp_mqtt_path_arr[rqi] = target;

        let req_message = {};
        req_message['m2m:rqp'] = {};
        req_message['m2m:rqp'].op = '4'; // delete
        req_message['m2m:rqp'].to = target;
        req_message['m2m:rqp'].fr = onem2m_options.aei;
        req_message['m2m:rqp'].rqi = rqi;
        req_message['m2m:rqp'].pc = {};
         // 'json'
            mqtt_client.publish(req_topic, JSON.stringify(req_message['m2m:rqp']));
            console.log(req_topic + ' (json) ---->');
    }
};

let z2m_crtfcnt_device = function (parent, rn, device_type) { // device_type 받고 여기서 cnd 분배 parent = AE 링크로 받고 끝은 / 없이
    // ex) http://localhost:7579/Mobius/sdt_ae
    let cnd = "org.onem2m.home.device." + device_type
    if (onem2m_options.protocol === 'http') {
        let results_ct = {};
        let bodyString = '';

        results_ct['m2m:fcnt'] = {};
        results_ct['m2m:fcnt'].rn = rn;
        results_ct['m2m:fcnt'].cnd = cnd
        bodyString = JSON.stringify(results_ct);
        console.log(bodyString);

        http_request(parent, 'post', '28', bodyString, function (res, res_body) {
            console.log(' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(res_body);
        });
    }
};

let z2m_crtfcnt_module = function (parent, rn, module_type) { // module_type 받고 여기서 cnd 분배
    if (onem2m_options.protocol === 'http') {
        let results_ct = {};

        let bodyString = '';
        results_ct['m2m:fcnt'] = {};
        results_ct['m2m:fcnt'].rn = rn;
        bodyString = JSON.stringify(results_ct);
        console.log(bodyString);

        http_request(parent, 'post', '28', bodyString, function (res, res_body) {
            console.log(' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            console.log(res_body);
        });
    }
};

let z2m_udtfcnt_module = function (target, state, module_type, callback) { // state, module_type 받고 -> index 지정 후 value 입력 
    if (onem2m_options.protocol === 'http') {
        let results_ct = {};
        let bodyString = '';
        results_ct['m2m:cnt'] = {};
        results_ct['m2m:cnt'].lbl = [lbl];
        bodyString = JSON.stringify(results_ct);
        console.log(bodyString, '  type JSON');
        console.log(typeof bodyString)

        http_request(target, 'put', '', bodyString, function (res, res_body) {
            console.log(' - ' + target + ' - x-m2m-rsc : ' + res.headers['x-m2m-rsc'] + ' <----');
            callback(res.headers['x-m2m-rsc'], res_body);
        });
    }
    else if (onem2m_options.protocol === 'mqtt') {
        // to do
    }
    else if (onem2m_options.protocol === 'coap') {
        // to do
    }
    else if (onem2m_options.protocol === 'ws') {
        // to do
    }
};



// for notification
//let xmlParser = bodyParser.text({ type: '*/*' });

let parse_sgn = function (rqi, pc, callback) {
    if (pc.sgn) {
        let nmtype = pc['sgn'] != null ? 'short' : 'long';
        let sgnObj = {};
        let cinObj = {};
        sgnObj = pc['sgn'] != null ? pc['sgn'] : pc['singleNotification'];

        if (nmtype === 'long') {
            console.log('oneM2M spec. define only short name for resource')
        }
        else { // 'short'
            if (sgnObj.sur) {
                if (sgnObj.sur.charAt(0) != '/') {
                    sgnObj.sur = '/' + sgnObj.sur;
                }
                let path_arr = sgnObj.sur.split('/');
            }

            if (sgnObj.nev) {
                if (sgnObj.nev.rep) {
                    if (sgnObj.nev.rep['m2m:cin']) {
                        sgnObj.nev.rep.cin = sgnObj.nev.rep['m2m:cin'];
                        delete sgnObj.nev.rep['m2m:cin'];
                    }

                    if (sgnObj.nev.rep.cin) {
                        cinObj = sgnObj.nev.rep.cin;
                    }
                    else {
                        console.log('[mqtt_noti_action] m2m:cin is none');
                        cinObj = null;
                    }
                }
                else {
                    console.log('[mqtt_noti_action] rep tag of m2m:sgn.nev is none. m2m:notification format mismatch with oneM2M spec.');
                    cinObj = null;
                }
            }
            else if (sgnObj.sud) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.sud = sgnObj.sud;
            }
            else if (sgnObj.vrq) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.vrq = sgnObj.vrq;
            }

            else {
                console.log('[mqtt_noti_action] nev tag of m2m:sgn is none. m2m:notification format mismatch with oneM2M spec.');
                cinObj = null;
            }
        }
    }
    else {
        console.log('[mqtt_noti_action] m2m:sgn tag is none. m2m:notification format mismatch with oneM2M spec.');
        console.log(pc);
    }

    callback(path_arr, cinObj, rqi);
};


let response_mqtt = function (rsp_topic, rsc, to, fr, rqi, inpc, bodytype) {
    let rsp_message = {};
    rsp_message['m2m:rsp'] = {};
    rsp_message['m2m:rsp'].rsc = rsc;
    rsp_message['m2m:rsp'].to = to;
    rsp_message['m2m:rsp'].fr = fr;
    rsp_message['m2m:rsp'].rqi = rqi;
    rsp_message['m2m:rsp'].pc = inpc;
    // 'json'
    mqtt_sub_client.publish(rsp_topic, JSON.stringify(rsp_message['m2m:rsp']));
};

let mqtt_noti_action = function (topic_arr, jsonObj) {
    if (jsonObj != null) {
        let bodytype = onem2m_options.bodytype;
        if (topic_arr[5] != null) {
            bodytype = topic_arr[5];
        }

        let op = (jsonObj['m2m:rqp']['op'] == null) ? '' : jsonObj['m2m:rqp']['op'];
        let to = (jsonObj['m2m:rqp']['to'] == null) ? '' : jsonObj['m2m:rqp']['to'];
        let fr = (jsonObj['m2m:rqp']['fr'] == null) ? '' : jsonObj['m2m:rqp']['fr'];
        let rqi = (jsonObj['m2m:rqp']['rqi'] == null) ? '' : jsonObj['m2m:rqp']['rqi'];
        let pc = {};
        pc = (jsonObj['m2m:rqp']['pc'] == null) ? {} : jsonObj['m2m:rqp']['pc'];

        if (pc['m2m:sgn']) {
            pc.sgn = {};
            pc.sgn = pc['m2m:sgn'];
            delete pc['m2m:sgn'];
        }

        parse_sgn(rqi, pc, function (path_arr, cinObj, rqi) {
            if (cinObj) {
                if (cinObj.sud || cinObj.vrq) {
                    let resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                    response_mqtt(resp_topic, 2001, '', onem2m_options.aei, rqi, '', topic_arr[5]);
                }
                else {
                    resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                    response_mqtt(resp_topic, 2001, '', onem2m_options.aei, rqi, '', topic_arr[5]);

                    console.log('mqtt ' + bodytype + ' notification <----');

                    _this.emit('notification', path_arr.join('/'), cinObj);
                }
            }
        });
    }
    else {
        console.log('[mqtt_noti_action] message is not noti');
    }
};


let http_noti_action = function (rqi, pc, bodytype, response) {
    if (pc['m2m:sgn']) {
        pc.sgn = {};
        pc.sgn = pc['m2m:sgn'];
        delete pc['m2m:sgn'];
    }

    parse_sgn(rqi, pc, function (path_arr, cinObj, rqi) {
        if (cinObj) {
            if (cinObj.sud || cinObj.vrq) {
                response.setHeader('X-M2M-RSC', '2001');
                response.setHeader('X-M2M-RI', rqi);
                response.status(201).end('<h1>success to receive notification</h1>');
            }
            else {
                response.setHeader('X-M2M-RSC', '2001');
                response.setHeader('X-M2M-RI', rqi);
                response.status(201).end('<h1>success to receive notification</h1>');

                //console.log((cinObj.con != null ? cinObj.con : cinObj.content));
                console.log('http ' + bodytype + ' notification <----');

                _this.emit('notification', path_arr.join('/'), cinObj);
            }
        }
    });
};

function mqtt_connect(serverip, port, noti_topic) {
    if (mqtt_sub_client == null) {
        if (onem2m_options.usesecure === 'disable') {
            let connectOptions = {
                host: serverip,
                port: port,
                //              username: 'keti',
                //              password: 'keti123',
                protocol: "mqtt",
                keepalive: 10,
                //              clientId: serverUID,
                protocolId: "MQTT",
                protocolVersion: 4,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 2000,
                rejectUnauthorized: false
            };
        }
        else {
            connectOptions = {
                host: serverip,
                port: port,
                protocol: "mqtts",
                keepalive: 10,
                //              clientId: serverUID,
                protocolId: "MQTT",
                protocolVersion: 4,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 2000,
                key: fs.readFileSync("./server-key.pem"),
                cert: fs.readFileSync("./server-crt.pem"),
                rejectUnauthorized: false
            };
        }

        mqtt_sub_client = mqtt.connect(connectOptions);

        mqtt_sub_client.on('connect', function () {
            mqtt_sub_client.subscribe(noti_topic);
            console.log('[mqtt_connect] noti_topic : ' + noti_topic);
        });

        mqtt_sub_client.on('message', function (topic, message) {

            let topic_arr = topic.split("/");

            let bodytype = onem2m_options.bodytype;
            if (topic_arr[5] != null) {
                bodytype = (topic_arr[5] === 'xml') ? topic_arr[5] : ((topic_arr[5] === 'json') ? topic_arr[5] : ((topic_arr[5] === 'cbor') ? topic_arr[5] : 'json'));
            }

            if (topic_arr[1] === 'oneM2M' && topic_arr[2] === 'req' && topic_arr[4] === onem2m_options.aei) {
                console.log(message.toString());
                // json
                let jsonObj = JSON.parse(message.toString());

                if (jsonObj['m2m:rqp'] == null) {
                    jsonObj['m2m:rqp'] = jsonObj;
                }
                mqtt_noti_action(topic_arr, jsonObj);
            }
            else {
                console.log('topic is not supported');
            }
        });

        mqtt_sub_client.on('error', function (err) {
            console.log(err.message);
        });
    }
}

let onem2mParser = bodyParser.text(
    {
        limit: '1mb',
        type: 'application/onem2m-resource+xml;application/xml;application/json;application/vnd.onem2m-res+xml;application/vnd.onem2m-res+json'
    }
);

let noti_count = 0;

app.post('/:resourcename0', onem2mParser, function (request, response) {
    let fullBody = '';
    request.on('data', function (chunk) {
        fullBody += chunk.toString();
    });
    request.on('end', function () {
        request.body = fullBody;

        //console.log(fullBody);

        let content_type = request.headers['content-type'];
        if (content_type.includes('xml')) {
            let bodytype = 'xml';
        }
        else if (content_type.includes('cbor')) {
            bodytype = 'cbor';
        }
        else {
            bodytype = 'json';
        }
        if (bodytype === 'json') {
            try {
                let pc = JSON.parse(request.body);
                let rqi = request.headers['x-m2m-ri'];

                http_noti_action(rqi, pc, 'json', response);
            }
            catch (e) {
                console.log(e);
            }
        }
        else if (bodytype === 'cbor') {
            let encoded = request.body;
            cbor.decodeFirst(encoded, function (err, pc) {
                if (err) {
                    console.log('[http noti cbor parser error]');
                }
                else {
                    let rqi = request.headers['x-m2m-ri'];

                    http_noti_action(rqi, pc, 'cbor', response);
                }
            });
        }
        else {
            let parser = new xml2js.Parser({ explicitArray: false });
            parser.parseString(request.body, function (err, pc) {
                if (err) {
                    console.log('[http noti xml2js parser error]');
                }
                else {
                    let rqi = request.headers['x-m2m-ri'];

                    http_noti_action(rqi, pc, 'xml', response);
                }
            });
        }
    });
});


proto.create_ae = crtae;
proto.retrieve_ae = rtvae;
proto.update_ae = udtae;
proto.delete_ae = delae;

proto.create_z2m_cnt = z2m_crtct;
proto.retrieve_z2m_cnt = z2m_rtvct;
proto.update_z2m_cnt = z2m_udtct;
proto.delete_z2m_cnt = z2m_delct;
proto.create_z2m_cin = z2m_crtci;

proto.create_z2m_fcnt_device = z2m_crtfcnt_device; // parent, rn, device_type
proto.update_z2m_fcnt_device = z2m_udtfcnt_device;
proto.delete_z2m_fcnt_device = z2m_delfcnt_device;

proto.create_z2m_fcnt_module = z2m_crtfcnt_module; // parent, rn, module_type
proto.update_z2m_fcnt_module = z2m_udtfcnt_module; // target, state, module_type, callback
proto.delete_z2m_fcnt_module = z2m_delfcnt_module;


proto.create_sub = crtsub;
proto.delete_sub = delsub;

module.exports = Onem2m_handler;
