package senso

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"io/ioutil"
	"os"

	"golang.org/x/crypto/openpgp"


	"github.com/dividat/driver/src/dividat-driver/firmware"
)

type SendMsg struct {
	progress func(string)
	failure  func(string)
	success  func(string)
}

// Disconnect from current connection
func (handle *Handle) ProcessFirmwareUpdateRequest(command UpdateFirmware, send SendMsg) {
	handle.log.Info("Processing firmware update request.")
	handle.firmwareUpdate.SetUpdating(true)

	if handle.cancelCurrentConnection != nil {
		send.progress("Disconnecting from the Senso")
		handle.cancelCurrentConnection()
	}

	binary, err := decodeImage(command.Image)
	if err != nil {
		msg := fmt.Sprintf("Error decoding base64 string: %v", err)
		send.failure(msg)
		handle.log.Error(msg)
		return
	}

	keyRingReader, err := os.Open("pubkey.asc.txt")
        if err != nil {
                fmt.Println(err)
                return
        }
	keyring, err := openpgp.ReadArmoredKeyRing(keyRingReader)
        if err != nil {
                fmt.Println("Read Armored Key Ring: " + err.Error())
                return
        }
	fmt.Println(keyring)

	image, err := unpackImage(binary, keyring)
	if err != nil {
		msg := fmt.Sprintf("Error checking image signature: %v", err)
		send.failure(msg)
		handle.log.Error(msg)
		return
	}

	err = firmware.UpdateBySerial(context.Background(), command.SerialNumber, image, send.progress)
	if err != nil {
		failureMsg := fmt.Sprintf("Failed to update firmware: %v", err)
		send.failure(failureMsg)
		handle.log.Error(failureMsg)
	} else {
		send.success("Firmware successfully transmitted")
	}
	handle.firmwareUpdate.SetUpdating(false)
}

func decodeImage(base64Str string) (io.Reader, error) {
	data, err := base64.StdEncoding.DecodeString(base64Str)
	if err != nil {
		return nil, err
	}
	return bytes.NewReader(data), nil
}

func unpackImage(imageReader io.Reader, keyRing openpgp.EntityList) (io.Reader, error) {
	msg, err := openpgp.ReadMessage(imageReader, keyRing, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("Could not read message: %v", err)
	}
	
	// The body must be read until EOF in order for signature flags to be valid
	_, err = ioutil.ReadAll(msg.UnverifiedBody)

	knownSignatories := keyRing.KeysById(msg.SignedByKeyId)
	if msg.SignatureError != nil || len(knownSignatories) == 0 {
		return nil, fmt.Errorf("No valid signature found")
	}

	return msg.UnverifiedBody, nil
}
