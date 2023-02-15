var z2m_conf_init = require('./z2m_conf_init.js');
var Onem2mClient = require('./onem2m_client');
var thyme_tas = require('./thyme_tas');
var mqtt = require("mqtt");


var z2m_conf = z2m_conf_init();
let fs = require("fs");
let yaml = require("js-yaml");
const client = mqtt.connect(z2m_conf.mqtt_server);
// const client = mqtt.connect("mqtt://localhost");

var options = {
    protocol: conf.useprotocol,
    host: conf.cse.host,
    port: conf.cse.port,
    mqttport: conf.cse.mqttport,
    wsport: conf.cse.wsport,
    cseid: conf.cse.id,
    aei: conf.ae.id,
    aeport: conf.ae.port,
    bodytype: conf.ae.bodytype,
    usesecure: conf.usesecure,
};

var onem2m_client = new Onem2mClient(options);


function ae_response_action(status, res_body, callback) {
    var aeid = res_body['m2m:ae']['aei'];
    conf.ae.id = aeid;
    callback(status, aeid);
}

function create_cnt_all(count, callback) {
    if(conf.cnt.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.cnt.hasOwnProperty(count)) {
            var parent = conf.cnt[count].parent;
            console.log(parent)
            var rn = conf.cnt[count].name;
            console.log(rn)
            onem2m_client.create_cnt(parent, rn, count, function (rsc, res_body, count) {
                if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
                    create_cnt_all(++count, function (status, count) {  // 재귀 함수로 계속 count 늘려나감
                        callback(status, count);
                    });
                }
                else {
                    callback(9999, count);
                }
            });
        }
        else {
            callback(2001, count); // 2001 반환하고, crtct 부분은 count++ 로 인해 count가 cnt.length 넘어서기에 함수 종료
        }
    }
}

function delete_sub_all(count, callback) {
    if(conf.sub.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.sub.hasOwnProperty(count)) {
            var target = conf.sub[count].parent + '/' + conf.sub[count].name;
            onem2m_client.delete_sub(target, count, function (rsc, res_body, count) {
                if (rsc == 5106 || rsc == 2002 || rsc == 2000 || rsc == 4105 || rsc == 4004) {
                    delete_sub_all(++count, function (status, count) {
                        callback(status, count);
                    });
                }
                else {
                    callback(9999, count);
                }
            });
        }
        else {
            callback(2001, count);
        }
    }
}

function create_sub_all(count, callback) {
    if(conf.sub.length == 0) {
        callback(2001, count);
    }
    else {
        if(conf.sub.hasOwnProperty(count)) {
            var parent = conf.sub[count].parent;
            var rn = conf.sub[count].name;
            var nu = conf.sub[count].nu;
            onem2m_client.create_sub(parent, rn, nu, count, function (rsc, res_body, count) {
                if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
                    create_sub_all(++count, function (status, count) {
                        callback(status, count);
                    });
                }
                else {
                    callback('9999', count);
                }
            });
        }
        else {
            callback(2001, count);
        }
    }
}

setTimeout(setup_resources, 100, 'crtae');

function setup_resources(_status) {
    sh_state = _status;
    
    console.log('[status] : ' + _status);

    if (_status === 'crtae') {
        onem2m_client.create_ae(conf.ae.parent, conf.ae.name, conf.ae.appid, function (status, res_body) {
            console.log(res_body);
            if (status == 2001) {
                ae_response_action(status, res_body, function (status, aeid) {
                    console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');
                    request_count = 0;

                    setTimeout(setup_resources, 100, 'rtvae');
                });
            }
            else if (status == 5106 || status == 4105) {
                console.log('x-m2m-rsc : ' + status + ' <----');

                setTimeout(setup_resources, 100, 'rtvae');
            }
            else {
                console.log('[???} create container error!  ', status + ' <----');
                // setTimeout(setup_resources, 3000, 'crtae');
            }
        });
    }
    else if (_status === 'rtvae') {
        onem2m_client.retrieve_ae(conf.ae.parent + '/' + conf.ae.name, function (status, res_body) {
            if (status == 2000) {
                var aeid = res_body['m2m:ae']['aei'];
                console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

                if(conf.ae.id != aeid && conf.ae.id != ('/'+aeid)) {
                    console.log('AE-ID created is ' + aeid + ' not equal to device AE-ID is ' + conf.ae.id);
                }
                else {
                    request_count = 0;
                    setTimeout(setup_resources, 100, 'crtct');
                }
            }
            else {
                console.log('x-m2m-rsc : ' + status + ' <----');
                // setTimeout(setup_resources, 3000, 'rtvae');
            }
        });
    }
    else if (_status === 'crtct') {
        console.log("@@@@@@@@@@@@@@")
        console.log("app.js에서의 crtct 부분")
        create_cnt_all(request_count, function (status, count) {
            if(status == 9999) {
                console.log('[???} create container error!');
                // setTimeout(setup_resources, 3000, 'crtct');
            }
            else {
                request_count = ++count;
                if (conf.cnt.length <= count) {
                    console.log(conf.cnt, "conf.cnt list 표기")
                    request_count = 0;
                    setTimeout(setup_resources, 100, 'delsub');
                }
            }
        });
    }
    else if (_status === 'delsub') {
        delete_sub_all(request_count, function (status, count) {
            if(status == 9999) {
                console.log('[???} create container error!');
                // setTimeout(setup_resources, 3000, 'delsub');
            }
            else {
                request_count = ++count;
                if (conf.sub.length <= count) {
                    request_count = 0;
                    setTimeout(setup_resources, 100, 'crtsub');
                }
            }
        });
    }
    else if (_status === 'crtsub') {
        create_sub_all(request_count, function (status, count) {
            if(status == 9999) {
                console.log('[???} create container error!');
                // setTimeout(setup_resources, 1000, 'crtsub');
            }
            else {
                request_count = ++count;
                if (conf.sub.length <= count) {
                    thyme_tas.ready_for_tas();

                    setTimeout(setup_resources, 100, 'crtci');
                }
            }
        });
    }
    else if (_status === 'crtci') {
        if(conf.sim == 'enable') {
            var period = 1000; //ms
            var cnt_idx = 0;
            setTimeout(timer_upload, 1000, period, cnt_idx);
        }
    }
}

onem2m_client.on('notification', function (source_uri, cinObj) {

    console.log(source_uri, cinObj);

    var path_arr = source_uri.split('/')
    var event_cnt_name = path_arr[path_arr.length-2];
    var content = cinObj.con;

    if(event_cnt_name === 'co2') {
        // send to tas
        if (socket_arr[path_arr[path_arr.length-2]] != null) {
            socket_arr[path_arr[path_arr.length-2]].write(JSON.stringify(content) + '<EOF>');
        }
    }
});

mqtt_connect();

var t_count = 0;

function timer_upload_action(cnt_idx, content, period) {
    if (sh_state == 'crtci') {
        var parent = conf.cnt[cnt_idx].parent + '/' + conf.cnt[cnt_idx].name;
        onem2m_client.create_cin(parent, cnt_idx, content, this, function (status, res_body, to, socket) {
            console.log('x-m2m-rsc : ' + status + ' <----');
        });

        setTimeout(timer_upload, 0, period, cnt_idx);
    }
    else {
        setTimeout(timer_upload, 1000, period, cnt_idx);
    }
}

function timer_upload(period, cnt_idx) {
    var content = JSON.stringify({value: 'TAS' + t_count++});
    setTimeout(timer_upload_action, period, cnt_idx, content, period);
}


/////////////////////////////////////////////////////////////////////////////////////



// function make_topic_list(){
//     var z2m_topic_list = [];
//     for (var i = 0; i < z2m_conf.device_list.length; i++){
//         z2m_topic_list.push(z2m_conf.base_topic + "/"+z2m_conf.device_list[i])
//     }
//     z2m_topic_list.push(z2m_conf.base_topic + "/bridge/event")
//     z2m_topic_list.push(z2m_conf.base_topic + "/bridge/response/device/remove")
//     z2m_topic_list.push(z2m_conf.base_topic + "/bridge/response/device/rename")
//     return z2m_topic_list;
// }

function make_topic_list(){
    var z2m_topic_list = {};
    var z2m_device_payload_topic = [];
    var z2m_event_topic = [];
    var device_list_IEEE = Object.keys(z2m_conf.device_list);
    for (var i = 0; i < device_list_IEEE.length; i++){
        z2m_device_payload_topic.push(z2m_conf.base_topic + "/"+z2m_conf.device_list[device_list_IEEE[i]]);
    }

    z2m_event_topic.push(z2m_conf.base_topic + "/bridge/event");
    z2m_event_topic.push(z2m_conf.base_topic + "/bridge/response/device/remove");
    z2m_event_topic.push(z2m_conf.base_topic + "/bridge/response/device/rename");

    z2m_topic_list.device_topic = z2m_device_payload_topic;
    z2m_topic_list.event_topic = z2m_event_topic;

    return z2m_topic_list;
}

function z2m_topic_update(udt_type, topic_type, new_topic){
    if(udt_type == "add"){
        console.log(new_topic, "- device & mqtt broker topic add");
        if(topic_type == "device"){
            z2m_device_payload_topic.push(new_topic);
            client.subscribe(new_topic);
        }
        else if(topic_type == "event"){
            z2m_event_topic.push(new_topic);
            client.subscribe(new_topic);
        }
    }

    else if(udt_type == "rename"){ // rename(topic add) -> remove(topic remove) 동시에 이루어져야함 topic sub도 빼내고, topic list var에서 해당 topic도 제거
        console.log(new_topic, "- device & mqtt broker topic rename");
        client.subscribe(new_topic);    
    }

    else if(udt_type == "remove"){
        console.log(new_topic, "- device & mqtt broker topic remove");
    }
}

function z2m_topic_init_sub(z2m_topic_list){
    for (var i = 0; i< z2m_topic_list.device_topic.length; i++){
        client.subscribe(z2m_topic_list.device_topic[i])
    };
    for (var i = 0; i< z2m_topic_list.event_topic.length; i++){
        client.subscribe(z2m_topic_list.event_topic[i])
    };
}

function mqtt_connect() {
    var z2m_topic_list = make_topic_list();     //z2m_topic_list -> {"device_topic" : [], "event_topic" : []}
    z2m_topic_init_sub(z2m_topic_list);

    client.on("message", function (topic, message) {
        mqtt_message_json = JSON.parse(message.toString());
        if (z2m_topic_list.device_topic.includes(topic)){   // mqtt broker event type -> upload device payload  
            let payload_owner = (topic.split('/')).at(-1);
            let device_list_IEEE = Object.keys(z2m_conf.device_list);
            for (var i = 0; i < device_list_IEEE.length; i ++){
                if(z2m_conf.device_list[device_list_IEEE[i]] == payload_owner){
                    var rn = device_list_IEEE[i];
                    var parent = "/Mobius/" + z2m_conf.base_topic + "/" + rn;
                    onem2m_client.create_z2m_cin(parent, mqtt_message_json, function(rsc, res_body){
                        // if (rsc == 5106 || rsc == 2001 || rsc == 4105){
                        //     console.log("z2m device CSE joined complete");
                        //     console.log(res_body);
                        // }
                        console.log("response code = ", rsc)
                        console.log(res_body)
                        console.log("device payload(CNT - CIN) upload complete")
                    })
                    break;
                } 
            }
        }

        else if (z2m_topic_list.event_topic.includes(topic)){   // mqtt broker event type -> occur GW event
            if (topic == z2m_conf.base_topic + "/bridge/event"){
                if(mqtt_message_json.type == 'device_joined'){
                    // device_standby_list.friendly_name = "device_joined";
                    console.log("device joined")
                }
                else if(mqtt_message_json.type == 'device_interview' && mqtt_message_json.data.status == 'successful'){
                    z2m_conf = z2m_conf_init();
                    console.log("device GW joined complete, removed at the list")
                    var parent = "/Mobius/zigbee2mqtt"
                    var rn = mqtt_message_json.data.friendly_name;
                    onem2m_client.create_z2m_cnt(parent, rn, function (rsc, res_body){
                        if (rsc == 5106 || rsc == 2001 || rsc == 4105){
                            console.log("z2m device CSE joined complete");
                            console.log(res_body);
                        }
                    });
                    var udt_z2m_topic = z2m_conf.base_topic + rn
                    z2m_topic_update("add", "device", udt_z2m_topic)
                }
            }

            else if (topic == z2m_conf.base_topic + "/bridge/response/device/remove"){
                if(mqtt_message_json.status == "ok"){
                    console.log("device remove on")
                    let fast_device_list = Object.keys(z2m_conf.device_list);   // fast device ieee list(cnt rn)
                    var delete_target_cnt_lbl = mqtt_message_json.data.id;
                    for(var count=0; count < fast_device_list.length; count++){
                        if(z2m_conf.device_list[fast_device_list[count]] == delete_target_cnt_lbl){
                            target = "/Mobius/zigbee2mqtt/"+fast_device_list[count];
                            console.log("remove 대상 : ", target);
                            onem2m_client.delete_z2m_cnt(target, function(rsc, res_body){
                                console.log(rsc);
                                console.log(res_body);
                            });
                            var udt_z2m_topic = z2m_conf.base_topic + fast_device_list[count];
                            z2m_topic_update("remove", "device", udt_z2m_topic)
                            break;
                        }
                    }
                }
            }

            else if (topic == z2m_conf.base_topic + "/bridge/response/device/rename"){
                if(mqtt_message_json.status == "ok"){
                    var udt_name = {"from" : mqtt_message_json.data.from,
                                    "to" : mqtt_message_json.data.to};
                    z2m_conf = z2m_conf_init();
                    // let meta_z2m_conf = yaml.load(fs.readFileSync("./configuration.yaml", { encoding: "utf-8" }));
                    let current_device_list = Object.keys(z2m_conf.device_list);
                    var update_lbl = mqtt_message_json.data.to;
                    console.log(current_device_list, "rename 동작 중");
                    console.log(update_lbl);
                    for(var i=0; i < current_device_list.length; i++){
                        if(z2m_conf.device_list[current_device_list[i]] == update_lbl){ // tree 방식으로 전환해보기
                            target = "/Mobius/zigbee2mqtt/"+ current_device_list[i];
                            console.log("rename 대상 : ", target)
                            onem2m_client.update_z2m_cnt(target, update_lbl, function (rsc, res_body){
                                if (rsc == 5106 || rsc == 2001 || rsc == 4105){
                                    console.log("z2m device cnt update complete")
                                    console.log(res_body);
                                }
                                else{
                                    console.log(res_body);
                                }
                            });
                            var udt_z2m_topic = z2m_conf.base_topic + '/' + update_lbl;
                            z2m_topic_update("rename", udt_name, udt_z2m_topic);
                            break;
                        }
                    }
                }
            }
        }
        // else if (topic == '')
    });
}
// module.exports = mqtt_connect;
