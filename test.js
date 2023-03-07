var mqtt = require("mqtt");
// const mqtt_client = mqtt.connect("mqtt://192.168.50.58:1883")



function test_obj_pick(){
    var act = {

        /* set binary act -> obj로 묶어서 분리*/
        "led" : {
            "state" : ["on", "off"] 
        },    
        "plug" : {
            "state" : ["on", "off"]
        }
    }

    var sensor = {
        "test_lumi" : {
            "illuminance_lux" : {
                "on_over" : 100
                //"off_over" : 50,
                //
            }
        }
    }
    console.log( Object.keys(act["led"])[0] )
    key=Object.keys(act["led"])[0]
    console.log(act["led"][key])
    console.log(act["led"][key].length)
    console.log(typeof 50)
    console.log(Object.keys(sensor["test_lumi"]["illuminance_lux"])[0])
};


function mqtt_test(){
    payload = {"state": "off"}
    mqtt_client.publish("zigbee2mqtt/led/set", JSON.stringify(payload))

    mqtt_client.on("message", function (topic, message){
        console.log("mqtt on func")
        console.log(topic);
        console.log(message)
    })

}


function type_check(){
    var bulb = "test"
    var bulb2 = "test"
    // console.log(typeof bulb)
    // console.log(typeof bulb2)
    if(typeof bulb === "number"){
        console.log("num")
    }
    else if(typeof bulb === "string"){
        console.log("str")
    }
}

let first_obj = () => {
    let test_obj ={ 
        "12" : {
            "34" : {
                "56" : "78"
            }

        }
    }

    console.log(test_obj["12"])
}

first_obj()
// test_obj_pick()
// mqtt_test()
// type_check()