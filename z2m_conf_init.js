let fs = require("fs");
let yaml = require("js-yaml");


var z2m_conf = {};

function make_z2m_conf(){
    let meta_z2m_conf = yaml.load(fs.readFileSync("./configuration.yaml", { encoding: "utf-8" })); // vs code dev env
    // let meta_z2m_conf = yaml.load(fs.readFileSync("/opt/zigbee2mqtt/data/configuration.yaml", { encoding: "utf-8" })); // rasp real env
    z2m_conf.base_topic = meta_z2m_conf.mqtt.base_topic;
    z2m_conf.mqtt_server = meta_z2m_conf.mqtt.server;
    
    device_ieee_list = Object.keys(meta_z2m_conf.devices);

    device_key_value_list = {};
    
    for (var count=0; count < device_ieee_list.length; count++){
      device_key_value_list[device_ieee_list[count]] = meta_z2m_conf.devices[device_ieee_list[count]].friendly_name;
    }
    z2m_conf.device_list = device_key_value_list;
    fs.writeFileSync("z2m_configuration.json", JSON.stringify(z2m_conf),'utf-8');
    return z2m_conf
}

module.exports = make_z2m_conf;
