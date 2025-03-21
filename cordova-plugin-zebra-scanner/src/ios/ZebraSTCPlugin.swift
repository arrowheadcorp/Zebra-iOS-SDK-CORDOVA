import Foundation
import UIKit
import ZebraScannerSDK

@objc(ZebraSTCPlugin) class ZebraSTCPlugin: CDVPlugin, ISbtSdkApiDelegate {
    var apiInstance: ISbtSdkApi?
    var lastCommand: CDVInvokedUrlCommand?
    var listenCommand: CDVInvokedUrlCommand?
    var availableScanners: [SbtScannerInfo] = []
    var activeScanners: [SbtScannerInfo] = []
    var isListening = false
    
    override func pluginInitialize() {
        super.pluginInitialize()
        
        // Initialize arrays (redundant but safe)
        self.availableScanners = []
        self.activeScanners = []
        
        // Create SDK instance
        apiInstance = SbtSdkFactory.createSbtSdkApiInstance()
        
        // Check if SDK initialization was successful
        guard let api = apiInstance else {
            NSLog("ZebraSTCPlugin: ERROR - Failed to initialize Zebra Scanner SDK")
            return
        }
        
        NSLog("ZebraSTCPlugin: SDK initialized")
        
        // Configure operational mode for all scanners - MFi + BT LE (3)
        api.sbtSetOperationalMode(3) 
        
        // Enable discovery and scanner detection
        api.sbtEnableAvailableScannersDetection(true)
        api.sbtEnableBluetoothScannerDiscovery(true)
        
        // Subscribe to scanner events
        api.sbtSubsribe(forEvents: Int32(SBT_EVENT_SCANNER_APPEARANCE) |
                                 Int32(SBT_EVENT_SCANNER_DISAPPEARANCE) |
                                 Int32(SBT_EVENT_SESSION_ESTABLISHMENT) |
                                 Int32(SBT_EVENT_SESSION_TERMINATION) |
                                 Int32(SBT_EVENT_BARCODE))
        
        // Set delegate for events
        api.sbtSetDelegate(self)
        
        NSLog("ZebraSTCPlugin: Subscribed to scanner events")
    }
    
    @objc(generateSTCBarcode:)
    func generateSTCBarcode(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Generating STC barcode")
        
        // Store command reference
        self.lastCommand = command
        
        // Make sure SDK is initialized
        guard let sdkApi = apiInstance else {
            sendError("Scanner SDK not initialized.", command: command)
            return
        }
        
        // Get "setDefaults" parameter - default to false (keep current settings)
        let setDefaults = command.argument(at: 0) as? Bool ?? false
        
        // Get protocol type parameter
        let protocolType = command.argument(at: 1) as? String ?? "ble"
        
        // Define frame size for barcode image - create a UIImageView with the dimensions
        let screenWidth = UIScreen.main.bounds.width
        let screenHeight = UIScreen.main.bounds.height
        
        // Set the dimensions similar to what the sample app does
        let imageWidth = screenWidth * 0.7
        let imageHeight = screenHeight * 0.3
        let imageView = UIImageView(frame: CGRect(x: 0, y: 0, width: imageWidth, height: imageHeight))
        
        // Use the correct defaults setting based on the parameter
        let setDefaultsStatus = setDefaults ? SETDEFAULT_YES : SETDEFAULT_NO
        
        // Handle the different protocol types
        var barcodeImage: UIImage?
        
        if protocolType == "hid" {
            NSLog("ZebraSTCPlugin: Attempting HID protocol")
            
            // For HID, we'll try BLE and let the SDK handle the data
            barcodeImage = sdkApi.sbtGetPairingBarcode(
                BARCODE_TYPE_STC,
                withComProtocol: STC_SSI_BLE,
                withSetDefaultStatus: setDefaultsStatus,
                withImageFrame: imageView.frame
            )
        } else {
            // Standard BLE or MFi protocol
            let comProtocol = (protocolType == "mfi") ? STC_SSI_MFI : STC_SSI_BLE
            NSLog("ZebraSTCPlugin: Using \(protocolType) protocol")
            
            barcodeImage = sdkApi.sbtGetPairingBarcode(
                BARCODE_TYPE_STC,
                withComProtocol: comProtocol,
                withSetDefaultStatus: setDefaultsStatus,
                withImageFrame: imageView.frame
            )
        }
        
        if let finalImage = barcodeImage, let imageData = finalImage.pngData() {
            NSLog("ZebraSTCPlugin: Successfully created barcode image")
            let base64String = imageData.base64EncodedString()
            let pluginResult = CDVPluginResult(status: .ok, messageAs: base64String)
            self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
        } else {
            sendError("Failed to encode barcode image.", command: command)
        }
    }
    
    @objc(listenForBarcodes:)
    func listenForBarcodes(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Starting to listen for barcodes")
        
        // Store the command for callback later
        self.listenCommand = command
        self.isListening = true
        
        // Let JavaScript know we started listening
        let pluginResult = CDVPluginResult(status: .ok, messageAs: "Started listening for barcodes")
        pluginResult?.setKeepCallbackAs(true) // Keep the callback for future events
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    @objc(stopListening:)
    func stopListening(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Stopping barcode listening")
        
        self.isListening = false
        self.listenCommand = nil
        
        let pluginResult = CDVPluginResult(status: .ok, messageAs: "Stopped listening for barcodes")
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    @objc(getScanners:)
    func getScanners(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Getting scanner list")
        
        var scanners: [[String: Any]] = []
        
        // Convert available scanners to dictionaries
        for scanner in availableScanners {
            // No guard needed, just use the scanner directly
            let isActive = activeScanners.contains { $0.getScannerID() == scanner.getScannerID() }
            scanners.append([
                "id": scanner.getScannerID(),
                "name": scanner.getScannerName() ?? "Unknown",
                "model": scanner.getScannerModel() ?? "Unknown",
                "type": scanner.getConnectionType(),
                "isActive": isActive
            ])
        }
        
        let pluginResult = CDVPluginResult(status: .ok, messageAs: scanners)
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    @objc(connectScanner:)
    func connectScanner(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Connecting to scanner")
        
        guard let sdkApi = apiInstance else {
            sendError("Scanner SDK not initialized.", command: command)
            return
        }
        
        guard let scannerId = command.argument(at: 0) as? Int else {
            sendError("Missing or invalid scanner ID.", command: command)
            return
        }
        
        let result = sdkApi.sbtEstablishCommunicationSession(Int32(scannerId))
        if result == SBT_RESULT_SUCCESS {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: "Connecting to scanner \(scannerId)")
            self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
        } else {
            sendError("Failed to connect to scanner \(scannerId). Error: \(result)", command: command)
        }
    }
    
    @objc(disconnectScanner:)
    func disconnectScanner(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Disconnecting scanner")
        
        guard let sdkApi = apiInstance else {
            sendError("Scanner SDK not initialized.", command: command)
            return
        }
        
        guard let scannerId = command.argument(at: 0) as? Int else {
            sendError("Missing or invalid scanner ID.", command: command)
            return
        }
        
        let result = sdkApi.sbtTerminateCommunicationSession(Int32(scannerId))
        if result == SBT_RESULT_SUCCESS {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: "Disconnected scanner \(scannerId)")
            self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
        } else {
            sendError("Failed to disconnect scanner \(scannerId). Error: \(result)", command: command)
        }
    }
    
    @objc(forgetScanner:)
    func forgetScanner(command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin: Forgetting scanner")
        
        guard let scannerId = command.argument(at: 0) as? Int else {
            sendError("Missing or invalid scanner ID.", command: command)
            return
        }
        
        // Remove scanner from our lists
        availableScanners.removeAll { $0.getScannerID() == Int32(scannerId) }
        activeScanners.removeAll { $0.getScannerID() == Int32(scannerId) }
        
        // Note: This doesn't actually unpair the device from iOS Bluetooth settings
        // That would require the user to go to Settings > Bluetooth
        
        notifyScannerListChanged()
        
        let pluginResult = CDVPluginResult(status: .ok, messageAs: "Forgot scanner \(scannerId)")
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    private func sendError(_ message: String, command: CDVInvokedUrlCommand) {
        NSLog("ZebraSTCPlugin Error: \(message)")
        let pluginResult = CDVPluginResult(status: .error, messageAs: message)
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
    
    private func notifyScannerListChanged() {
        guard let command = self.lastCommand else { return }
        
        var scanners: [[String: Any]] = []
        
        // Convert available scanners to dictionaries
        for scanner in availableScanners {
            // No guard needed, just use the scanner directly
            let isActive = activeScanners.contains { $0.getScannerID() == scanner.getScannerID() }
            scanners.append([
                "id": scanner.getScannerID(),
                "name": scanner.getScannerName() ?? "Unknown",
                "model": scanner.getScannerModel() ?? "Unknown",
                "type": scanner.getConnectionType(),
                "isActive": isActive
            ])
        }
        
        let event: [String: Any] = [
            "type": "scannerListChanged",
            "scanners": scanners
        ]
        
        let pluginResult = CDVPluginResult(status: .ok, messageAs: event)
        pluginResult?.setKeepCallbackAs(true)
        self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
    }
            
    // MARK: - ISbtSdkApiDelegate methods
    
    func sbtEventScannerAppeared(_ availableScanner: SbtScannerInfo!) {
        NSLog("ZebraSTCPlugin: Scanner appeared: \(availableScanner.getScannerName() ?? "Unknown"), ID: \(availableScanner.getScannerID())")
        
        // Add scanner to the available list
        availableScanners.append(availableScanner)
        
        // Notify JavaScript about the scanner list change
        notifyScannerListChanged()
    }
    
    func sbtEventScannerDisappeared(_ scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Scanner disappeared: \(scannerID)")
        
        // Remove scanner from the available list
        availableScanners.removeAll { $0.getScannerID() == scannerID }
        
        // Notify JavaScript about the scanner list change
        notifyScannerListChanged()
    }
    
    func sbtEventCommunicationSessionEstablished(_ activeScanner: SbtScannerInfo!) {
        NSLog("ZebraSTCPlugin: Scanner connected: \(activeScanner.getScannerName() ?? "Unknown"), ID: \(activeScanner.getScannerID())")
        
        // Add to active scanners list
        activeScanners.append(activeScanner)
        
        // Notify JavaScript about the scanner connection
        let event: [String: Any] = [
            "type": "scannerConnected",
            "scanner": [
                "id": activeScanner.getScannerID(),
                "name": activeScanner.getScannerName() ?? "Unknown",
                "model": activeScanner.getScannerModel() ?? "Unknown",
                "type": activeScanner.getConnectionType()
            ]
        ]
        
        if let command = self.lastCommand {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: event)
            pluginResult?.setKeepCallbackAs(true)
            self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
        }
        
        // Auto-start listening if configured to do so
        if !isListening {
            NSLog("ZebraSTCPlugin: Auto-starting barcode listening for connected scanner")
            isListening = true
        }
        
        // Update scanner list
        notifyScannerListChanged()
    }
    
    func sbtEventCommunicationSessionTerminated(_ scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Scanner disconnected: \(scannerID)")
        
        // Remove from active scanners list
        activeScanners.removeAll { $0.getScannerID() == scannerID }
        
        // Find scanner name if possible
        let scannerName = availableScanners.first { $0.getScannerID() == scannerID }?.getScannerName() ?? "Unknown"
        
        // Notify JavaScript about the scanner disconnection
        let event: [String: Any] = [
            "type": "scannerDisconnected",
            "scanner": [
                "id": scannerID,
                "name": scannerName
            ]
        ]
        
        if let command = self.lastCommand {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: event)
            pluginResult?.setKeepCallbackAs(true)
            self.commandDelegate.send(pluginResult, callbackId: command.callbackId)
        }
        
        // Update scanner list
        notifyScannerListChanged()
    }
    
    func sbtEventBarcode(_ barcodeData: String!, barcodeType: Int32, fromScanner scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Received barcode (string): \(barcodeData ?? "nil"), type: \(barcodeType)")
    }
    
    func sbtEventBarcodeData(_ barcodeData: Data!, barcodeType: Int32, fromScanner scannerID: Int32) {
        guard isListening else { return }
        guard let data = barcodeData else {
            NSLog("ZebraSTCPlugin: Received nil barcode data")
            return
        }
        
        // Try to convert to string
        let barcodeText = String(data: data, encoding: .utf8) ?? "Unknown encoding"
        
        NSLog("ZebraSTCPlugin: Received barcode: \(barcodeText), type: \(barcodeType)")
        
        // Find scanner info
        let scanner = activeScanners.first { $0.getScannerID() == scannerID }
        let scannerName = scanner?.getScannerName() ?? "Unknown"
        
        // Create a dictionary with barcode information
        let result: [String: Any] = [
            "type": "barcodeScan",
            "data": barcodeText,
            "barcodeType": barcodeType,
            "scanner": [
                "id": scannerID,
                "name": scannerName
            ]
        ]
        
        // Send the barcode data to JavaScript
        if let command = self.listenCommand {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: result)
            pluginResult?.setKeepCallbackAs(true) // Keep the callback for future events
            self.commandDelegate?.send(pluginResult, callbackId: command.callbackId)
        }
        
        // Also send to main command for event handling
        if let command = self.lastCommand {
            let pluginResult = CDVPluginResult(status: .ok, messageAs: result)
            pluginResult?.setKeepCallbackAs(true)
            self.commandDelegate?.send(pluginResult, callbackId: command.callbackId)
        }
    }
    
    func sbtEventImage(_ imageData: Data!, fromScanner scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Received image from scanner: \(scannerID)")
    }
    
    func sbtEventVideo(_ videoFrame: Data!, fromScanner scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Received video from scanner: \(scannerID)")
    }
    
    func sbtEventFirmwareUpdate(_ fwUpdateEventObj: FirmwareUpdateEvent!) {
        NSLog("ZebraSTCPlugin: Firmware update event")
    }
    
    func sbtEventTrigger(_ triggerState: SBT_TRIGGER_STATE, fromScanner scannerID: Int32) {
        NSLog("ZebraSTCPlugin: Trigger event from scanner: \(scannerID)")
    }
}