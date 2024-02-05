var mqtt = require("mqtt");

var ip = '192.168.0.106';
const topic = 'zigbee2mqtt/0x54ef4410000e4bd2/set';
const message = '{"state" : "off"}';
const client = mqtt.connect('mqtt://192.168.0.106:1883');

client.on('connect', () => {
    console.log('Connected to the MQTT broker.');

    // Publish a message to a topic
    client.publish(topic, message, {}, (error) => {
        if (error) {
            console.error('Publish error:', error);
        } else {
            console.log(`Message published to topic '${topic}': ${message}`);
        }
        // Close the connection
        client.end();
    });
});

// Handle connection errors
client.on('error', (error) => {
    console.error('Connection error:', error);
});


// -------------------------------------------------------------------------- //

let control_map = {             // from sensor : to act device
    // "test_lumi": "led",
    "single_sw": "plug",
    "double_sw": "plug"
}

console.log(control_map);
console.log(control_map)
console.log(control_map[0])
console.log("-0-----")
if (control_map["plug"]) {
    console.log("plug")
    // let sensing_key = Object.keys(sensor[payload_owner])[0]
    // let target_act = control_map[payload_owner];
    // let sensing_value = mqtt_message_json[sensing_key]

    // if (typeof sensing_value === "number") {                       // type number -> threshold control
    //     console.log("threshold sensor - start device control")
    //     z2m_threshold_control(target_act, payload_owner, sensing_value)
    // }
    // else if (typeof sensing_value === "string") {                  // type string -> toggle control
    //     console.log("toggle sensor - start device control")
    //     z2m_toggle_control(target_act, payload_owner, sensing_value)
    // }

}

if (control_map["single_sw"]) {
    console.log("sw")

}