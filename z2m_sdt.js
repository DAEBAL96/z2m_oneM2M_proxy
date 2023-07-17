var z2m_conf_init = require('./z2m_conf_init.js');
var Onem2mClient = require('./onem2m_client');
var mqtt = require("mqtt");


var z2m_conf = z2m_conf_init();
let z2m_topic_list = {};
let fs = require("fs");
let yaml = require("js-yaml");
const z2m_mqtt_client = mqtt.connect(z2m_conf.mqtt_server);
// const z2m_mqtt_client = mqtt.connect("mqtt://localhost");


let fcnt_device_model = {
    "0x000d6ffffe067c28" : "led",
    "0x00158d0004abc775" : "door_lock",
    "0x00158d00053dfa85" : "temp_sensor",
    "0x00158d00044e8f82" : "binary_switch"
};

let payload_map = {     // lock(int), lvl(int), poserSe(true, false), brigs(int), curT0(float)
    "contact" : "lock",
    "battery" : "lvl",
    "action" : "poserSe",
    "click" : "poserSe",
    "state" :"poserSe",
    "temperature" : "curT0",
    "brightness" : "brigs"
};

/* set device control conf */



//first key = sensor friend name
//second key = sensor sensing state name
//second value array = control state & value

//if value -> typeof === number ->  
let sensor = {    
    "single_sw" : {
        "click" : "single"
        //"click" : [single", "double"]
    },
    "door_sensor" : {
        "contact" : "true"
        //"contact" : ["true", "false"] -> door는 false 되어야하는 것 아닌가?
    },
    "double_sw" :{
        "action" : "left"
        //"action" : ["right", "left", "both"]
    }
    ,
    "test_lumi" : {
        "illuminance_lux" : {
            "over_low" : 100
            //"over_high" : 100,
        }
    }
};


//first key = actuator friend name
//second key = actuator control state name
//second value array = control state
let act = {
    /* set onoff act -> obj로 묶어서 분리*/
    "led" : {
        "state" : ["on", "off"] 
    },    
    "plug" : {
        "state" : ["on", "off"]
    }
    /* set actuator */
};

let control_map = {             // from sensor : to act device
    "test_lumi" : "led",
    "single_sw" : "plug",
    "double_sw" : "plug"
}


/***************************/



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

// function ae_response_action(status, res_body, callback) {
//     var aeid = res_body['m2m:ae']['aei'];
//     conf.ae.id = aeid;
//     callback(status, aeid);
// }

// function create_cnt_all(count, callback) {
//     if(conf.cnt.length == 0) {
//         callback(2001, count);
//     }
//     else {
//         if(conf.cnt.hasOwnProperty(count)) {
//             var parent = conf.cnt[count].parent;
//             console.log(parent)
//             var rn = conf.cnt[count].name;
//             console.log(rn)
//             onem2m_client.create_cnt(parent, rn, count, function (rsc, res_body, count) {
//                 if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
//                     create_cnt_all(++count, function (status, count) { 
//                         callback(status, count);
//                     });
//                 }
//                 else {
//                     callback(9999, count);
//                 }
//             });
//         }
//         else {
//             callback(2001, count);
//         }
//     }
// }

// function delete_sub_all(count, callback) {
//     if(conf.sub.length == 0) {
//         callback(2001, count);
//     }
//     else {
//         if(conf.sub.hasOwnProperty(count)) {
//             var target = conf.sub[count].parent + '/' + conf.sub[count].name;
//             onem2m_client.delete_sub(target, count, function (rsc, res_body, count) {
//                 if (rsc == 5106 || rsc == 2002 || rsc == 2000 || rsc == 4105 || rsc == 4004) {
//                     delete_sub_all(++count, function (status, count) {
//                         callback(status, count);
//                     });
//                 }
//                 else {
//                     callback(9999, count);
//                 }
//             });
//         }
//         else {
//             callback(2001, count);
//         }
//     }
// }

// function create_sub_all(count, callback) {
//     if(conf.sub.length == 0) {
//         callback(2001, count);
//     }
//     else {
//         if(conf.sub.hasOwnProperty(count)) {
//             var parent = conf.sub[count].parent;
//             var rn = conf.sub[count].name;
//             var nu = conf.sub[count].nu;
//             onem2m_client.create_sub(parent, rn, nu, count, function (rsc, res_body, count) {
//                 if (rsc == 5106 || rsc == 2001 || rsc == 4105) {
//                     create_sub_all(++count, function (status, count) {
//                         callback(status, count);
//                     });
//                 }
//                 else {
//                     callback('9999', count);
//                 }
//             });
//         }
//         else {
//             callback(2001, count);
//         }
//     }
// }

// setTimeout(setup_resources, 100, 'crtae');

// function setup_resources(_status) {
//     sh_state = _status;
    
//     console.log('[status] : ' + _status);

//     if (_status === 'crtae') {
//         onem2m_client.create_ae(conf.ae.parent, conf.ae.name, conf.ae.appid, function (status, res_body) {
//             console.log(res_body);
//             if (status == 2001) {
//                 ae_response_action(status, res_body, function (status, aeid) {
//                     console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');
//                     request_count = 0;

//                     setTimeout(setup_resources, 100, 'rtvae');
//                 });
//             }
//             else if (status == 5106 || status == 4105) {
//                 console.log('x-m2m-rsc : ' + status + ' <----');

//                 setTimeout(setup_resources, 100, 'rtvae');
//             }
//             else {
//                 console.log('[???} create container error!  ', status + ' <----');
//                 // setTimeout(setup_resources, 3000, 'crtae');
//             }
//         });
//     }
//     else if (_status === 'rtvae') {
//         onem2m_client.retrieve_ae(conf.ae.parent + '/' + conf.ae.name, function (status, res_body) {
//             if (status == 2000) {
//                 var aeid = res_body['m2m:ae']['aei'];
//                 console.log('x-m2m-rsc : ' + status + ' - ' + aeid + ' <----');

//                 if(conf.ae.id != aeid && conf.ae.id != ('/'+aeid)) {
//                     console.log('AE-ID created is ' + aeid + ' not equal to device AE-ID is ' + conf.ae.id);
//                 }
//                 else {
//                     request_count = 0;
//                     setTimeout(setup_resources, 100, 'crtct');
//                 }
//             }
//             else {
//                 console.log('x-m2m-rsc : ' + status + ' <----');
//                 // setTimeout(setup_resources, 3000, 'rtvae');
//             }
//         });
//     }
//     else if (_status === 'crtct') {
//         create_cnt_all(request_count, function (status, count) {
//             if(status == 9999) {
//                 console.log('[???} create container error!');
//                 // setTimeout(setup_resources, 3000, 'crtct');
//             }
//             else {
//                 request_count = ++count;
//                 if (conf.cnt.length <= count) {
//                     console.log(conf.cnt, "conf.cnt list out line")
//                     request_count = 0;
//                     setTimeout(setup_resources, 100, 'delsub');
//                 }
//             }
//         });
//     }
//     else if (_status === 'delsub') {
//         delete_sub_all(request_count, function (status, count) {
//             if(status == 9999) {
//                 console.log('[???} create container error!');
//                 // setTimeout(setup_resources, 3000, 'delsub');
//             }
//             else {
//                 request_count = ++count;
//                 if (conf.sub.length <= count) {
//                     request_count = 0;
//                     setTimeout(setup_resources, 100, 'crtsub');
//                 }
//             }
//         });
//     }
//     else if (_status === 'crtsub') {
//         create_sub_all(request_count, function (status, count) {
//             if(status == 9999) {
//                 console.log('[???} create container error!');
//                 // setTimeout(setup_resources, 1000, 'crtsub');
//             }
//             else {
//                 request_count = ++count;
//                 if (conf.sub.length <= count) {
//                     // thyme_tas.ready_for_tas();

//                     setTimeout(setup_resources, 100, 'crtci');
//                 }
//             }
//         });
//     }
//     else if (_status === 'crtci') {
//         if(conf.sim == 'enable') {
//             var period = 1000; //ms
//             var cnt_idx = 0;
//             setTimeout(timer_upload, 1000, period, cnt_idx);
//         }
//     }
// }

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

// function timer_upload_action(cnt_idx, content, period) {
//     if (sh_state == 'crtci') {
//         var parent = conf.cnt[cnt_idx].parent + '/' + conf.cnt[cnt_idx].name;
//         onem2m_client.create_cin(parent, cnt_idx, content, this, function (status, res_body, to, socket) {
//             console.log('x-m2m-rsc : ' + status + ' <----');
//         });

//         setTimeout(timer_upload, 0, period, cnt_idx);
//     }
//     else {
//         setTimeout(timer_upload, 1000, period, cnt_idx);
//     }
// }

// function timer_upload(period, cnt_idx) {
//     var content = JSON.stringify({value: 'TAS' + t_count++});
//     setTimeout(timer_upload_action, period, cnt_idx, content, period);
// }


/**************************************************************************************/

function init_topic_list(){
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
    // return z2m_topic_list;
}


function z2m_topic_update(udt_type, topic_type, udt_topic){ // topic_type = "device" , "event" , {"from" : , "to" : }

    if(udt_type == "add"){
        if(topic_type == "device"){
            z2m_topic_list.device_topic.push(udt_topic);
            z2m_mqtt_client.subscribe(udt_topic);
            console.log(udt_topic, "- device & mqtt broker topic add");
            console.log(z2m_topic_list)
        }
        else if(topic_type == "event"){
            console.log(udt_topic, "- device & mqtt broker topic add");
            // z2m_topic_list.event_topic.push(new_topic);
            z2m_mqtt_client.subscribe(udt_topic);
        }
    }

    else if(udt_type == "rename"){ // topic_type = {"from" : from_topic, "to" : to_topic}
        z2m_topic_list.device_topic = z2m_topic_list.device_topic.filter(element => element !== topic_type.from)
	z2m_topic_list.device_topic.push(udt_topic);
        console.log(udt_topic, "- device & mqtt broker topic rename");
        z2m_mqtt_client.subscribe(udt_topic);    
        console.log(z2m_topic_list)
    }

    else if(udt_type == "remove"){
        z2m_topic_list.device_topic = z2m_topic_list.device_topic.filter(element => element !== udt_topic)
        console.log(udt_topic, "- device & mqtt broker topic remove");
        console.log(z2m_topic_list)
    }
}

function z2m_topic_init_sub(z2m_topic_list){    // none CSE sub mqtt topic subscription -> to monitoring z2m device state
    for (var i = 0; i< z2m_topic_list.device_topic.length; i++){
        z2m_mqtt_client.subscribe(z2m_topic_list.device_topic[i])
    };
    for (var i = 0; i< z2m_topic_list.event_topic.length; i++){
        z2m_mqtt_client.subscribe(z2m_topic_list.event_topic[i])
    };
}

function device_control(){

}

let oneM2M_device_control = () =>{  // control by oneM2M CSE resource

}

let dynamic_toggle_sensor = () =>{ // sensor controle type = none static sensor

}

let z2m_toggle_control = (target_act, target_sensor, sensing_value) => {              
    
    try{                // binary act = only one state => [0]
                        // actuator = more than one state => [0]..[1]..[2]. => act[target].length > 1

        let target_set_topic = z2m_conf.base_topic +"/"+ target_act + "/set";
        let control_state_key = Object.keys(act[target_act])[0];         //"state"
        let act_value = act[target_act][control_state_key];              //["on", "off"]

        let sensor_state_key = Object.keys(sensor[target_sensor])[0];    //click
        let sensor_trigger = sensor[target_sensor][sensor_state_key];

        if(act_value.length === 2){          // act type = onoff act
            let control_payload = {}

            if(typeof sensor_trigger === "string"){ // one sensor_trigger 
                    if(sensing_value === sensor_trigger){   // CSE에서 제일 최신 con 긁는다? -> cin 많을수록 http core에서 시간 많이걸림
                                                            // module에 리소스 하나 할당해두고 거기에서 toggle 형식으로 바꾸기? -> init을 어케하지
                                                            // init 할 때만 resource에서 긁어오고 그 값을 최신으로 넣을까
                                                            // 해당 module 돌 때는 init 이지만 만약 센서 및 AE-cnt-cin이 존재하면?
                                                            // ... .고려해야할 것 ㅈㄴ 많네
                        console.log("toggle_control_payload1")
                        // request로 받고 con값이랑 반대되는 값을 넣어주면 된다.
                        z2m_mqtt_client.publish(target_set_topic, JSON.stringify(control_payload))
                    }
            }
            else if(typeof sensor_trigger === "object"){ // many sensor_trigger
                                                         // need to trigger-action map 
            }
        }

        else if(act_value.length > 2){           // act type = actuator
    
        }
    }
    
    catch(err){
        console.log(err)
        console.log("device control error - control type toggle")
    }
}

let z2m_threshold_control = (target_act, target_sensor, sensing_value) => {
    try{
        let target_set_topic = z2m_conf.base_topic +"/"+ target_act + "/set"
        let control_state_key = Object.keys(act[target_act])[0]
        let act_value = act[target_act][control_state_key]
        let sensor_state_key = Object.keys(sensor[target_sensor])[0]
        let sensor_thresholdtype = Object.keys(sensor[target_sensor][sensor_state_key])[0]
        let sensor_threshold = sensor[target_sensor][sensor_state_key][sensor_thresholdtype]

        if(act_value.length === 2){          // act type = onoff act
            let control_payload = {}

            if(sensor_thresholdtype === "over_high"){
                if(sensing_value >= sensor_threshold){
                    control_payload[control_state_key] = act_value[1];
                    console.log("threshold_control_payload1 : ", control_payload)
                    z2m_mqtt_client.publish(target_set_topic, JSON.stringify(control_payload))
                }
                else if(sensing_value < sensor_threshold){
                    control_payload[control_state_key] = act_value[0];
                    console.log("threshold_control_payload2 : ", control_payload)
                    z2m_mqtt_client.publish(target_set_topic, JSON.stringify(control_payload))
                }
            }

            else if(sensor_thresholdtype === "over_low"){
                if(sensing_value <= sensor_threshold){
                    control_payload[control_state_key] = act_value[0];
                    console.log("payload3 : ", control_payload)
                    z2m_mqtt_client.publish(target_set_topic, JSON.stringify(control_payload))
                }
                else if(sensing_value > sensor_threshold){
                    control_payload[control_state_key] = act_value[1];
                    console.log("payload4 : ", control_payload)
                    z2m_mqtt_client.publish(target_set_topic, JSON.stringify(control_payload))
                }
            }     
        }

        else if(act_value.length > 2){           // act type = actuator

        }
    }

    catch(err){
        console.log(err)
        console.log("device control error - control type threshold")
    }
}





function mqtt_connect() {
    init_topic_list();     //z2m_topic_list -> {"device_topic" : [], "event_topic" : []}
    console.log(z2m_topic_list)
    z2m_topic_init_sub(z2m_topic_list);

    z2m_mqtt_client.on("message", function (topic, message) {
        try{
            // console.log("message in - mqtt");
            // console.log("topic = ", topic);
            // console.log("message = ", message);
            mqtt_message_json = JSON.parse(message.toString());


            if (z2m_topic_list.device_topic.includes(topic)){   // mqtt broker event type -> upload payload  
                let payload_owner = (topic.split('/')).at(-1);
                let device_list_IEEE = Object.keys(z2m_conf.device_list);
                console.log("payload_owner = ", payload_owner)
                for (var i = 0; i < device_list_IEEE.length; i ++){
                    if(z2m_conf.device_list[device_list_IEEE[i]] == payload_owner){
                        var rn = device_list_IEEE[i];
                        var parent = "/Mobius/" + z2m_conf.base_topic + "/" + rn;
                        onem2m_client.create_z2m_cin(parent, mqtt_message_json, function(rsc, res_body){    // fcnt에선 만들 필요 없이 매번 update해주면 된다.
                            console.log("response code = ", rsc)
                            console.log(res_body)
                            console.log("device payload(CNT - CIN) upload complete")
                        })
                        break;
                    } 
                }
            }


            else if (z2m_topic_list.event_topic.includes(topic)){   // mqtt broker event type -> occur GW event -> new device z2m service joined
                if (topic == z2m_conf.base_topic + "/bridge/event"){
                    if(mqtt_message_json.type == 'device_joined'){
                        // device_standby_list.friendly_name = "device_joined";
                        console.log("device join scenario processing")
                    }
                    else if(mqtt_message_json.type == 'device_interview' && mqtt_message_json.data.status == 'successful'){
                        z2m_conf = z2m_conf_init();
                        console.log("device GW joined complete, removed at the list")
                        let parent = "/Mobius/" + z2m_conf.base_topic;  // parent = conf에서 지정한 ae.name = z2m_conf.base_topic으로 지정해줘야함
                        let rn = mqtt_message_json.data.ieee_address
                        let device_type = fcnt_device_model[mqtt_message_json.data.ieee_address];
                        onem2m_client.create_z2m_fcnt_device(parent, rn, device_type, function (rsc, res_body){ // device type에 따라서 device cnd 정해주고
                            if (rsc == 5106 || rsc == 2001 || rsc == 4105){
                                console.log("z2m device CSE joined complete at the type fcnt_device");
                                console.log(res_body);
                            }
                        });
                        var udt_z2m_topic = z2m_conf.base_topic + "/" + mqtt_message_json.data.friendly_name
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
                                target = "/Mobius/" + z2m_conf.base_topic + "/"+fast_device_list[count];
                                console.log("remove target : ", target);
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
    
                else if (topic == z2m_conf.base_topic + "/bridge/response/device/rename"){ //{"data":{"from":friends_name, "to":friedns_name}}
                    console.log("in rename flow")
                    if(mqtt_message_json.status == "ok"){
                        z2m_conf = z2m_conf_init();
                        // let meta_z2m_conf = yaml.load(fs.readFileSync("./configuration.yaml", { encoding: "utf-8" }));
                        let current_device_list = Object.keys(z2m_conf.device_list);
                        var update_lbl = mqtt_message_json.data.to;
                        var from_to_topic = {"from" : z2m_conf.base_topic + '/'+mqtt_message_json.data.from,
                                                "to" : z2m_conf.base_topic + '/'+mqtt_message_json.data.to};
                        console.log(current_device_list, "rename using");
                        console.log(update_lbl);
                        for(var i=0; i < current_device_list.length; i++){
                            if(z2m_conf.device_list[current_device_list[i]] == update_lbl){
                                target = "/Mobius/" + z2m_conf.base_topic + "/"+ current_device_list[i];
                                console.log("rename target : ", target)
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
                                z2m_topic_update("rename", from_to_topic, udt_z2m_topic);
                                break;
                            }
                        }
                    }
                }
            }
            // else if (topic == '')
        }
        catch(err){
            console.log("〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓")
            console.log("blank mqtt message(payload) response")
            // console.log("message = ", message)
            // console.log("err type = ", err)
            console.log("〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓〓")
        }
    });
}

// module.exports = mqtt_connect;
