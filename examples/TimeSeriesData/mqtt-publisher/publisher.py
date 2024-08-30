import time
import random
import paho.mqtt.client as mqtt

# Function to handle incoming messages


def on_message(client, userdata, message):
    print(
        f"Received message '{str(message.payload.decode('utf-8'))}' on topic '{message.topic}'")


# MQTT settings
broker_address = "mosquitto"
port = 1883
base_topic = "DemoValues/"
static_topic = "StaticStringValue"

# Connect to MQTT Broker
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "Client")
client.on_message = on_message
client.connect(broker_address, port)

# Subscribe to the static values topic
client.subscribe(static_topic)

# Start the network loop in a separate thread
client.loop_start()

try:
    # Publish a test message to static topic
    client.publish(static_topic, "test")

    while True:
        # Generate different types of dynamic data
        int_value = random.randint(0, 100)
        double_value = random.uniform(0.0, 100.0)
        bool_value = random.choice([True, False])
        string_value = random.choice(["Hello", "World", "Test", "MQTT"])

        # Publish dynamic data to respective subtopics
        client.publish(base_topic + "temperature", int_value)
        client.publish(base_topic + "speed", double_value)
        client.publish(base_topic + "boolProp", bool_value)
        client.publish(base_topic + "stringProp", string_value)

        # Wait for a short period before publishing the next set of values
        time.sleep(1)
except KeyboardInterrupt:
    # Stop the network loop if the script is interrupted
    client.loop_stop()
    client.disconnect()
