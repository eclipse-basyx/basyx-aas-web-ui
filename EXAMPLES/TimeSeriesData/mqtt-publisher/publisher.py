import time
import random
import json
import paho.mqtt.client as mqtt

# MQTT settings
broker_address = "mosquitto"
port = 1883
base_topic = "EnvironmentalSensor/"
machine_topic = "MachineData/Status"

# Connect to MQTT Broker
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "Client")
client.connect(broker_address, port)

# Start the network loop in a separate thread
client.loop_start()

try:
    
    while True:
        # Generate different types of dynamic data
        temperatureValue = random.uniform(0, 30)
        humidityValue = random.uniform(0.0, 100.0)
        airQualityValue = random.uniform(0.0, 1000.0)

        # Publish dynamic data to respective subtopics
        client.publish(base_topic + "Temperature", temperatureValue)
        client.publish(base_topic + "Humidity", humidityValue)
        client.publish(base_topic + "AirQuality", airQualityValue)

        # Generate machine data as JSON with 3 variables
        machine_data = {
            "pressure": round(random.uniform(10.0, 50.0), 2),
            "vibration": round(random.uniform(0.1, 5.0), 2),
            "rpm": round(random.uniform(1000, 3000), 0)
        }
        
        # Publish JSON data to machine topic
        client.publish(machine_topic, json.dumps(machine_data))

        # Wait for a short period before publishing the next set of values
        time.sleep(1)
except KeyboardInterrupt:
    # Stop the network loop if the script is interrupted
    client.loop_stop()
    client.disconnect()
