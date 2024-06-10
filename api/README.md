# idapp-sconifier > API

This API is a Node.js server that will be running on a Linux VM.  

It is composed of one endpoint:

 - `/sconify`:
    - Takes a public dockerhub image as input,
    - builds a sconified image out of it,
    - and publish it to iExec "teamproduct" dockerhub

 - `/` or any other endpoint: will return a simple text (mostly to check if the server is running)

## pm2

pm2 is used to run the server in the background.

`npx pm2 list` to get the list of running processes.

`npx pm2 logs` to get the logs of the running processes.

`npx pm2 restart all` to restart all the running processes.

etc.

See https://pm2.keymetrics.io/docs/usage/quick-start/

## TODO

- [X] install docker on the VM
- [X] try to run the sconify.sh file on the VM => see the new image created
- [X] publish it on docker hub
- [X] publish a app contract FOR a Wallet (builder wallet)
- [X] have a look at `mrenclave` missing parameter
- [X] run it from our local machine
- [ ] Start Node.js server at VM startup + use something like `pm2` to keep it running
