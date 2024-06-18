# idapp-sconifier > CLI

This CLI provides an interface to guide you through different steps:

- Create a simple JavaScript app with the necessary structure to run on a
  decentralized worker,
- Test it locally, with or without Docker,
- Build a Docker image and push it to Docker Hub,
- Sconify it and get a TEE-compatible Docker image.

# Use it as a CLI (Globally)

### Install

```bash
npm i -g .
```

## Commands

### init

```bash
idapp init
```

### test

```bash
idapp test
```

You can add `--docker` option if you want to test as close as possible to the
workerpool environment

```bash
idapp test --docker
```

### deploy

This command, will ask you to choose if you want to deploy in debug or prod.

```bash
idapp deploy
```

If you already know the target environment you can set `--prod` or `--debug`
option to go faster

```bash
idapp deploy --debug
```

or

```bash
idapp deploy --prod
```

# Use it locally

## Commands

### --help

```bash
npm start
```

### init

```bash
npm run init
```

This will create a new `build` folder, ask you a few questions, init an npm
project, create some `./input` and `./output` folders.

### test-idapp

```bash
npm run test-idapp
npm run test-idapp --params your-name
```

### test-idapp --docker

```bash
npm run test-idapp:docker
npm run test-idapp:docker --params your-name
```

### deploy

You need to log in to docker before.

```bash
npm run deploy
```

### sconify

This will take a public Docker Hub image and wrap it into a TEE-compatible image
via Scone.

```bash
npm run sconify
```

### What's next?

The final test is to actually run you idapp on iExec stack:

ℹ️ You need to have iExec CLI installed. (More info
[here](https://protocol.docs.iex.ec/for-developers/quick-start-for-developers#install-the-iexec-sdk))

ℹ️ You need to be logged in with the same wallet as the one you gave at the
"sconify" step, when you were asked for your wallet public address.

```
iexec app run <appContractAddress> --tag tee,scone --workerpool debug-v8-bellecour.main.pools.iexec.eth --watch

Example:
iexec app run 0xc60a1e9941872de3d8c8a6afb368b1f8929a1ec1 --tag tee,scone --workerpool debug-v8-bellecour.main.pools.iexec.eth --watch

With one arg:
iexec app run 0xc60a1e9941872de3d8c8a6afb368b1f8929a1ec1 --tag tee,scone --workerpool debug-v8-bellecour.main.pools.iexec.eth --args Cédric --watch
```

To get logs about your running task:

```
iexec task debug <taskId> --logs --chain bellecour

Example:
iexec task debug 0x62ed16ebc52c9437af45f57dc30819254ce391633c090e125253726eb76e07b1 --logs --chain bellecour
```

To get the output of your task:

```
iexec task show <taskId> --download task-result.zip

Example:
iexec task show 0x62ed16ebc52c9437af45f57dc30819254ce391633c090e125253726eb76e07b1 --download task-result.zip
```

Unzip the downloaded file and you will find the output of your task in a
`result.txt` file.
