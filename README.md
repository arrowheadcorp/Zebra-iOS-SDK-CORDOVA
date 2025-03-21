# Zebra iOS SDK Cordova

This repository contains a Cordova plugin that makes it easy to connect your Cordova app to Zebra scanners on iOS, letting you pair devices, scan barcodes, and manage connections—all with a simple JavaScript interface.

## Overview

The project consists of two main components:
1. **Cordova Plugin**: A reusable plugin that can be added to any Cordova project
2. **Sample App**: A complete Cordova application demonstrating how to use the plugin

## Prerequisites

- An **existing Cordova application** ready to integrate the plugin
- **Cordova CLI** version 9.0.0 or higher installed (`cordova -v` to check)
- **iOS 11.0 or higher** on your target device or simulator
- A **compatible Zebra scanner**, such as:
  - DS3678
  - LI3678
  - RFD8500
  - CS4070 (REV E Firmware and newer)
  - DS8178
  - DS2278
  - CS6080
  - RS5100
- **Bluetooth enabled** on your iOS device

## Installation

### Adding the Plugin to Your Project

1. **Install from GitHub:**
   ```bash
   cordova plugin add https://github.com/arrowheadcorp/Zebra-iOS-SDK-CORDOVA.git#main
   ```

   Or locally after cloning:
   ```bash
   git clone https://github.com/arrowheadcorp/Zebra-iOS-SDK-CORDOVA.git
   cordova plugin add ./Zebra-iOS-SDK-CORDOVA/cordova-plugin-zebra-scanner
   ```

2. **Add iOS platform (if not already added):**
   ```bash
   cordova platform add ios
   ```

3. **Build your project:**
   ```bash
   cordova build ios
   ```

### Running the Sample App

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arrowheadcorp/Zebra-iOS-SDK-CORDOVA.git
   cd Zebra-iOS-SDK-CORDOVA/sample-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Add iOS platform:**
   ```bash
   cordova platform add ios
   ```

4. **Run the app:**
   ```bash
   cordova run ios
   ```

## Usage

Here's a basic example of how to use the plugin in your JavaScript code:

```javascript
// Generate and display a pairing barcode
ZebraSTCPlugin.displayBarcode('barcodeImageElement', {
    setFactoryDefaults: true,
    protocol: 'ble'
}, 'errorMessageElement');

// Listen for barcode scans
ZebraSTCPlugin.listenForBarcodes(
    function(result) {
        console.log("Scanned barcode: " + result.data);
    },
    function(error) {
        console.error("Error: " + error);
    }
);

// Get a list of available scanners
ZebraSTCPlugin.getScanners(
    function(scanners) {
        console.log("Found " + scanners.length + " scanners");
    },
    function(error) {
        console.error("Error: " + error);
    }
);
```

For more detailed usage examples, see the [Sample App](./sample-app) and the [Plugin Documentation](./cordova-plugin-zebra-scanner).

## Features

- **Pairing**: Generate barcode images for pairing with Zebra scanners
- **Scanning**: Receive barcode scan data in your app
- **Connection Management**: Connect, disconnect, and get status of paired scanners
- **Scanner Detection**: Automatically detect and list available scanners
- **Event Handling**: Respond to scanner connection and disconnection events

## Documentation

For more detailed information, see:
- [Plugin Documentation](./cordova-plugin-zebra-scanner/README.md)
- [Sample App Documentation](./sample-app/README.md)

## Troubleshooting

### Common Issues

1. **Scanner not appearing in the list**
   - Ensure the scanner is powered on and in pairing mode
   - Check that Bluetooth is enabled on your iOS device
   - Try scanning the pairing barcode again

2. **Unable to connect to a scanner**
   - Make sure the scanner is within range
   - Check that the scanner is not already connected to another device
   - Try restarting the scanner

3. **Plugin not installing properly**
   - Verify you have the correct version of Cordova CLI installed
   - Check for any errors in the terminal output during installation
   - Ensure your iOS platform version is compatible

For more troubleshooting tips, see the [Plugin Documentation](./cordova-plugin-zebra-scanner/README.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Developed by Arrowhead Corporation
- Uses the Zebra Scanner SDK for iOS
