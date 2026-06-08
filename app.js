/**
 * MODULE A: DATA STREAM TEMPLATE GENERATOR
 * Assembles valid PDF file structure arrays using binary tracking channels.
 */
var DocumentTemplate = {
    // Generates text format document layouts
    buildRawTextPDF: function(textData) {
        var escapedText = textData.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        var lines = [
            "%PDF-1.4",
            "1 0 obj", " << /Type /Catalog /Pages 2 0 R >> ", "endobj",
            "2 0 obj", " << /Type /Pages /Kids [3 0 R] /Count 1 >> ", "endobj",
            "3 0 obj", " << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >> ", "endobj",
            "4 0 obj", " << /Length " + (escapedText.length + 40) + " >> ", "stream",
            "BT /F1 14 Tf 50 780 Td 18 TL (" + escapedText + ") Tj ET", "endstream", "endobj",
            "xref", "0 5", "0000000000 65535 f ", "0000000009 00000 n ", "0000000058 00000 n ", "0000000115 00000 n ", "0000000282 00000 n ",
            "trailer", " << /Size 5 /Root 1 0 R >> ", "startxref", "450", "%%EOF"
        ];
        return this.stringToUintArray(lines.join("\n"));
    },

    // Generates raw image layouts from a clean flattened JPEG data stream
    buildRawImagePDF: function(jpegBase64Data) {
        // Strip out the base64 header string tag to isolate raw binary segments
        var dataSegments = jpegBase64Data.split(',');
        var binaryImg = atob(dataSegments[1]);
        var imgLength = binaryImg.length;

        // Structured PDF tracking objects mapping coordinates to a standard page canvas layout
        var head = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 25 >>\nstream\nq 612 0 0 792 0 0 cm /Im1 Do Q\nendstream\nendobj\n5 0 obj\n<< /Type /XObject /Subtype /Image /Width 612 /Height 792 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + imgLength + " >>\nstream\n";
        var tail = "\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000290 00000 n \n0000000366 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + (450 + imgLength) + "\n%%EOF";

        // Map allocation bytes completely
        var fullLength = head.length + imgLength + tail.length;
        var uintArray = new Uint8Array(fullLength);

        var offset = 0;
        for (var i = 0; i < head.length; i++) uintArray[offset++] = head.charCodeAt(i);
        for (var i = 0; i < imgLength; i++) uintArray[offset++] = binaryImg.charCodeAt(i);
        for (var i = 0; i < tail.length; i++) uintArray[offset++] = tail.charCodeAt(i);

        return uintArray;
    },

    stringToUintArray: function(str) {
        var buffer = new ArrayBuffer(str.length);
        var uintArray = new Uint8Array(buffer);
        for (var i = 0; i < str.length; i++) uintArray[i] = str.charCodeAt(i);
        return uintArray;
    }
};

/**
 * MODULE B: AUTOMATED FILE EXPORTER
 */
var PDFCompiler = {
    executeDownload: function(uintArrayData, defaultFilename) {
        var fileBlob = new Blob([uintArrayData], { type: "application/pdf" });
        var objectUrl = URL.createObjectURL(fileBlob);
        
        var hiddenLink = document.createElement("a");
        hiddenLink.href = objectUrl;
        hiddenLink.download = defaultFilename;
        
        document.body.appendChild(hiddenLink);
        hiddenLink.click();
        
        document.body.removeChild(hiddenLink);
        URL.revokeObjectURL(objectUrl);
    }
};

/**
 * MODULE C: MAIN INTERFACE FLOW CONTROLLER
 */
var AppController = {
    handleTextDownload: function() {
        var userText = document.getElementById("userInput").value || "";
        if (!userText.trim()) {
            alert("Please type some content text inside the box first!");
            return;
        }
        var bytes = DocumentTemplate.buildRawTextPDF(userText);
        PDFCompiler.executeDownload(bytes, "text-document.pdf");
    },

    handleImageDownload: function() {
        var fileField = document.getElementById("imageInput");
        if (!fileField.files || fileField.files.length === 0) {
            alert("Please upload an image file first!");
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            var tempImg = new Image();
            tempImg.src = e.target.result;
            
            tempImg.onload = function() {
                // UNIVERSAL FIX: Create an invisible canvas element to flatten the image
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                
                // Keep the structural mapping square matching standard bounds
                canvas.width = 612;
                canvas.height = 792;
                
                // Render whatever format you uploaded directly onto the background screen layer
                ctx.fillStyle = "#FFFFFF"; // Solid white backing canvas to prevent transparent clipping
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
                
                // Extract into an explicit, crisp JPEG data configuration line
                var standardJpegData = canvas.toDataURL("image/jpeg", 0.9);
                
                // Route stream straight to file compilers
                var imageBytes = DocumentTemplate.buildRawImagePDF(standardJpegData);
                PDFCompiler.executeDownload(imageBytes, "image-document.pdf");
            };
        };
        reader.readAsDataURL(fileField.files[0]);
    }
};
