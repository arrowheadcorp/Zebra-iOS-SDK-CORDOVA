# Cordova Plugin for Zebra Scanner SDK

This Cordova plugin provides a JavaScript interface to the Zebra Scanner SDK for iOS, allowing you to integrate Zebra barcode scanners into your Cordova-based iOS applications.

## Installation

```bash
cordova plugin add cordova-plugin-zebra-scanner
```

Or directly from GitHub:

```bash
cordova plugin add https://github.com/arrowheadcorp/Zebra-iOS-SDK-CORDOVA.git#main
```

## Requirements

- iOS 11.0 or higher
- Cordova iOS platform 6.0.0 or higher
- Cordova CLI 9.0.0 or higher

## Supported Scanners

- DS3678
- LI3678
- RFD8500
- CS4070 (REV E Firmware and newer)
- DS8178
- DS2278
- CS6080
- RS5100

## API Reference

### Pairing

#### Generate Pairing Barcode

```javascript
ZebraSTCPlugin.generateSTCBarcode(
    options,
    successCallback,
    errorCallback
);
```

**Parameters:**
- `options` (Object): Configuration options
  - `setFactoryDefaults` (Boolean): Whether to reset scanner to factory defaults (default: false)
  - `protocol` (String): Communication protocol - 'ble', 'mfi', or 'hid' (default: 'ble')
- `successCallback` (Function): Called with base64-encoded image data on success
- `errorCallback` (Function): Called with error message on failure

#### Display Pairing Barcode

```javascript
ZebraSTCPlugin.displayBarcode(
    elementId,
    options,
    errorElementId
);
```

**Parameters:**
- `elementId` (String): ID of the IMG element to display the barcode
- `options` (Object): Configuration options (same as generateSTCBarcode)
- `errorElementId` (String): Optional ID of element to display errors

### Scanner Management

#### Get Available Scanners

```javascript
ZebraSTCPlugin.getScanners(
    successCallback,
    errorCallback
);
```

**Parameters:**
- `successCallback` (Function): Called with array of scanner objects
- `errorCallback` (Function): Called with error message on failure

**Scanner Object Properties:**
- `id` (Number): Scanner ID
- `name` (String): Scanner name
- `model` (String): Scanner model
- `type` (Number): Connection type
- `isActive` (Boolean): Whether scanner is currently connected

#### Connect to Scanner

```javascript
ZebraSTCPlugin.connectScanner(
    scannerId,
    successCallback,
    errorCallback
);
```

**Parameters:**
- `scannerId` (Number): ID of scanner to connect to
- `successCallback` (Function): Called when connection is initiated
- `errorCallback` (Function): Called with error message on failure

#### Disconnect Scanner

```javascript
ZebraSTCPlugin.disconnectScanner(
    scannerId,
    successCallback,
    errorCallback
);
```

**Parameters:**
- `scannerId` (Number): ID of scanner to disconnect
- `successCallback` (Function): Called when disconnection is initiated
- `errorCallback` (Function): Called with error message on failure

#### Forget Scanner

```javascript
ZebraSTCPlugin.forgetScanner(
    scannerId,
    successCallback,
    errorCallback
);
```

**Parameters:**
- `scannerId` (Number): ID of scanner to forget
- `successCallback` (Function): Called when forget operation completes
- `errorCallback` (Function): Called with error message on failure

### Barcode Scanning

#### Listen for Barcodes

```javascript
ZebraSTCPlugin.listenForBarcodes(
    successCallback,
    errorCallback
);
```

**Parameters:**
- `successCallback` (Function): Called when a barcode is scanned with a result object
- `errorCallback` (Function): Called with error message on failure

**Result Object Properties:**
- `type` (String): Always 'barcodeScan'
- `data` (String): Barcode data
- `barcodeType` (Number): Type of barcode
- `scanner` (Object): Scanner information
  - `id` (Number): Scanner ID
  - `name` (String): Scanner name

#### Stop Listening for Barcodes

```javascript
ZebraSTCPlugin.stopListening(
    successCallback,
    errorCallback
);
```

**Parameters:**
- `successCallback` (Function): Called when listening is stopped
- `errorCallback` (Function): Called with error message on failure

### Event Handling

#### Register for Scanner Events

```javascript
ZebraSTCPlugin.registerForEvents(
    eventCallback,
    errorCallback
);
```

**Parameters:**
- `eventCallback` (Function): Called when scanner events occur
- `errorCallback` (Function): Called with error message on failure

**Event Object Types:**
- `scannerListChanged`: List of available scanners changed
- `scannerConnected`: Scanner connected
- `scannerDisconnected`: Scanner disconnected
- `barcodeScan`: Barcode scanned

## Example Usage

```javascript
// Generate and display a pairing barcode
ZebraSTCPlugin.displayBarcode('barcodeImage', {
    setFactoryDefaults: true,
    protocol: 'ble'
}, 'errorMessage');

// Register for scanner events
ZebraSTCPlugin.registerForEvents(
    function(event) {
        switch(event.type) {
            case 'scannerListChanged':
                console.log("Scanner list changed: " + event.scanners.length + " scanners");
                break;
            case 'scannerConnected':
                console.log("Scanner connected: " + event.scanner.name);
                break;
            case 'scannerDisconnected':
                console.log("Scanner disconnected: " + event.scanner.name);
                break;
            case 'barcodeScan':
                console.log("Barcode scanned: " + event.data);
                break;
        }
    },
    function(error) {
        console.error("Error: " + error);
    }
);

// Get list of available scanners
ZebraSTCPlugin.getScanners(
    function(scanners) {
        scanners.forEach(function(scanner) {
            console.log("Scanner: " + scanner.name + " (ID: " + scanner.id + ")");
            
            // Connect to first scanner
            if (scanners.length > 0 && !scanners[0].isActive) {
                ZebraSTCPlugin.connectScanner(
                    scanners[0].id,
                    function(result) {
                        console.log("Connection initiated: " + result);
                    },
                    function(error) {
                        console.error("Error connecting: " + error);
                    }
                );
            }
        });
    },
    function(error) {
        console.error("Error getting scanners: " + error);
    }
);

// Listen for barcode scans
ZebraSTCPlugin.listenForBarcodes(
    function(result) {
        console.log("Scanned barcode: " + result.data);
    },
    function(error) {
        console.error("Error: " + error);
    }
);
```

## Troubleshooting

### Scanner Not Appearing in List

- Make sure Bluetooth is enabled on your iOS device
- Ensure the scanner is powered on and in range
- Check that the scanner is in pairing mode (consult scanner documentation)

### Unable to Connect to Scanner

- Verify the scanner is not already connected to another device
- Try restarting the scanner
- Ensure you have the correct permissions in your app's Info.plist

### Barcode Scanning Not Working

- Confirm the scanner is properly connected (check `isActive` property)
- Verify you've called `listenForBarcodes` before attempting to scan
- Make sure the scanner is configured to output data (scan the pairing barcode again)

## License

This plugin is licensed under the MIT License - see the LICENSE file for details.
