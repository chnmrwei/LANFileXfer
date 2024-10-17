# LANFileXfer
LANFileXfer is a tool for transferring files over a local area network (LAN)

## Prerequisites
- Visual Studio Code
- Node.js and npm (comes with Node.js)
- Express
- Nodemon

## Getting Starteds
Clone the repository or download the ZIP:
```shell
git clone https://github.com/chnmrwei/LANFileXfer.git
```
Or download the ZIP file from the repository and extract it.


## Open the project in VSCode:

Navigate to the project folder and open it with Visual Studio Code.

Install dependencies:

In the terminal, install the required dependencies by running:

```shell
npm install
npm install express
npm install -g nodemon
```
Start the server:

In your terminal, run the following command to start the server using Nodemon:

```shell
npx nodemon ./server.js
```
Wait for the server to start. Once it's up and running, you'll see a message like this:


```shell
Server running on http://127.0.0.1:3000
```
Test the application:

Open a browser and go to http://127.0.0.1:3000 to test the file transfer functionality.

## When using

Usage
For Senders:

- Place the file(s) you want to send into the uploads folder located in the project directory.

- Once the files are placed, they will be available for transfer via the web interface.

For Receivers:

- Ensure you are on the same local network as the sender.

- In your browser, enter the internal IP address of the sender followed by the port number 3000. For example:


```shell
http://<sender-internal-ip>:3000
```
You can now view the available files and download them directly from the browser.

## Notes

- Network Configuration: Both the sender and receiver must be on the same local area network (LAN).
- Uploads Directory: The sender must place files in the uploads directory for them to be available to the receiver.
- Firewall: Make sure the necessary firewall rules are in place to allow traffic on port 3000 within the local network.
