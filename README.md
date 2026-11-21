# IoT Water Level Monitoring System

A modular Node.js-based IoT water-level monitoring pipeline that
demonstrates sensor-packet decoding, water-level calculation, GPS
association, MQTT messaging, Elasticsearch storage, and a live web
dashboard.

> **Important hardware note:** The current project uses a simulated BLE
> packet to test the software pipeline. A physical BLE device was not
> successfully discovered or connected, and live Acconeer radar readings
> have not yet been validated. The sample packet format described below
> is a project-defined test format---not an official Acconeer or BLE
> protocol.

## Features

-   **Sensor packet decoding:** Parses a four-byte example packet into
    distance, status, and battery fields.
-   **Water-level calculation:** Calculates water height and tank fill
    percentage using a configured tank height.
-   **GPS integration:** Uses the browser Geolocation API to obtain
    latitude, longitude, and accuracy (with user permission).
-   **MQTT communication:** Publishes structured readings to a local
    Mosquitto broker and receives them through a subscriber.
-   **Elasticsearch storage:** Stores incoming readings and retrieves
    recent records.
-   **Web dashboard:** Displays the latest water level, fill percentage,
    distance, battery, historical chart, recent readings, and GPS
    information.
-   **Modular Node.js structure:** Separates BLE decoding, sensor
    calculations, MQTT, cloud storage, and web interface code.

## Technology Stack

  Technology                 Purpose
  -------------------------- --------------------------------------
  Node.js                    Backend runtime and data processing
  JavaScript                 Application and frontend logic
  Express.js                 Web server and REST API
  MQTT.js                    MQTT publisher/subscriber client
  Mosquitto                  Local MQTT broker
  Elasticsearch              Sensor reading storage and retrieval
  `@elastic/elasticsearch`   Elasticsearch Node.js client
  Docker Desktop             Runs Elasticsearch locally
  Browser Geolocation API    Retrieves browser-provided location
  Chart.js                   Displays historical readings

## Architecture

``` text
Simulated BLE Packet
        |
        v
   Packet Decoder
        |
        v
Water-Level Calculation
        |
        +----------> Latest GPS Location
        |                    |
        +--------------------+
                   |
                   v
             MQTT Publisher
                   |
                   v
              Mosquitto
                   |
                   v
             MQTT Subscriber
                   |
                   v
             Elasticsearch
                   |
                   v
              Express API
                   |
                   v
             Web Dashboard
```

## Project Structure

``` text
IoT-Water-Level-Monitor/
├── data/
│   └── gps_location.json
├── public/
│   ├── index.html
│   ├── style.css
│   ├── dashboard.js
│   └── gps.js
├── src/
│   ├── ble/
│   │   ├── decoder.js
│   │   └── testDecoder.js
│   ├── sensor/
│   │   ├── listPorts.js
│   │   └── waterLevel.js
│   ├── mqtt/
│   │   ├── publisher.js
│   │   └── subscriber.js
│   └── cloud/
│       ├── elasticsearch.js
│       └── testElasticsearch.js
├── server.js
├── .env
├── package.json
└── package-lock.json
```

*The exact file list may vary slightly with your final repository
version. Do not commit your local `.env` file or generated runtime data
unless intentionally required.*

## How the Data Is Decoded

For software testing, the project uses this example four-byte packet:

``` text
01 F4 01 64
```

  -----------------------------------------------------------------------
  Byte(s)                 Interpretation          Example
  ----------------------- ----------------------- -----------------------
  0--1                    Unsigned 16-bit         `0x01F4` = 500 mm
                          distance, big-endian,   
                          millimetres             

  2                       Sensor status code      `1`

  3                       Battery percentage      `100`
  -----------------------------------------------------------------------

The distance is converted from millimetres to centimetres:

``` text
500 mm = 50 cm
```

With a configured tank height of 200 cm:

``` text
Water level = Tank height - Measured distance
            = 200 - 50
            = 150 cm

Fill percentage = (Water level / Tank height) * 100
                = (150 / 200) * 100
                = 75%
```

**This is a simulated packet layout and sample calculation.** Replace it
with the verified byte format and scaling rules of the actual
sensor/gateway before connecting physical hardware.

## Prerequisites

Install or prepare the following:

-   [Node.js](https://nodejs.org/) (LTS recommended)
-   npm (included with Node.js)
-   [Mosquitto MQTT broker](https://mosquitto.org/)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-   A modern browser for the dashboard and geolocation test

The commands below use Windows PowerShell. Adjust paths and service
commands for your operating system.

## Installation

1.  Clone the repository:

    ``` powershell
    git clone <YOUR_GITHUB_REPOSITORY_URL>
    cd IoT-Water-Level-Monitor
    ```

2.  Install Node.js dependencies:

    ``` powershell
    npm install
    ```

3.  Create a `.env` file in the project root:

    ``` env
    MQTT_URL=mqtt://localhost:1883
    MQTT_TOPIC=waterlevel/sensor/data

    ELASTICSEARCH_URL=http://localhost:9200
    ELASTICSEARCH_INDEX=water-level-readings
    ```

    Ensure the environment variable names match those read by your
    application code. Keep credentials and secrets out of source
    control.

## Start the Services

Start the services in the following order. Keep each long-running
process open in its own terminal.

### 1. Start Elasticsearch

Start Docker Desktop and wait until its engine is running. Then run:

``` powershell
docker run -d --name waterlevel-elasticsearch -p 9200:9200 `
  -e "discovery.type=single-node" `
  -e "xpack.security.enabled=false" `
  -v waterlevel-es-data:/usr/share/elasticsearch/data `
  docker.elastic.co/elasticsearch/elasticsearch:9.5.6
```

Check the container:

``` powershell
docker ps
```

Check Elasticsearch:

``` powershell
Invoke-RestMethod http://localhost:9200
```

If the container already exists but is stopped, start it with:

``` powershell
docker start waterlevel-elasticsearch
```

### 2. Start the MQTT broker

Start Mosquitto. If its executable is available on your PATH:

``` powershell
mosquitto -v
```

Make sure the broker is listening at the URL configured in `.env`.

### 3. Start the MQTT subscriber

Open another terminal in the project directory:

``` powershell
node src/mqtt/subscriber.js
```

The subscriber listens for messages and stores received readings in
Elasticsearch.

### 4. Start the MQTT publisher

Open another terminal:

``` powershell
node src/mqtt/publisher.js
```

The publisher sends the simulated sensor readings to the configured MQTT
topic.

### 5. Start the web server

Open another terminal:

``` powershell
node server.js
```

Open the dashboard:

``` text
http://localhost:3000
```

Grant location permission in the browser if you want to test GPS
collection. Browser geolocation may return an approximate position
depending on the computer and available location services.

## API Endpoints

  ---------------------------------------------------------------------------
  Method                  Endpoint                   Description
  ----------------------- -------------------------- ------------------------
  `POST`                  `/api/gps`                 Receives browser
                                                     geolocation and saves
                                                     the latest location

  `GET`                   `/api/gps`                 Returns the latest saved
                                                     GPS location

  `GET`                   `/api/latest`              Returns the most recent
                                                     indexed sensor reading

  `GET`                   `/api/readings?limit=20`   Returns recent sensor
                                                     readings

  `GET`                   `/api/status`              Checks the backend's
                                                     Elasticsearch
                                                     retrieval/connectivity
                                                     status
  ---------------------------------------------------------------------------

Example URLs:

``` text
http://localhost:3000/api/status
http://localhost:3000/api/latest
http://localhost:3000/api/readings?limit=20
http://localhost:3000/api/gps
http://localhost:9200/water-level-readings/_search?pretty
```

The `/api/status` endpoint checks Elasticsearch access; it should not be
interpreted as proof that a physical sensor or BLE connection is active.

## Testing

Run the available project test scripts from the repository root:

``` powershell
node src/sensor/listPorts.js
node src/ble/testDecoder.js
node src/cloud/testElasticsearch.js
```

Then verify the complete data path:

1.  Confirm Docker and Elasticsearch are running.
2.  Confirm Mosquitto is running.
3.  Start the MQTT subscriber.
4.  Start the MQTT publisher.
5.  Start the Express server.
6.  Open the dashboard at `http://localhost:3000`.
7.  Check that new MQTT readings appear in Elasticsearch and are
    returned by the dashboard API.

Only mark a test as successful after observing its actual output.

## Hardware Integration Status and Limitations

-   **BLE:** The BLE scanner did not complete discovery because the
    Bluetooth adapter did not become powered on through the Noble
    library. The current pipeline therefore uses simulated BLE input.
-   **Packet protocol:** The four-byte packet format is illustrative and
    is not a verified protocol for the actual sensor or gateway.
-   **Acconeer hardware:** Confirm the exact sensor/module combination
    before physical integration. XM132 is associated with the A111
    generation; A121 requires a compatible A121 module, such as XM125.
    Do not describe XM132 as an A121 module.
-   **Radar acquisition:** Live A121 radar measurements have not been
    validated by this software pipeline. Use the vendor-supported tools
    and APIs to configure and verify the physical radar.
-   **GPS:** Browser geolocation depends on permission and device
    location services. It may not be as accurate as a dedicated GPS
    receiver.
-   **Tank calibration:** The example calculation assumes a 200 cm tank
    height. Configure this value to match the real tank and sensor
    mounting position.

## Security Notes

The Docker command above disables Elasticsearch security for local
development. Do not expose this instance or port `9200` to the public
internet. A production deployment should use authentication, TLS,
network restrictions, secure secret management, and least-privilege
access. Do not commit `.env` files containing credentials.

## Future Improvements

-   Connect and validate the actual BLE peripheral and document its GATT
    service and characteristic UUIDs.
-   Replace the simulated packet generator with verified live sensor
    data.
-   Add BLE reconnect handling and connection-state monitoring.
-   Add packet validation, unit tests, and clear error handling.
-   Add configurable tank dimensions and support for multiple devices.
-   Add water-level alerts and notifications.
-   Secure MQTT communication and Elasticsearch access.
-   Add automated end-to-end tests, deployment configuration, and
    monitoring.

## Contributing

Contributions and suggestions are welcome. For hardware-related changes,
include the exact device/module model and verified protocol details so
that simulated assumptions are not mistaken for real sensor behaviour.

## License

Add the license that applies to this repository (for example, MIT)
before publishing or reusing the project. No license is implied by this
README.
