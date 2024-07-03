# idapp-cli

This CLI provides an interface to guide you through different steps:

- Create a simple JavaScript app with the necessary structure to run on a
  decentralized worker
- Test it locally, with or without Docker,
- Deploy and sconified your iDapp on the iexec protocol.

# Use it (Globally)

### Install

Be sure to use node >= v18

```sh
cd cli
npm ci
npm i -g .
```

## Commands

### `--help`

Command:

```bash
idapp --help
```

Description: Display help information about the `idapp-sconifier` CLI and its
available commands and options. This option provides a quick reference guide for
users to understand how to use each command effectively.

### `init`

Command:

```bash
idapp init
```

Description: Initialize the framework with the necessary structure to build your
iexec decentralized application.

---

### `test`

Command:

```bash
idapp test [--docker] [--param <input>]
```

Description: Test your iDapp locally. Use the `--docker` option to simulate the
workerpool environment closely. Optionally, use `--param` to provide input
parameter to your iDapp during testing.

---

### `deploy`

Command:

```bash
idapp deploy [--debug | --prod]
```

Description: Deploy your iDapp on the iexec protocol. Choose between deploying
in debug mode or production mode (`--debug` or `--prod`). Note that the
production mode option (`--prod`) will be available soon.

---

### `run`

Command:

```bash
idapp run <my-idapp-address> [--protectedData <protectedData-address>] [--debug | --prod]
```

Description: Run your deployed iDapp. Provide the address of your iDapp
(`<my-idapp-address>`). Optionally, if your iDapp processes protected data,
include the `--protectedData` option followed by the address of the protected
data.

### What's next?

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

---

### Encountered errors

> Error: (HTTP code 409) unexpected - can not get logs from container which is dead or marked for removal 

Is there a dangling image? Check on your Docker Desktop app. If so, delete it and retry.
