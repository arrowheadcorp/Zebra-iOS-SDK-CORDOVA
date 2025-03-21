# Zebra Scanner Sample App

This is a sample Cordova application demonstrating the Zebra Scanner Cordova plugin. It provides a user interface for pairing Zebra scanners with iOS devices, scanning barcodes, and managing scanner connections.

## Features

- Pair with Zebra scanners using on-screen barcodes
- Connect and disconnect from paired scanners
- Scan barcodes to input fields
- Test scanner functionality

## Prerequisites

- iOS 11.0 or higher
- Compatible Zebra scanner (DS3678, LI3678, RFD8500, CS4070, DS8178, DS2278, CS6080, RS5100)
- Cordova CLI 9.0.0 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arrowheadcorp/Zebra-iOS-SDK-CORDOVA.git
   cd Zebra-iOS-SDK-CORDOVA/sample-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add iOS platform:
   ```bash
   cordova platform add ios
   ```

4. Build and run the app:
   ```bash
   cordova run ios
   ```

## Usage

### Pairing a Scanner

1. Navigate to the "Pairing" tab
2. Choose your desired settings:
   - Set Factory Defaults: Reset scanner to factory defaults
   - Protocol: Choose BLE (Bluetooth Low Energy), MFi, or HID
3. Tap "Generate Pairing Barcode"
4. Scan the displayed barcode with your Zebra scanner
5. The scanner will beep to confirm pairing

### Managing Scanners

1. Navigate to the "Scanners" tab
2. View list of available scanners
3. Connect or disconnect scanners using the buttons
4. Use "Forget" to remove a scanner from the list

### Testing Barcode Scanning

1. Navigate to the "Scanning" tab
2. Tap "Start Listening for Barcodes"
3. Scan a barcode with your connected scanner
4. The barcode data will appear in the input field
5. Try focusing on different input fields before scanning

## Troubleshooting

- If no scanners appear in the list, try refreshing or generating a new pairing barcode
- If you cannot connect to a scanner, make sure it's not already connected to another device
- To fully unpair a scanner, go to iOS Settings > Bluetooth and select "Forget This Device"

## License

This sample app is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
