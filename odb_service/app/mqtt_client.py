import json
import logging
import paho.mqtt.client as mqtt
import ssl
import uuid
import time
from app.config import MQTT_BROKER, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC_REQUEST, MQTT_TOPIC_RESPONSE, MQTT_CLIENT_ID, MQTT_KEEPALIVE, MQTT_TOPIC_DISTANCE
from app.utils.shared_state import shared_state

latest_message = None

mqtt_client = None

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[INFO] Web client connected to MQTT Broker")
        client.subscribe(MQTT_TOPIC_RESPONSE)
        client.subscribe(MQTT_TOPIC_DISTANCE)
    else:
        print(f"[ERROR] Web client failed to connect, return code {rc}")

def on_message(client, userdata, message):
    try:
        if message.topic == MQTT_TOPIC_RESPONSE:
            # Handle system stats response
            payload = json.loads(message.payload.decode())
            shared_state.latest_message = payload
            print(f"[INFO] Updated system stats: {payload}")
        
        elif message.topic == MQTT_TOPIC_DISTANCE:
            # Handle distance data
            distance_data = json.loads(message.payload.decode())
            shared_state.latest_distance = distance_data.get("distance")
            shared_state.latest_distance_timestamp = time.time()
            
            # Also update the latest message if it exists
            if shared_state.latest_message:
                shared_state.latest_message["distance"] = shared_state.latest_distance
                shared_state.latest_message["distance_timestamp"] = shared_state.latest_distance_timestamp
            
            print(f"[INFO] Updated distance: {shared_state.latest_distance} cm")
    
    except Exception as e:
        print(f"[ERROR] Failed to process message: {e}")

def start_mqtt():
    global mqtt_client
    
    if mqtt_client is None:
        mqtt_client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        
        # Enable TLS
        mqtt_client.tls_set(cert_reqs=ssl.CERT_NONE)
        
        # Set username and password
        mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        
        # Connect to the broker
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
        
        # Start the loop in a background thread
        mqtt_client.loop_start()
        print("[INFO] MQTT client started")

def send_mqtt_message():
    global mqtt_client
    
    if mqtt_client is None:
        init_mqtt_client()
    
    request_id = str(uuid.uuid4())
    payload = {
        "request_id": request_id,
        "timestamp": time.time()
    }
    
    mqtt_client.publish(MQTT_TOPIC_REQUEST, json.dumps(payload))
    print(f"[INFO] Request sent with ID: {request_id}")
    
    return request_id

# Initialize the client
start_mqtt()