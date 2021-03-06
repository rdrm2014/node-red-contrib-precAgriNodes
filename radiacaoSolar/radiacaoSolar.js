module.exports = function (RED) {
    "use strict";
    var mqtt = require("mqtt");
    var util = require("util");
    var isUtf8 = require('is-utf8');
    var config = require('../package.json');

    function RadiacaoSolarNode(n) {
        RED.nodes.createNode(this, n);

        this.appKey = config.appKey;
        this.waspId = n.waspId;
        this.dataType = "radiation";

        //this.topic = "Final/" + this.appKey + "/" + this.waspId + "/Sensor/" + this.dataType;
        this.topic = n.topic;
        this.qos = 2;
        this.broker = n.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);

        if (!/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)) {
            return this.warn(RED._("mqtt.errors.invalid-topic"));
        }
        var node = this;
        if (this.brokerConn) {
            this.status({fill: "red", shape: "ring", text: "node-red:common.status.disconnected"});
            if (this.topic) {
                node.brokerConn.register(this);
                this.brokerConn.subscribe(this.topic, this.qos, function (topic, payload, packet) {
                    if (isUtf8(payload)) {
                        payload = payload.toString();
                    }
                    var msg = {topic: topic, payload: payload, qos: packet.qos, retain: packet.retain};
                    if ((node.brokerConn.broker === "localhost") || (node.brokerConn.broker === "127.0.0.1")) {
                        msg._topic = topic;
                    }
                    node.send(msg);
                }, this.id);
                if (this.brokerConn.connected) {
                    node.status({fill: "green", shape: "dot", text: "node-red:common.status.connected"});
                }
            }
            else {
                this.error(RED._("mqtt.errors.not-defined"));
            }
            this.on('close', function (done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id);
                    node.brokerConn.deregister(node, done);
                }
            });
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }

    RED.nodes.registerType("radiacaoSolar", RadiacaoSolarNode);
};
//
//module.exports = function(RED) {
//    function RemoteServerNode(n) {
//        RED.nodes.createNode(this,n);
//        this.host = n.host;
//        this.port = n.port;
//    }
//    RED.nodes.registerType("module",RemoteServerNode);
//}
