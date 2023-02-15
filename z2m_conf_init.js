/* let con_dir = "/opt/zigbee2mqtt/data/";
let http = require("http"); */

let fs = require("fs");
let yaml = require("js-yaml");
//const { type } = require("os");

var z2m_conf = {};

function yamlToJson(yaml_str) {
  var yaml_obj = yaml.parse(yaml_str);
  var json_str = JSON.stringify(yaml_obj);
  return json_str;
}

// function make_init_z2m_conf(meta_z2m_conf){

function make_z2m_conf(){
    // let meta_z2m_conf = yaml.load(fs.readFileSync("./configuration.yaml", { encoding: "utf-8" })); // vs code dev env
    let meta_z2m_conf = yaml.load(fs.readFileSync("/opt/zigbee2mqtt/data/configuration.yaml", { encoding: "utf-8" })); // rasp real env
    console.log("make_z2m_conf 한 번 동작 - yaml 읽음")
    z2m_conf.base_topic = meta_z2m_conf.mqtt.base_topic;
    z2m_conf.mqtt_server = meta_z2m_conf.mqtt.server;
    
    device_ieee_list = Object.keys(meta_z2m_conf.devices);

    device_key_value_list = {};
    
    for (var count=0; count < device_ieee_list.length; count++){
      device_key_value_list[device_ieee_list[count]] = meta_z2m_conf.devices[device_ieee_list[count]].friendly_name;
    }
    z2m_conf.device_list = device_key_value_list;
    fs.writeFileSync("z2m_configuration.json", JSON.stringify(z2m_conf),'utf-8');
    // console.log(z2m_conf)
    return z2m_conf
  // else if(status == "update"){
  //   z2m_conf.device_list = update_device_list(meta_z2m_conf);
  //   fs.writeFileSync("z2m_configuration.json", JSON.stringify(z2m_conf),'utf-8');
  //   return z2m_conf
  // }
}

function update_device_list(meta_z2m_conf) {    // device freinds list make
  let device_ieee_list = Object.keys(meta_z2m_conf.devices);

  let device_list = [];
  var count = 0;
  
  while (count < device_ieee_list.length) {
    device_list.push(meta_z2m_conf.devices[device_ieee_list[count]].friendly_name);
    count = count + 1;
  }

  return device_list;
}

// make Mobius onem2m cin = payload conf
function make_device_payload(device_list, device_payload) {
  device_payload = device_list;
}

// make_z2m_conf();

//module.exports = z2m_conf;
module.exports = make_z2m_conf;


//console.log(z2m_conf);
//console.log(z2m_conf.mqtt_server)

//z2m_conf.device_list = update_device_list(meta_z2m_conf)

//console.log(device_list);

//while (i < device_list.length) {}
//console.log(z2m_conf.devices);

//console.log(Object.values(z2m_conf.devices));
//console.log(Object.entries(z2m_conf.devices));

//JSON.parse(z2m_conf.devices);

//let z2m_conf = fs.readFileSync("./configuration.yaml", "utf8"); // 인코딩 옵션 없을 시 Buffer 객체(바이너리 데이터) 반환
//console.log(yamlToJson(z2m_conf));
/* function yamlToJson(yaml_str) {
  var yaml_obj = yaml.parse(yaml_str);
  var json_str = JSON.stringify(yaml_obj);
  return json_str;
} */
