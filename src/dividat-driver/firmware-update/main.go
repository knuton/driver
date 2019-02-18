package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"time"

	"github.com/pin/tftp"
	"github.com/grandcat/zeroconf"
)

// Flags

var tftpPort = flag.String("p", "69", "TFTP port")
var configuredAddr = flag.String("a", "", "Senso address")
var imagePath = flag.String("i", "", "Firmware image path")
var controllerPort = "55567"

func init() {
	flag.Parse()
}

func main() {
	if *imagePath == "" {
		flag.PrintDefaults()
		return
	}
	
	mainCtx := context.Background()

	// Discover Senso IP
	var controllerHost string
	if *configuredAddr == "" {
		ctx, _ := context.WithTimeout(mainCtx, 5 * time.Second)
		discoveredAddr, err := discover("_sensoControl._tcp", ctx)
		if err != nil {
			abort("Could not discover Senso.")
		}

		controllerHost = discoveredAddr
	} else {
		controllerHost = *configuredAddr
	}

	// Request reboot into boot controller
	err := sendDfuCommand(controllerHost, controllerPort)
	if err != nil {
		abort(err.Error())
	}

	// Re-discover Senso IP in case it changes on reboot
	var dfuHost string
	if *configuredAddr == "" {
		ctx, _ := context.WithTimeout(mainCtx, 30 * time.Second)
		discoveredAddr, err := discover("_sensoUpdate._udp", ctx)
		if err != nil {
			// Try to discover boot controller via legacy identifier
			ctx, _ := context.WithTimeout(mainCtx, 30 * time.Second)
			legacyDiscoveredAddr, err := discover("_sensoControl._tcp", ctx)
			if err != nil {
				abort("Could not discover Senso.")
			}
			dfuHost = legacyDiscoveredAddr
		} else {
			dfuHost = discoveredAddr
		}
	} else {
		dfuHost = *configuredAddr
	}

	// Wait briefly after discovery to ensure proper TFTP startup
	time.Sleep(5 * time.Second)

	// Transmit firmware via TFTP
	err = putTFTP(dfuHost, *tftpPort, *imagePath)
	if err != nil {
		abort(err.Error())
	}
	fmt.Println("Firmware transmitted to Senso.")
}

func sendDfuCommand(host string, port string) error {
	// Header
	const PROTOCOL_VERSION = 0x00
	const NUMOFBLOCKS = 0x01
	reserve := bytes.Repeat([]byte{ 0x00 }, 6)
	header := append([]byte{ PROTOCOL_VERSION, NUMOFBLOCKS }, reserve...)

	// Message Body
	const BLOCKLENGTH = 0x0008
	const BLOCKTYPE_DFU = 0x00F0
	const MAGIC_KEY = 0xFA173CCD87664FBE
	body := make([]byte, 12)
	binary.LittleEndian.PutUint16(body[0:], BLOCKLENGTH)
	binary.LittleEndian.PutUint16(body[2:], BLOCKTYPE_DFU)
	binary.BigEndian.PutUint64(body[4:], MAGIC_KEY)

	command := append(header, body...)

	fmt.Printf("Connecting to %s:%s to send DFU command.\n", host, port)

	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%s", host, port))
	if err != nil {
		return fmt.Errorf("Could not dial connection to Senso controller: %v", err)
	}
	defer conn.Close()
	time.Sleep(1 * time.Second)

	_, err = io.Copy(conn, bytes.NewReader(command))
	if err != nil {
		return fmt.Errorf("Could not send DFU command: %v", err)
	}

	fmt.Printf("Sent DFU command to %s:%s.\n", host, port)

	return nil
}

func putTFTP(host string, port string, filePath string) error {
	c, err := tftp.NewClient(fmt.Sprintf("%s:%s", host, port))
	if err != nil {
		return fmt.Errorf("Could not create tftp client: %v", err)
	}
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("Could not open file: %v", err)
	}
	rf, err := c.Send(filepath.Base(*imagePath), "octet")
	if err != nil {
		return fmt.Errorf("Could not create send connection: %v", err)
	}
	n, err := rf.ReadFrom(file)
	if err != nil {
		return fmt.Errorf("Could not read from file: %v", err)
	}
	fmt.Printf("%d bytes sent\n", n)
	return nil
}

func discover(service string, ctx context.Context) (addr string, err error) {

	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		err = fmt.Errorf("Initializing discovery failed: %v", err)
		return
	}

	fmt.Printf("Starting discovery: %s\n", service)

	entries := make(chan *zeroconf.ServiceEntry)

	err = resolver.Browse(ctx, service, "local.", entries)
	if err != nil {
		err = fmt.Errorf("Browsing failed: %v", err)
		return
	}

	select {
	case entry := <-entries:
		if len(entry.AddrIPv4) != 1 {
			fmt.Printf("Multiple IPs found: %v\n", entry.AddrIPv4)
		}
		addr = entry.AddrIPv4[0].String()
	case <-ctx.Done():
		err = errors.New("Timed out trying to discover Senso.")
	}
	return
}

func abort(msg string) {
	fmt.Println(msg)
	os.Exit(1)
}
