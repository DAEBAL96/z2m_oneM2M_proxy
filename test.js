const z2m_conf = require('./z2m_conf_init');

var check_obj = {"friendly_name" : "newtype"}

var test_obj = {"data" : {"friendly_name" : "abc", 
                          "type" : "type2"
                          },
                "type" : "device_joined"
                        }

// test_obj.newtype = "new"

// var deleted_source = check_obj.friendly_name;

// console.log(deleted_source)
// console.log(test_obj)

// delete test_obj[deleted_source]

// console.log(test_obj)

// // var z2m_conf = require('./z2m_conf_init.js');
// global.z2m_conf = require('./z2m_conf_init.js')
// // z2m_conf.make_z2m_conf();
// var z2m_data = z2m_conf();
// console.log(z2m_data)
// console.log(typeof z2m_data)
// z2m_data = JSON.stringify(z2m_data)
// console.log(z2m_data);
// console.log(typeof JSON.stringify(z2m_data))

var functest = function(a, b){
        console.log("fucntest 실행");
}

function test_includes(){
        var test_var = "led1";
        var test_array = ["led2", "led3"];
        console.log(test_array.includes(test_var));
        console.log(test_array.includes("led2"));
        console.log(typeof test_array)
}


function test_touch_array(){
        var test_array = "zigbee2mqtt/topic_owner"
        let payload_owner = (test_array.split('/')).at(-1);
        console.log(payload_owner);
}

test_touch_array();