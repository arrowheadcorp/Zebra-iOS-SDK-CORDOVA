// Scanner list and state
var scanners = [];
var isListening = false;
var refreshTimer = null;

// Add a logging function (for debugging)
function log(message) {
    console.log(message);
    var logElement = document.getElementById('logDisplay');
    if (logElement) {
        logElement.innerHTML += message + '<br>';
        logElement.scrollTop = logElement.scrollHeight;
    }
}

// Function to update the scanner list display
function updateScannerList() {
    var listElement = document.getElementById('scannerList');
    var statusElement = document.getElementById('scannerStatus');
    
    if (!listElement || !statusElement) return;
    
    if (scanners.length === 0) {
        listElement.innerHTML = '<p>No scanners available</p>';
        statusElement.innerHTML = 'No scanners found. Try pairing a scanner.';
        return;
    }
    
    var connectedCount = scanners.filter(function(s) { return s.isActive; }).length;
    statusElement.innerHTML = connectedCount + ' scanner(s) connected, ' + 
                              (scanners.length - connectedCount) + ' available';
    
    var html = '';
    scanners.forEach(function(scanner) {
        var isActive = scanner.isActive;
        html += '<div class="scanner-item">';
        html += '  <div class="scanner-info">';
        html += '    <div class="scanner-name">' + scanner.name;
        if (isActive) {
            html += ' <span class="active-badge">Connected</span>';
        }
        html += '    </div>';
        html += '    <div class="scanner-details">ID: ' + scanner.id + ' | Model: ' + scanner.model + '</div>';
        html += '  </div>';
        html += '  <div class="scanner-actions">';
        
        if (isActive) {
            html += '<button class="disconnect-btn" data-scanner-id="' + scanner.id + '">Disconnect</button>';
        } else {
            html += '<button class="connect-btn" data-scanner-id="' + scanner.id + '">Connect</button>';
        }
        
        html += '<button class="forget-btn" data-scanner-id="' + scanner.id + '">Forget</button>';
        
        html += '  </div>';
        html += '</div>';
    });
    
    listElement.innerHTML = html;
    
    // Add event listeners to buttons
    var connectButtons = document.querySelectorAll('.connect-btn');
    connectButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var scannerId = parseInt(this.getAttribute('data-scanner-id'));
            connectScanner(scannerId);
        });
    });

    var disconnectButtons = document.querySelectorAll('.disconnect-btn');
    disconnectButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var scannerId = parseInt(this.getAttribute('data-scanner-id'));
            disconnectScanner(scannerId);
        });
    });
    
    var forgetButtons = document.querySelectorAll('.forget-btn');
    forgetButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var scannerId = parseInt(this.getAttribute('data-scanner-id'));
            forgetScanner(scannerId);
        });
    });
}

// Function to connect to a scanner
function connectScanner(scannerId) {
    log("Connecting to scanner ID: " + scannerId);
    
    // Show connecting status
    var statusElement = document.getElementById('scannerStatus');
    if (statusElement) {
        statusElement.innerHTML = '<span class="loader"></span> Connecting to scanner...';
    }
    
    if (typeof ZebraSTCPlugin !== 'undefined') {
        ZebraSTCPlugin.connectScanner(scannerId, 
            function(result) {
                log("Connection initiated: " + result);
                // Refresh scanner list after a short delay
                setTimeout(refreshScanners, 1000);
            },
            function(error) {
                log("Error connecting to scanner: " + error);
                if (statusElement) {
                    statusElement.innerHTML = 'Error connecting to scanner: ' + error;
                }
                // Refresh scanner list after a short delay
                setTimeout(refreshScanners, 1000);
            }
        );
    }
}

// Function to disconnect a scanner
function disconnectScanner(scannerId) {
    log("Disconnecting scanner ID: " + scannerId);
    
    // Show disconnecting status
    var statusElement = document.getElementById('scannerStatus');
    if (statusElement) {
        statusElement.innerHTML = '<span class="loader"></span> Disconnecting scanner...';
    }
    
    if (typeof ZebraSTCPlugin !== 'undefined') {
        ZebraSTCPlugin.disconnectScanner(scannerId, 
            function(result) {
                log("Disconnection initiated: " + result);
                // Refresh scanner list after a short delay
                setTimeout(refreshScanners, 1000);
            },
            function(error) {
                log("Error disconnecting scanner: " + error);
                if (statusElement) {
                    statusElement.innerHTML = 'Error disconnecting scanner: ' + error;
                }
                // Refresh scanner list after a short delay
                setTimeout(refreshScanners, 1000);
            }
        );
    }
}

// Function to forget a scanner
function forgetScanner(scannerId) {
    log("Forgetting scanner ID: " + scannerId);
    
    // First check if scanner is connected
    var scanner = scanners.find(function(s) { return s.id === scannerId; });
    if (scanner && scanner.isActive) {
        // Disconnect first
        disconnectScanner(scannerId);
        setTimeout(function() {
            forgetScannerImpl(scannerId);
        }, 1500);
    } else {
        forgetScannerImpl(scannerId);
    }
}

// Implementation of forget scanner (unpair)
function forgetScannerImpl(scannerId) {
    // Show forgetting status
    var statusElement = document.getElementById('scannerStatus');
    if (statusElement) {
        statusElement.innerHTML = '<span class="loader"></span> Forgetting scanner...';
    }
    
    if (typeof ZebraSTCPlugin !== 'undefined' && 
        typeof ZebraSTCPlugin.forgetScanner !== 'undefined') {
        // If the plugin supports the forgetScanner method
        ZebraSTCPlugin.forgetScanner(scannerId, 
            function(result) {
                log("Scanner forgotten: " + result);
                // Remove from our local list
                scanners = scanners.filter(function(s) { return s.id !== scannerId; });
                updateScannerList();
                // Refresh scanner list after a short delay
                setTimeout(refreshScanners, 1000);
            },
            function(error) {
                log("Error forgetting scanner: " + error);
                if (statusElement) {
                    statusElement.innerHTML = 'Error forgetting scanner. You may need to unpair from Bluetooth settings.';
                }
                // Still refresh the list
                setTimeout(refreshScanners, 1000);
            }
        );
    } else {
        // If the plugin doesn't support forgetScanner, show instructions
        if (statusElement) {
            statusElement.innerHTML = 'To forget this scanner, go to iOS Settings > Bluetooth and tap "Forget This Device"';
        }
        // Remove from our local list anyway (the user will need to unpair manually)
        scanners = scanners.filter(function(s) { return s.id !== scannerId; });
        updateScannerList();
    }
}

// Function to refresh the scanner list
// Function to refresh the scanner list
function refreshScanners() {
    var statusElement = document.getElementById('scannerStatus');
    if (statusElement) {
        statusElement.innerHTML = '<span class="loader"></span> Searching for scanners...';
    }
    
    if (typeof ZebraSTCPlugin !== 'undefined') {
        ZebraSTCPlugin.getScanners(
            function(result) {
                // Add null check
                if (!result) {
                    log("Warning: Received null scanner list");
                    result = [];
                }
                
                scanners = result;
                log("Found " + scanners.length + " scanners");
                updateScannerList();
                
                // Schedule next refresh
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                }
                refreshTimer = setTimeout(refreshScanners, 10000); // Refresh every 10 seconds
            },
            function(error) {
                log("Error getting scanners: " + error);
                if (statusElement) {
                    statusElement.innerHTML = 'Error searching for scanners: ' + error;
                }
            }
        );
    } else {
        log("ZebraSTCPlugin is not available!");
        if (statusElement) {
            statusElement.innerHTML = 'Zebra Scanner plugin not available';
        }
    }
}

// Function to generate the pairing barcode
function generatePairingBarcode() {
    log("Generating pairing barcode");
    document.getElementById('errorMessage').style.display = 'none';
    
    var setDefaults = document.getElementById('setDefaults').checked;
    var protocol = document.getElementById('protocol').value;
    
    log("Options: setDefaults=" + setDefaults + ", protocol=" + protocol);
    
    if (typeof ZebraSTCPlugin !== 'undefined') {
        try {
            ZebraSTCPlugin.displayBarcode(
                'barcodeImage', 
                {
                    setFactoryDefaults: setDefaults,
                    protocol: protocol
                },
                'errorMessage'
            );
        } catch(e) {
            log("Exception when calling plugin: " + e.message);
        }
    } else {
        log("ZebraSTCPlugin is not available!");
    }
}

// Function to handle scanner events
function handleScannerEvent(event) {
    if (!event || !event.type) return;
    
    switch(event.type) {
        case 'scannerListChanged':
            scanners = event.scanners;
            log("Scanner list changed - found " + scanners.length + " scanners");
            updateScannerList();
            break;
            
        case 'scannerConnected':
            log("Scanner connected: " + event.scanner.name);
            // Auto-start listening if not already listening
            if (!isListening) {
                document.getElementById('listenButton').click();
            }
            
            // Auto-switch to scanning tab
            switchTab('scanning');
            
            // Refresh scanner list
            refreshScanners();
            break;
            
        case 'scannerDisconnected':
            log("Scanner disconnected: " + event.scanner.name);
            // Refresh scanner list
            refreshScanners();
            
            // Switch back to scanner list
            switchTab('scanners');
            break;
            
        case 'barcodeScan':
            handleBarcodeScan(event);
            break;
    }
}

// Function to handle barcode scans
function handleBarcodeScan(event) {
    log("Received barcode from " + event.scanner.name + ": " + event.data);
    
    // Update the test input field
    var scanTestField = document.getElementById('scanTest');
    if (scanTestField) {
        scanTestField.value = event.data;
        
        // Briefly highlight the field
        scanTestField.style.backgroundColor = '#28a745';
        setTimeout(function() {
            scanTestField.style.backgroundColor = '#333';
        }, 500);
    }

    // Try to find a focused input field
    var focusedField = document.activeElement;
    if (focusedField && 
        (focusedField.tagName === 'INPUT' || 
         focusedField.tagName === 'TEXTAREA') &&
        focusedField.id !== 'scanTest') {
        focusedField.value = event.data;
    }
}

// Function to switch tabs
function switchTab(tabId) {
    // Hide all tab contents
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    var tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Activate the selected tab
    document.getElementById(tabId + '-tab').classList.add('active');
    
    // Activate the corresponding button
    document.querySelector('.tab-btn[data-tab="' + tabId + '"]').classList.add('active');
}

// Initialize the app when device is ready
document.addEventListener('deviceready', function() {
    log("Device ready event fired!");
    
    // Set up clear fields button
    document.getElementById('clearFieldsButton').addEventListener('click', function() {
        document.getElementById('scanTest').value = '';
        document.getElementById('field1').value = '';
        document.getElementById('field2').value = '';
        document.getElementById('field3').value = '';
        log("All fields cleared");
    });
    
    // Set up tab navigation
    var tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Register for all scanner events
    if (typeof ZebraSTCPlugin !== 'undefined') {
        ZebraSTCPlugin.registerForEvents(
            handleScannerEvent,
            function(error) {
                log("Error registering for events: " + error);
            }
        );
    }
    
    // Set up Zebra barcode generation
    document.getElementById('generateButton').addEventListener('click', generatePairingBarcode);
    
    // Set up the barcode listening functionality
    document.getElementById('listenButton').addEventListener('click', function() {
        if (isListening) {
            log("Stopping barcode listening");
            ZebraSTCPlugin.stopListening(
                function() {
                    log("Stopped listening for barcodes");
                    isListening = false;
                    document.getElementById('listenButton').innerText = "Start Listening for Barcodes";
                    document.getElementById('listenButton').classList.remove('active');
                },
                function(error) {
                    log("Error stopping barcode listening: " + error);
                }
            );
        } else {
            log("Starting to listen for barcode scans...");
            
            if (typeof ZebraSTCPlugin !== 'undefined') {
                try {
                    ZebraSTCPlugin.listenForBarcodes(
                        function(result) {
                            if (result.type === 'barcodeScan') {
                                handleBarcodeScan(result);
                            }
                        },
                        function(error) {
                            log("Error listening for barcodes: " + error);
                        }
                    );
                    
                    // Change button style to indicate active listening
                    isListening = true;
                    this.innerText = "Stop Listening";
                    this.classList.add('active');
                } catch(e) {
                    log("Exception when setting up barcode listener: " + e.message);
                }
            } else {
                log("ZebraSTCPlugin is not available!");
            }
        }
    });
    
    // Make the scan test field look clickable
    document.getElementById('scanTest').addEventListener('click', function() {
        log("Scan test field clicked");
        if (isListening) {
            log("Already listening for barcodes");
        } else {
            document.getElementById('listenButton').click();
        }
    });
    
    // Set up refresh scanners button
    document.getElementById('refreshScannersButton').addEventListener('click', function() {
        refreshScanners();
    });
    
    // Initial scanner list refresh - do it immediately
    refreshScanners();
    
    // Set up auto refresh
    refreshTimer = setInterval(refreshScanners, 10000); // Refresh every 10 seconds
    
    // Auto-generate the pairing barcode when the app starts
    setTimeout(generatePairingBarcode, 500);
}, false);