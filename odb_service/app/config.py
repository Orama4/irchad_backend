import ssl
import logging
import uuid

# Configuration MQTT
MQTT_BROKER = "9f6d6fadb82c4fcba6aebc53d4b6cdf7.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "Esp_8266"
MQTT_PASSWORD = "Esp_8266"
MQTT_TOPIC_REQUEST = "system/request_stats"
MQTT_TOPIC_RESPONSE = "system/stats"
MQTT_TOPIC_DISTANCE = "sensor/distance"
MQTT_CLIENT_ID = "web-client-" + str(uuid.uuid4())
MQTT_KEEPALIVE = 60

# Configuration logging
logging.basicConfig(level=logging.INFO)
