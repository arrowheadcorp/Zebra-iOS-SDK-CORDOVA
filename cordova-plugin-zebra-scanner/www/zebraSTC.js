var exec = require('cordova/exec');

var ZebraSTCPlugin = {
    /**
     * Generate an STC pairing barcode for a Zebra scanner using the current device's identity
     * @param {Object} options - Optional settings for barcode generation
     *                          {setFactoryDefaults: boolean, protocol: string ('ble'|'mfi'|'hid')}
     * @param {function} successCallback - Called with base64 image data on success
     * @param {function} errorCallback - Called with error message on failure
     */
    generateSTCBarcode: function(options, successCallback, errorCallback) {
        // Handle the case where options is omitted (first param is success callback)
        if (typeof options === 'function') {
            errorCallback = successCallback;
            successCallback = options;
            options = {};
        }
        
        var setFactoryDefaults = options && options.setFactoryDefaults === true;
        var protocol = options && options.protocol ? options.protocol : "ble";
        
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'generateSTCBarcode', [setFactoryDefaults, protocol]);
    },
    
    /**
     * Auto-generate and display barcode on the specified element
     * @param {string} elementId - ID of the IMG element to display the barcode
     * @param {Object} options - Optional settings for barcode generation
     *                          {setFactoryDefaults: boolean, protocol: string ('ble'|'mfi'|'hid')}
     * @param {string} errorElementId - Optional ID of element to display errors
     */
    displayBarcode: function(elementId, options, errorElementId) {
        // Handle the case where options is omitted or is the error element id
        if (typeof options === 'string') {
            errorElementId = options;
            options = {};
        } else if (!options) {
            options = {};
        }
        
        console.log("ZebraSTC: Attempting to generate and display barcode");
        
        this.generateSTCBarcode(
            options,
            // Success callback
            function(base64Image) {
                console.log("ZebraSTC: Successfully generated barcode");
                var imgElement = document.getElementById(elementId);
                if (imgElement) {
                    imgElement.src = 'data:image/png;base64,' + base64Image;
                    imgElement.style.display = 'block';
                } else {
                    console.error("ZebraSTC: Could not find element with ID: " + elementId);
                }
            },
            // Error callback
            function(error) {
                console.error("ZebraSTC Error: " + error);
                if (errorElementId) {
                    var errorElement = document.getElementById(errorElementId);
                    if (errorElement) {
                        errorElement.textContent = "Error generating barcode: " + error;
                        errorElement.style.display = 'block';
                    }
                }
            }
        );
    },
    
    /**
     * Register for scanner events (appearances, connections, barcode scans)
     * @param {function} eventCallback - Called when scanner events occur
     * @param {function} errorCallback - Called if there's an error
     */
    registerForEvents: function(eventCallback, errorCallback) {
        cordova.exec(
            function(event) {
                if (event && event.type) {
                    console.log("ZebraSTC: Received event - " + event.type);
                    eventCallback(event);
                } else if (typeof event === 'string') {
                    console.log("ZebraSTC: " + event);
                }
            },
            errorCallback,
            'ZebraSTCPlugin',
            'generateSTCBarcode',
            [false, "ble"]
        );
    },
    
    /**
     * Listen for barcode scan events from the connected scanner
     * @param {function} successCallback - Called when a barcode is scanned
     * @param {function} errorCallback - Called if there's an error
     */
    listenForBarcodes: function(successCallback, errorCallback) {
        cordova.exec(
            function(result) {
                if (typeof result === 'string') {
                    // This is the initial success message
                    console.log("ZebraSTC: " + result);
                } else if (result.type === 'barcodeScan') {
                    // This is a barcode event
                    console.log("ZebraSTC: Scanned barcode - " + result.data);
                    
                    // Auto-route barcode data to focused input field
                    var activeElement = document.activeElement;
                    if (activeElement && 
                        (activeElement.tagName === 'INPUT' || 
                         activeElement.tagName === 'TEXTAREA')) {
                        activeElement.value = result.data;
                        
                        // Trigger input event to notify any frameworks
                        var event = new Event('input', { bubbles: true });
                        activeElement.dispatchEvent(event);
                    }
                    
                    // Pass result to callback for custom handling
                    successCallback(result);
                }
            },
            errorCallback,
            'ZebraSTCPlugin',
            'listenForBarcodes',
            []
        );
    },
    
    /**
     * Stop listening for barcode events
     * @param {function} successCallback - Called when listening is stopped
     * @param {function} errorCallback - Called if there's an error
     */
    stopListening: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'stopListening', []);
    },
    
    /**
     * Get list of available and active scanners
     * @param {function} successCallback - Called with scanner list
     * @param {function} errorCallback - Called if there's an error
     */
    getScanners: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'getScanners', []);
    },
    
    /**
     * Connect to a specific scanner
     * @param {number} scannerId - ID of the scanner to connect to
     * @param {function} successCallback - Called when connection is initiated
     * @param {function} errorCallback - Called if there's an error
     */
    connectScanner: function(scannerId, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'connectScanner', [scannerId]);
    },
    
    /**
     * Disconnect a specific scanner
     * @param {number} scannerId - ID of the scanner to disconnect
     * @param {function} successCallback - Called when disconnection is initiated
     * @param {function} errorCallback - Called if there's an error
     */
    disconnectScanner: function(scannerId, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'disconnectScanner', [scannerId]);
    },
    
    /**
     * Forget (remove from list) a specific scanner
     * Note: This doesn't unpair from iOS Bluetooth settings
     * @param {number} scannerId - ID of the scanner to forget
     * @param {function} successCallback - Called when forget operation completes
     * @param {function} errorCallback - Called if there's an error
     */
    forgetScanner: function(scannerId, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, 'ZebraSTCPlugin', 'forgetScanner', [scannerId]);
    }
};

module.exports = ZebraSTCPlugin;
